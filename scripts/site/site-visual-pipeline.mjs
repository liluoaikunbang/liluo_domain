import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  characterShowcaseCompositionRules,
  buildCharacterShowcasePromptFragment,
  buildLiluoHairColorPromptFragment,
  buildLiluoIdentityPromptFragment,
  buildLiluoLookPromptFragment,
  buildLiluoSafetyPromptFragment,
  collaborationTracks,
  developmentStatuses,
  evidenceLevels,
  footerNavigation,
  generalVisualSeedSets,
  liluoProfile,
  navigation,
  posterStyleAuthorities,
  productionPhases,
  publicScreenshotSources,
  publishedAssetDescriptors,
  roadmapItems,
  series,
  siteConfig,
  visualFeedbackArchiveRules,
  visualFeedbackLedger,
  worlds,
} from '../../src/content/site/siteBlueprint.js'
import {
  imagePromptAssemblyLayers,
  imageRuleEnforcementModes,
  imageRuleKinds,
  imageRuleNarrowingPolicy,
  imageRulePersistenceLevels,
  imageRulePlacementQuestions,
  imageRuleScopes,
  runImagePromptGovernancePreflight,
  validateImageRuleCard,
} from '../../src/content/site/imageGenerationGovernance.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..', '..')
const outDir = path.join(root, 'src', 'content', 'site')
const docsDir = path.join(root, 'docs')
const schemasDir = path.join(root, 'schemas')
const visualRegistryPath = path.join(outDir, 'site-visual-asset-registry.json')
const screenshotBriefsPath = path.join(outDir, 'site-screenshot-briefs.json')
const publishedManifestPath = path.join(outDir, 'site-published-manifest.json')
const planSummaryPath = path.join(outDir, 'site-plan-summary.json')
const r2ManifestPath = path.join(root, 'docs', 'assets', 'registry', 'website-r2-manifest.json')
const generatedAt = '2026-08-02'
const buildRef = 'local-site-upgrade-2026-08-02'
const requiredBatchSize = 24
const promptModel = 'gpt-image-2'

const args = process.argv.slice(2)
const command = args[0] || 'plan'
const dryRun = args.includes('--dry-run')

const planStatusRank = ['planned', 'promptReady', 'generated', 'qaApproved', 'published']
const publicationRank = ['review_required', 'internal_only', 'public_safe']
const liluoPromptRequiredSnippets = [
  `${liluoProfile.age} 岁刚成年的成年女性`,
  '红色瞳孔',
  liluoProfile.hairColorProfile.everydayLighting.baseHex,
  liluoProfile.hairColorProfile.everydayLighting.shadowHex,
  liluoProfile.hairColorProfile.everydayLighting.highlightHex,
  '身高锚点约 150cm',
  '体态带自然曲线与轻微丰润感',
  '脸型为柔和鹅蛋脸',
  '不画成尖下巴或瓜子脸',
  '不幼态',
]

async function main() {
  const state = await buildState()
  validateVisualFeedbackLedger()

  switch (command) {
    case 'plan':
      await runPlan(state)
      return
    case 'manifest':
      await writeOutput(publishedManifestPath, state.publishedManifest)
      await writeOutput(planSummaryPath, state.planSummary)
      console.log(JSON.stringify({ ok: true, manifestPath: toRepo(publishedManifestPath), summaryPath: toRepo(planSummaryPath) }, null, 2))
      return
    case 'audit':
      await writeDocs(state)
      console.log(JSON.stringify({ ok: true, auditPath: 'docs/site/site-current-audit-2026-08-02.md' }, null, 2))
      return
    case 'status':
      console.log(JSON.stringify(state.planSummary.counts, null, 2))
      return
    case 'validate-prompts':
      validatePrompts(state.visualRegistry)
      console.log(JSON.stringify({ ok: true, promptCount: state.visualRegistry.length }, null, 2))
      return
    case 'diversity':
      console.log(JSON.stringify(buildDiversityReport(state.visualRegistry), null, 2))
      return
    case 'process':
      console.log(JSON.stringify(buildProcessReport(state.publishedManifest), null, 2))
      return
    case 'screenshots-validate':
      validateScreenshots(state.screenshotBriefs)
      console.log(JSON.stringify({ ok: true, screenshotCount: state.screenshotBriefs.length }, null, 2))
      return
    case 'links-check':
      validateLinks(state)
      console.log(JSON.stringify({ ok: true, routeCount: [...navigation, ...footerNavigation].length }, null, 2))
      return
    case 'performance-check':
      console.log(JSON.stringify(buildPerformanceReport(state), null, 2))
      return
    default:
      throw new Error(`Unknown command: ${command}`)
  }
}

async function buildState() {
  const r2Manifest = JSON.parse(await fs.readFile(r2ManifestPath, 'utf8'))
  const r2BySource = new Map()
  for (const item of r2Manifest.assets || []) {
    if (item.sourcePath) r2BySource.set(normalizePath(item.sourcePath), item)
  }

  const publishedManifest = publishedAssetDescriptors.map((descriptor) => {
    const sourcePath = normalizePath(descriptor.sourcePath)
    const manifestItem = r2BySource.get(sourcePath)
    const published = manifestItem?.published?.variants ?? {}
    return {
      ...descriptor,
      sourcePath,
      generatedAt,
      status: manifestItem?.status || 'local-ready',
      evidenceLevel: descriptor.kind === 'runtime-capture' ? 'runtime-capture' : descriptor.kind === 'documentation' ? 'documentation' : 'concept',
      sourceType: manifestItem?.source || (descriptor.kind === 'runtime-capture' ? 'real-screenshot' : 'gpt-image-2'),
      width: published.large?.width || published.medium?.width || null,
      height: published.large?.height || published.medium?.height || null,
      urls: manifestItem
        ? {
            thumb: published.thumb?.url || null,
            card: published.medium?.url || null,
            content: published.medium?.url || published.large?.url || null,
            large: published.large?.url || published.medium?.url || null,
          }
        : {},
    }
  })

  const publishedById = Object.fromEntries(publishedManifest.map((item) => [item.id, item]))
  const visualRegistry = buildVisualRegistry(publishedById)
  const screenshotBriefs = buildScreenshotBriefs()
  validatePrompts(visualRegistry)
  validateScreenshots(screenshotBriefs)
  const planSummary = buildPlanSummary({ publishedManifest, publishedById, visualRegistry, screenshotBriefs })
  return { publishedManifest, publishedById, visualRegistry, screenshotBriefs, planSummary }
}

async function runPlan(state) {
  if (!dryRun) {
    await fs.mkdir(outDir, { recursive: true })
    await fs.mkdir(docsDir, { recursive: true })
    await fs.mkdir(schemasDir, { recursive: true })
    await writeOutput(visualRegistryPath, state.visualRegistry)
    await writeOutput(screenshotBriefsPath, state.screenshotBriefs)
    await writeOutput(publishedManifestPath, state.publishedManifest)
    await writeOutput(planSummaryPath, state.planSummary)
    await writeOutput(path.join(schemasDir, 'visual-asset.schema.json'), buildVisualAssetSchema())
    await writeOutput(path.join(schemasDir, 'image2-prompt.schema.json'), buildPromptSchema())
    await writeOutput(path.join(schemasDir, 'screenshot-brief.schema.json'), buildScreenshotSchema())
    await writeDocs(state)
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        counts: state.planSummary.counts,
        files: {
          visualRegistry: toRepo(visualRegistryPath),
          screenshotBriefs: toRepo(screenshotBriefsPath),
          publishedManifest: toRepo(publishedManifestPath),
          planSummary: toRepo(planSummaryPath),
        },
      },
      null,
      2,
    ),
  )
}

function buildVisualRegistry(publishedById) {
  const entries = []
  const baseline = buildLiluoBaselineEntries(publishedById)
  entries.push(...baseline)
  entries.push(...buildGeneralEntries('brand', generalVisualSeedSets.brand, publishedById))

  for (const world of worlds) {
    entries.push(...buildWorldAtlasEntries(world, publishedById).slice(0, 24))
  }

  entries.push(...buildGeneralEntries('collaboration', generalVisualSeedSets.collaboration, publishedById))

  const remainingAtlas = []
  const remainingLiluo = []
  const allBranchEntries = []

  for (const world of worlds) {
    const atlas = buildWorldAtlasEntries(world, publishedById)
    remainingAtlas.push(...atlas.slice(24))
    remainingLiluo.push(...buildLiluoWorldEntries(world, publishedById).slice(4))
    allBranchEntries.push(...buildBranchEntries(world, publishedById))
  }

  entries.push(...buildGeneralEntries('system', generalVisualSeedSets.system, publishedById))
  entries.push(...buildGeneralEntries('support', generalVisualSeedSets.support, publishedById))
  entries.push(...buildGeneralEntries('evidence', generalVisualSeedSets.evidence, publishedById))
  entries.push(...buildGeneralEntries('brandExpansion', generalVisualSeedSets.brand, publishedById))
  entries.push(...remainingAtlas)
  entries.push(...remainingLiluo)
  entries.push(...allBranchEntries)

  entries.forEach((entry, index) => {
    const batchNumber = Math.floor(index / requiredBatchSize)
    entry.batchId = `B${String(batchNumber).padStart(2, '0')}`
    entry.batchOrder = (index % requiredBatchSize) + 1
  })
  return entries
}

function buildLiluoBaselineEntries(publishedById) {
  const entries = []
  const frames = [
    { id: 'portrait', label: '纵向全身角色海报', shotType: 'full-body', backgroundPriority: false },
    { id: 'mid-shot', label: '中距离全身角色构图', shotType: 'full-body', backgroundPriority: false },
    { id: 'full-body', label: '全身动作构图', shotType: 'full-body', backgroundPriority: false },
    { id: 'environmental', label: '人物与环境构图', shotType: 'environmental', backgroundPriority: true },
  ]
  for (const world of worlds) {
    const looks = world.liluoLooks
    frames.forEach((frame, index) => {
      const look = looks[index % looks.length]
      entries.push(
        createEntry({
          id: `visual-liluo-baseline-${world.id}-${frame.id}`,
          title: `璃落·${world.name}·基线 ${index + 1}`,
          collection: 'liluo-character',
          world,
          pageTargets: ['home-liluo', 'characters', `world-${world.id}`],
          proofBoundary: '用于公开身份基线与视觉 QA，不声明玩法落地。',
          publicationStatus: 'public_safe',
          promptStatus: 'promptReady',
          evidenceLevel: 'concept',
          shotType: frame.shotType,
          timeOfDay: ['day', 'dawn', 'dusk', 'night'][index % 4],
          weather: ['clear', 'overcast', 'indoor', 'windy'][index % 4],
          visualLanguage: 'editorial-character-sheet',
          tags: ['璃落', world.name, '身份基线', look.hair, look.outfit, look.sock || '袜子细节'],
          previewAssetId: publishedById[`pub-liluo-${world.id}-variant`] ? `pub-liluo-${world.id}-variant` : 'pub-liluo-portrait',
          brief: {
            focus: `${world.name}中的公开身份基线`,
            composition: frame.label,
            subject: `${look.hair}，${look.outfit}，${look.sock || '袜子细节'}`,
            use: 'Batch 00 身份参考与审核基准',
          },
          prompt: [
            `为璃落宇宙官网生成一张公开安全的角色基线图，主题是“璃落在${world.name}中的稳定身份”。`,
            `${buildLiluoIdentityPromptFragment()}；${buildLiluoHairColorPromptFragment()}；${buildLiluoLookPromptFragment(look)}。`,
            `画面需要把她与${world.name}的空间关系讲清楚：${world.tagline}，周围可见${world.zones[index % world.zones.length].scene}，但不要把概念图写成已可玩。`,
            `${buildCharacterShowcasePromptFragment(frame.backgroundPriority)}。镜头采用${frame.label}，时间为${['白昼', '黎明', '黄昏', '夜间'][index % 4]}，环境气质强调${world.atmosphere}。`,
            `色彩以${world.palette.accent}、${world.palette.soft}和${world.palette.deep}代表的世界色板为主，保持明亮可读、留出网页排版安全区，不在图中生成文字、Logo 或水印。`,
            `${buildLiluoSafetyPromptFragment()}。禁止现有 IP 影子和无法公开的私密元素。`,
          ].join(' '),
        }),
      )
    })
  }
  return entries
}

function buildLiluoWorldEntries(world, publishedById) {
  const actions = [
    { id: 'observe', label: '观察', detail: '在空间中停下判断局势' },
    { id: 'walk', label: '行走', detail: '带着目的穿过一个真实会被使用的场景' },
    { id: 'work', label: '工作', detail: '正在完成一项具体劳动' },
    { id: 'read', label: '阅读', detail: '处理文档、线索或长期资料' },
    { id: 'assist', label: '协助', detail: '与其他成年人一起完成事务' },
    { id: 'rest', label: '短暂休息', detail: '在世界里停下来而不是摆拍' },
  ]
  const frames = [
    { id: 'portrait', label: '纵向角色封面', aspect: '4:5' },
    { id: 'mid', label: '中景叙事镜头', aspect: '16:9' },
    { id: 'full', label: '全身动作镜头', aspect: '16:9' },
    { id: 'env', label: '人物与环境共同叙事', aspect: '21:9' },
  ]
  const entries = []
  let counter = 0
  for (const action of actions) {
    for (const frame of frames) {
      const look = world.liluoLooks[counter % world.liluoLooks.length]
      const zone = world.zones[counter % world.zones.length]
      entries.push(
        createEntry({
          id: `visual-liluo-${world.id}-${action.id}-${frame.id}`,
          title: `璃落·${world.name}·${action.label}·${frame.label}`,
          collection: 'liluo-character',
          world,
          pageTargets: ['characters', 'gallery', `world-${world.id}`],
          proofBoundary: '公开角色视觉，不描述未确认剧情结果。',
          publicationStatus: 'public_safe',
          promptStatus: 'promptReady',
          evidenceLevel: 'concept',
          shotType: frame.id,
          timeOfDay: ['dawn', 'day', 'dusk', 'night'][counter % 4],
          weather: ['clear', 'overcast', 'interior', 'wind'][counter % 4],
          visualLanguage: 'narrative-character-illustration',
          tags: ['璃落', world.name, action.label, frame.label, look.hair, look.outfit, look.sock || '袜子细节'],
          previewAssetId: `pub-liluo-${world.id}-variant`,
          brief: {
            focus: `${world.name}中的璃落角色变化`,
            composition: frame.label,
            subject: `${action.label} / ${look.hair} / ${look.outfit} / ${look.sock || '袜子细节'}`,
            use: '角色页、世界页、图鉴',
          },
          prompt: [
            `为璃落宇宙官网生成一张${world.name}角色视觉，主题是“璃落在${world.name}中${action.detail}”。`,
            `${buildLiluoIdentityPromptFragment()}；${buildLiluoHairColorPromptFragment()}；${buildLiluoLookPromptFragment(look)}。`,
            `场景放在${zone.label}：${zone.scene}，重点表现${zone.detail}，让人物与环境都能成立，而不是一张居中站姿图。`,
            `镜头采用${frame.label}，画面比例偏向${frame.aspect}，需要保留足够留白供网页信息叠加，避免图像文字。`,
            `时间/天气提示为${['黎明', '白昼', '黄昏', '夜间'][counter % 4]}与${['晴朗', '阴天', '室内灯光', '起风'][counter % 4]}，强调${world.atmosphere}。`,
            `${buildLiluoSafetyPromptFragment()}。不使用现有 IP 与可读文字。`,
          ].join(' '),
        }),
      )
      counter += 1
    }
  }
  return entries
}

function buildWorldAtlasEntries(world, publishedById) {
  const times = [
    { id: 'dawn', label: '黎明', light: '低角度晨光与刚开始活动的人流' },
    { id: 'day', label: '白昼', light: '清晰日照与完整运行状态' },
    { id: 'dusk', label: '黄昏', light: '暖冷交替的边界时刻' },
    { id: 'night', label: '夜晚', light: '受控灯光与更强空间层次' },
  ]
  const shots = [
    { id: 'establishing', label: '建立镜头', composition: '宽幅建立镜头，优先读空间秩序' },
    { id: 'lived-in', label: '生活中景', composition: '中景，突出人在空间中的使用痕迹' },
    { id: 'detail', label: '细节近景', composition: '近景切入材质、器物与重复劳动' },
    { id: 'circulation', label: '流动镜头', composition: '带前景遮挡的通行视角，强调路径和停留' },
  ]
  const entries = []
  for (const zone of world.zones) {
    for (const time of times) {
      for (const shot of shots) {
        const index = entries.length
        entries.push(
          createEntry({
            id: `visual-world-${world.id}-${zone.id}-${time.id}-${shot.id}`,
            title: `${world.name}·${zone.label}·${time.label}·${shot.label}`,
            collection: 'world-atlas',
            world,
            pageTargets: ['worlds', `world-${world.id}`, 'gallery'],
            proofBoundary: '世界 atlas 只表达公开安全环境与生活切片，不把概念图写成可玩证据。',
            publicationStatus: 'public_safe',
            promptStatus: 'promptReady',
            evidenceLevel: 'concept',
            shotType: shot.id,
            timeOfDay: time.id,
            weather: ['clear', 'haze', 'interior', 'wind'][index % 4],
            visualLanguage: 'world-atlas-poster',
            tags: [world.name, zone.label, time.label, shot.label, '世界 atlas'],
            previewAssetId:
              shot.id === 'establishing'
                ? `pub-world-${world.id}-poster`
                : shot.id === 'detail'
                  ? `pub-world-${world.id}-event`
                  : `pub-world-${world.id}-scene`,
            brief: {
              focus: `${world.name}世界 atlas`,
              composition: `${time.label} / ${shot.label}`,
              subject: zone.label,
              use: '世界页、首页、图鉴、分享素材',
            },
            prompt: [
              `为璃落宇宙官网生成一张${world.name}世界 atlas 视觉，位置是${zone.label}。`,
              `这个世界的公开方向是“${world.tagline}”，场景必须表现${zone.scene}，并把${zone.detail}放进画面。`,
              `时间设定为${time.label}，光线强调${time.light}；镜头使用${shot.composition}，让空间、材质和路径一眼可读。`,
              `环境材质重点包含${world.materials.join('、')}，生活节奏参考${world.routines.join('、')}，整体气质是${world.atmosphere}。`,
              `画面要保持明亮可读，即便是夜景也不做压暗大黑块；色彩主轴来自 ${world.palette.accent}、${world.palette.soft}、${world.palette.deep}。`,
              '不要出现可读文字、Logo、水印、IP 影子、武器中心化、血腥场面或任何公开不安全内容。',
            ].join(' '),
          }),
        )
      }
    }
  }
  return entries
}

function buildBranchEntries(world, publishedById) {
  const positions = [
    { id: 'space', label: '空间建立', detail: '以地点说明分支为什么值得进入' },
    { id: 'object', label: '关键物件', detail: '用器物承载线索和关系' },
    { id: 'interaction', label: '协作动作', detail: '通过具体动作呈现人物关系' },
    { id: 'afterglow', label: '余波时刻', detail: '在事件后给出静态但不空洞的停留感' },
  ]
  const tones = [
    { id: 'calm', label: '平静', mood: '克制、可停留、没有剧透结论' },
    { id: 'tense', label: '紧张', mood: '压力在场，但不靠极端冲突直给' },
    { id: 'turning', label: '转折前', mood: '下一步将发生变化，但先停在门槛上' },
    { id: 'recovery', label: '恢复中', mood: '留下关系和环境被事件影响后的痕迹' },
  ]
  const entries = []
  const worldSeries = series.find((item) => item.worldId === world.id)
  for (const seed of world.branchSeeds) {
    for (const position of positions) {
      for (const tone of tones) {
        const publicStatus = position.id === 'space' || position.id === 'object' ? 'public_safe' : 'review_required'
        entries.push(
          createEntry({
            id: `visual-branch-${world.id}-${seed.id}-${position.id}-${tone.id}`,
            title: `${world.name}·${seed.title}·${position.label}·${tone.label}`,
            collection: 'story-branch',
            world,
            seriesId: worldSeries?.id || null,
            pageTargets: ['home-branch', `series-${worldSeries?.id || world.id}`, 'gallery'],
            proofBoundary: '分支视觉只使用公开安全切片；一旦涉及剧情推进，默认保留 review_required。',
            publicationStatus: publicStatus,
            promptStatus: 'promptReady',
            evidenceLevel: 'concept',
            shotType: position.id,
            timeOfDay: ['day', 'dusk', 'night', 'dawn'][entries.length % 4],
            weather: ['clear', 'rain', 'interior', 'fog'][entries.length % 4],
            visualLanguage: 'branch-teaser-poster',
            tags: [world.name, seed.title, position.label, tone.label, publicStatus],
            previewAssetId: position.id === 'space' ? `pub-world-${world.id}-scene` : `pub-world-${world.id}-event`,
            brief: {
              focus: `${seed.title} 的公开安全分支预告`,
              composition: `${position.label} / ${tone.label}`,
              subject: seed.object,
              use: '首页重点分支、世界页、分支页、图鉴',
            },
            prompt: [
              `为璃落宇宙官网生成一张${world.name}分支预告视觉，主题是“${seed.title}”。`,
              `分支前提是：${seed.premise}；这张图的任务是${position.detail}，重点物件为${seed.object}，紧张来源是${seed.tension}。`,
              `画面情绪采用${tone.label}阶段：${tone.mood}，但不要给出结局、真相或未确认剧情结果。`,
              `世界气质仍然遵守${world.tagline}，在${world.zones[entries.length % world.zones.length].label}或邻近空间中取景，画面保持叙事留白。`,
              `允许出现原创成年角色，但不能幼态化、不能过度性感，也不能让角色摆成空洞宣传海报姿势。`,
              '禁止可读文字、Logo、水印、现有 IP、露骨内容和把概念视觉冒充真实截图。',
            ].join(' '),
          }),
        )
      }
    }
  }
  return entries
}

function buildGeneralEntries(groupId, seeds, publishedById) {
  const compositions = [
    { id: 'wide', label: '宽幅海报', aspect: '21:9' },
    { id: 'editorial', label: '编辑双栏', aspect: '16:9' },
    { id: 'mosaic', label: '拼贴组合', aspect: '16:9' },
    { id: 'poster', label: '竖向封面', aspect: '4:5' },
  ]
  const repetitions = groupId === 'brand' || groupId === 'brandExpansion' ? 3 : 4
  const laneLabel =
    groupId === 'brand'
      ? 'homepage-brand-wave'
      : groupId === 'brandExpansion'
        ? 'brand-expansion-wave'
        : groupId === 'collaboration'
          ? 'collaboration-wave'
          : groupId === 'system'
            ? 'system-wave'
            : groupId === 'support'
              ? 'support-wave'
              : 'evidence-wave'
  const entries = []
  for (const seed of seeds) {
    for (let index = 0; index < repetitions; index += 1) {
      const composition = compositions[(entries.length + index) % compositions.length]
      const timeHint = ['白昼', '黄金时段', '柔和室内光', '夜间点灯'][entries.length % 4]
      entries.push(
        createEntry({
          id: `visual-${groupId}-${seed.id}-${index + 1}`,
          title: `${seed.title}·${composition.label}·${index + 1}`,
          collection: 'general-cross-site',
          pageTargets: ['home', groupId === 'collaboration' ? 'collab' : groupId === 'system' ? 'production' : 'roadmap'],
          proofBoundary: '跨页视觉用于海报节奏和招募转化，不承诺真实可玩状态。',
          publicationStatus: 'public_safe',
          promptStatus: 'promptReady',
          evidenceLevel: 'concept',
          shotType: composition.id,
          timeOfDay: ['day', 'dusk', 'night', 'interior'][entries.length % 4],
          weather: ['clear', 'soft-haze', 'interior', 'wind'][entries.length % 4],
          visualLanguage: `${groupId}-visual`,
          tags: [seed.title, composition.label, groupId],
          previewAssetId: seed.previewAssetId,
          brief: {
            focus: seed.title,
            composition: composition.label,
            subject: seed.scene,
            use: groupId === 'brand' ? '首页大章节点' : groupId === 'collaboration' ? '协作页与首页招募段' : '生产 / 路线图 / 证据段落',
          },
          prompt: [
            `为璃落宇宙官网生成一张${seed.title}视觉，主题场景是：${seed.scene}。`,
            `构图使用${composition.label}，比例偏向${composition.aspect}，需要天然给网页 HTML 标题和统计卡留下可用留白，不在图中生成文字。`,
            `整体情绪为“${seed.mood}”，时间提示偏向${timeHint}，并保持明亮、清晰、专业，避免厚重紫黑背景占满整张图。`,
            `画面核心意图是${seed.composition}，让观众立刻理解这是同一宇宙、同一生产链，而不是互不相关的单张概念图。`,
            '必须公开安全、原创、无水印、无 Logo、无现有 IP 影子，不使用儿童、不制造露骨或过度性感元素。',
          ].join(' '),
        }),
      )
    }
  }
  return entries
}

function buildScreenshotBriefs() {
  const generalTasks = [
    {
      id: 'main-menu',
      title: '主菜单与继续旅程',
      proofTarget: '证明 /game 拥有正式开始入口与继续旅程承接',
      routeOrEntry: '/game',
      preconditions: ['构建成功', '直接进入 /game'],
      exactSteps: ['打开 /#/game', '等待主菜单稳定加载', '不要点击进入地图', '保留主标题与主按钮'],
      expectedVisibleState: '能看到主菜单标题、开始/继续入口和清晰的页面框架。',
      viewport: { width: 1600, height: 900, orientation: 'landscape' },
      hideOrRedact: ['不要显示浏览器地址栏', '保留游戏 UI'],
      captureFormat: 'png',
      targetPages: ['home-proof', 'evidence'],
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: buildRef,
      status: 'planned',
    },
    {
      id: 'map-movement',
      title: '地图移动与角色站位',
      proofTarget: '证明地图移动、角色渲染与场景边界是运行中的系统',
      routeOrEntry: '/game',
      preconditions: ['进入可移动地图', '角色可操作'],
      exactSteps: ['进入地图', '走到能同时看到道路、建筑和 UI 的位置', '停住角色', '等待镜头稳定'],
      expectedVisibleState: '角色、地图、周边建筑和必要 UI 同时可见。',
      viewport: { width: 1600, height: 900, orientation: 'landscape' },
      hideOrRedact: ['不要隐藏角色', '保留基础 HUD'],
      captureFormat: 'png',
      targetPages: ['home-proof', 'evidence'],
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: buildRef,
      status: 'planned',
    },
    {
      id: 'travel-menu-shell',
      title: '旅途菜单外壳',
      proofTarget: '证明旅途菜单不是静态示意，而是游戏中的真实外壳',
      routeOrEntry: '/game',
      preconditions: ['进入可操作状态', '可以打开旅途菜单'],
      exactSteps: ['进入地图', '打开旅途菜单', '保留左侧导航与主体内容区', '等待动画结束后截图'],
      expectedVisibleState: '能看到菜单框架、导航与内容区域。',
      viewport: { width: 1600, height: 900, orientation: 'landscape' },
      hideOrRedact: ['不要截入浏览器外壳'],
      captureFormat: 'png',
      targetPages: ['home-proof', 'evidence', 'production'],
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: buildRef,
      status: 'planned',
    },
    {
      id: 'gallery-filter-state',
      title: '图鉴筛选状态',
      proofTarget: '证明图鉴不只是静态展示，而有真实筛选交互',
      routeOrEntry: '/game',
      preconditions: ['进入图鉴或相关菜单', '至少切换一个筛选项'],
      exactSteps: ['打开图鉴', '切换一个筛选条件', '等待列表稳定', '截图保留筛选控件和结果区'],
      expectedVisibleState: '能同时看到筛选控件与被筛出的内容。',
      viewport: { width: 1600, height: 900, orientation: 'landscape' },
      hideOrRedact: ['不要隐藏筛选控件'],
      captureFormat: 'png',
      targetPages: ['gallery', 'evidence'],
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: buildRef,
      status: 'planned',
    },
    {
      id: 'build-proof',
      title: '构建后官网与 /game 共存证明',
      proofTarget: '证明构建后站点与 /game 入口能共存而不互相遮蔽',
      routeOrEntry: '/liluo_domain/#/game',
      preconditions: ['完成 pages 构建', '本地预览可访问'],
      exactSteps: ['打开构建后的首页', '通过站内 CTA 跳转到 /game', '保留跳转后的稳定画面', '分别保存首页与 /game 证据'],
      expectedVisibleState: '首页 CTA 与 /game 实际入口都可见且可跳转。',
      viewport: { width: 1600, height: 900, orientation: 'landscape' },
      hideOrRedact: ['不保留浏览器书签栏'],
      captureFormat: 'png',
      targetPages: ['evidence', 'roadmap'],
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: buildRef,
      status: 'planned',
    },
  ]

  const briefs = [...generalTasks]
  for (const shot of publicScreenshotSources) {
    briefs.push({
      id: `shot-${shot.id}`,
      title: shot.title,
      proofTarget: shot.proofTarget,
      routeOrEntry: '/game',
      preconditions: ['相关功能可进入', '截图来源文件仍可核对'],
      exactSteps: [
        '进入对应菜单或地图场景',
        '切换到与来源文件一致的页面状态',
        '确认需要保留的 UI 已展示',
        '按照既有命名保存截图',
      ],
      expectedVisibleState: shot.title,
      viewport: { width: 1600, height: 900, orientation: 'landscape' },
      hideOrRedact: ['不要保留浏览器壳层', '只保留证明该功能存在所需的 UI'],
      captureFormat: 'png',
      targetPages: shot.targetPages,
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: buildRef,
      status: 'captured',
    })
  }

  for (const world of worlds) {
    const worldTasks = [
      ['world-entry', `${world.name} 世界入口地图镜头`, `证明 ${world.name} 在 /game 或规划中有明确可追溯入口`],
      ['world-dialogue', `${world.name} 事件对话界面`, `证明 ${world.name} 的角色/事件可以与 UI 层结合`],
      ['world-ui', `${world.name} 图鉴或资料入口`, `证明 ${world.name} 的资料与图鉴承载不是口头描述`],
      ['world-state', `${world.name} 状态变化提示`, `证明 ${world.name} 会与长期状态或通知机制相连`],
      ['world-story', `${world.name} 故事节点入口`, `证明 ${world.name} 的故事节点与运行层有关联`],
      ['world-route', `${world.name} 路径或传送切换`, `证明 ${world.name} 的进出路线可被验证`],
      ['world-proof', `${world.name} 实机证据组合`, `为世界页准备至少一张真正能说明“已存在什么”的截图`],
      ['world-life', `${world.name} 生活性场景截图`, `让世界页能展示有人停留的真实运行场景`],
      ['world-night', `${world.name} 夜间或特殊时段`, `证明时间或氛围变化有运行层对应`],
      ['world-menu', `${world.name} 菜单关联`, `证明世界内容能进入统一旅途菜单`],
      ['world-series', `${world.name} 分支入口证据`, `证明世界页中的重点分支与真实资源有关联` ],
      ['world-mobile', `${world.name} 移动端安全区`, `验证同一证据在移动端裁切后仍然可用`],
      ['world-qa', `${world.name} 截图复审版本`, `保留一张经过复审标记的版本对照图`],
      ['world-build', `${world.name} 构建后页面可见性`, `确认构建站点中的该世界入口与截图一致`],
    ]
    for (const [taskId, title, proofTarget] of worldTasks) {
      briefs.push({
        id: `shot-${world.id}-${taskId}`,
        title,
        proofTarget,
        routeOrEntry: '/game',
        worldId: world.id,
        preconditions: ['世界相关内容已接入或已有明确待接入对象', '截图任务对应页面已指定'],
        exactSteps: [
          `从 /game 或相关菜单进入 ${world.name} 对应内容`,
          '移动到能证明该任务目标的位置',
          '按任务要求保留或隐藏 UI',
          '保存为统一命名的 PNG 文件并登记版本',
        ],
        expectedVisibleState: `${world.name} 对应的真实场景、UI 或运行状态可被一眼识别。`,
        viewport: { width: taskId === 'world-mobile' ? 390 : 1600, height: taskId === 'world-mobile' ? 844 : 900, orientation: taskId === 'world-mobile' ? 'portrait' : 'landscape' },
        hideOrRedact: ['不保留浏览器地址栏', '如有私密信息则先打码或改用占位账号'],
        captureFormat: 'png',
        targetPages: ['evidence', `world-${world.id}`],
        evidenceLevel: 'runtime-capture',
        validationDate: generatedAt,
        buildOrCommit: buildRef,
        status: 'planned',
      })
    }
  }

  return briefs.slice(0, 96)
}

function buildPlanSummary({ publishedManifest, publishedById, visualRegistry, screenshotBriefs }) {
  const counts = {
    plannedVisuals: visualRegistry.length,
    promptReady: visualRegistry.filter((item) => item.promptStatus === 'promptReady').length,
    generalCrossSite: visualRegistry.filter((item) => item.collection === 'general-cross-site').length,
    worldAtlas: visualRegistry.filter((item) => item.collection === 'world-atlas').length,
    storyBranch: visualRegistry.filter((item) => item.collection === 'story-branch').length,
    liluoCharacter: visualRegistry.filter((item) => item.collection === 'liluo-character').length,
    batches: new Set(visualRegistry.map((item) => item.batchId)).size,
    publishedVisuals: publishedManifest.length,
    r2BackedVisuals: publishedManifest.filter((item) => item.urls?.large || item.urls?.content).length,
    screenshotPlan: screenshotBriefs.length,
    screenshotCaptured: screenshotBriefs.filter((item) => item.status === 'captured').length,
    worlds: worlds.length,
    publicSeries: series.length,
    collaborationTracks: collaborationTracks.length,
  }

  const layerCounts = [
    { id: 'general-cross-site', label: '品牌 / 首页 / 协作 / 系统', count: counts.generalCrossSite },
    { id: 'world-atlas', label: '六界 atlas', count: counts.worldAtlas },
    { id: 'story-branch', label: '分支与故事视觉', count: counts.storyBranch },
    { id: 'liluo-character', label: '璃落角色视觉', count: counts.liluoCharacter },
  ]

  const batches = Array.from(groupBy(visualRegistry, (item) => item.batchId)).map(([batchId, items]) => ({
    batchId,
    size: items.length,
    layers: Array.from(new Set(items.map((item) => item.collection))),
    title: batchTitle(batchId, items),
  }))

  const worldCards = worlds.map((world) => {
    const atlasCount = visualRegistry.filter((item) => item.collection === 'world-atlas' && item.worldId === world.id).length
    const branchCount = visualRegistry.filter((item) => item.collection === 'story-branch' && item.worldId === world.id).length
    const liluoCount = visualRegistry.filter((item) => item.collection === 'liluo-character' && item.worldId === world.id).length
    return {
      ...world,
      counts: { atlas: atlasCount, branch: branchCount, liluo: liluoCount },
      previewAssetIds: [
        `pub-world-${world.id}-poster`,
        `pub-world-${world.id}-scene`,
        `pub-world-${world.id}-event`,
        `pub-liluo-${world.id}-variant`,
      ],
    }
  })

  const routeMatrix = [
    '/',
    '/worlds',
    ...worlds.map((world) => `/worlds/${world.id}`),
    ...series.map((item) => `/worlds/${item.worldId}/series/${item.id}`),
    '/characters',
    '/characters/liluo',
    '/gallery',
    '/evidence',
    '/production',
    '/roadmap',
    '/devlog',
    '/collab',
    '/game',
  ]

  return {
    generatedAt,
    siteConfig,
    counts,
    layerCounts,
    batches,
    worlds: worldCards,
    routes: routeMatrix,
    statCards: [
      { label: '规划视觉资产', value: String(counts.plannedVisuals), note: 'Image 2 prompt-ready registry' },
      { label: '截图任务书', value: String(counts.screenshotPlan), note: '真实截图，不由生成图代替' },
      { label: '已发布视觉样张', value: String(counts.publishedVisuals), note: '来自 docs/assets/readme 与现有清单' },
      { label: 'R2 可复用资产', value: String(counts.r2BackedVisuals), note: '来自 website-r2-manifest.json' },
      { label: '六界入口', value: String(counts.worlds), note: '统一站点蓝图驱动' },
    ],
    spotlights: {
      home: pickSpotlights(visualRegistry, ['general-cross-site'], 6),
      worlds: pickSpotlights(visualRegistry, ['world-atlas'], 12),
      branches: pickSpotlights(visualRegistry, ['story-branch'], 8),
      liluo: pickSpotlights(visualRegistry, ['liluo-character'], 8),
      collaboration: pickSpotlights(visualRegistry, ['general-cross-site'], 6, (item) => item.tags.includes('collaboration') || item.tags.includes('协作')),
    },
    previewAssetIds: Object.keys(publishedById),
  }
}

function buildDiversityReport(visualRegistry) {
  return {
    worlds: aggregateCount(visualRegistry, (item) => item.worldId || 'global'),
    collections: aggregateCount(visualRegistry, (item) => item.collection),
    shotTypes: aggregateCount(visualRegistry, (item) => item.shotType),
    timeOfDay: aggregateCount(visualRegistry, (item) => item.timeOfDay),
    publicationStatus: aggregateCount(visualRegistry, (item) => item.publicationStatus),
  }
}

function buildProcessReport(publishedManifest) {
  return {
    generatedAt,
    publishedCount: publishedManifest.length,
    remoteBacked: publishedManifest.filter((item) => item.urls?.large || item.urls?.content).length,
    localFallbackOnly: publishedManifest.filter((item) => !item.urls?.large && !item.urls?.content).length,
    groups: aggregateCount(publishedManifest, (item) => item.group),
  }
}

function buildPerformanceReport(state) {
  return {
    generatedAt,
    homepage: {
      preloadedVisuals: 1,
      shouldLazyLoadBeyondHero: true,
      cardPageSize: 24,
      promptRegistryLazyLoaded: true,
      notes: ['首页不直接导入完整 1,248 条 prompt 正文', '图鉴默认每页 24 项'],
    },
    gallery: {
      itemCount: state.planSummary.counts.plannedVisuals,
      defaultPageSize: 24,
      hasDrawer: true,
      hasFilterState: true,
    },
  }
}

function validatePrompts(visualRegistry) {
  const ids = new Set()
  const prompts = new Set()
  for (const item of visualRegistry) {
    if (ids.has(item.id)) throw new Error(`Duplicate visual asset id: ${item.id}`)
    ids.add(item.id)
    if (!item.prompt || item.prompt.length < 140) throw new Error(`Prompt too short: ${item.id}`)
    if (/\{\{|\$\{|\bTODO\b/u.test(item.prompt)) throw new Error(`Prompt contains template residue: ${item.id}`)
    const fingerprint = crypto.createHash('sha256').update(item.prompt).digest('hex')
    if (prompts.has(fingerprint)) throw new Error(`Prompt is duplicated: ${item.id}`)
    prompts.add(fingerprint)
    validateLiluoIdentityPrompt(item)
  }
  if (visualRegistry.length !== 1248) throw new Error(`Expected 1248 visual assets, got ${visualRegistry.length}`)
}

function validateVisualFeedbackLedger() {
  for (const entry of visualFeedbackLedger) {
    const report = validateImageRuleCard(entry)
    if (!report.ok) {
      throw new Error(`Invalid visual feedback ledger entry: ${entry.id} -> ${report.errors.join('; ')}`)
    }
  }
}

function validateLiluoIdentityPrompt(item) {
  if (item.collection !== 'liluo-character' && item.batchId !== 'B00') return
  const governance = runImagePromptGovernancePreflight({
    prompt: item.prompt,
    subjectHints: ['璃落'],
    strictness: 'canonical-liluo',
  })
  if (governance.status === 'blocked') {
    throw new Error(`Liluo identity prompt failed governance preflight: ${item.id} -> ${governance.errors.join('; ')}`)
  }
  const missing = liluoPromptRequiredSnippets.filter((snippet) => !item.prompt.includes(snippet))
  if (missing.length) {
    throw new Error(`Liluo identity prompt missing required anchors: ${item.id} -> ${missing.join(', ')}`)
  }
}

function validateScreenshots(screenshotBriefs) {
  const ids = new Set()
  for (const item of screenshotBriefs) {
    if (ids.has(item.id)) throw new Error(`Duplicate screenshot id: ${item.id}`)
    ids.add(item.id)
    const required = ['title', 'proofTarget', 'routeOrEntry', 'expectedVisibleState', 'captureFormat', 'status']
    for (const key of required) if (!item[key]) throw new Error(`Screenshot ${item.id} missing ${key}`)
  }
  if (screenshotBriefs.length !== 96) throw new Error(`Expected 96 screenshot briefs, got ${screenshotBriefs.length}`)
}

function validateLinks(state) {
  const allRoutes = new Set(state.planSummary.routes)
  for (const item of [...navigation, ...footerNavigation]) {
    if (!allRoutes.has(item.path)) throw new Error(`Navigation path missing from route matrix: ${item.path}`)
  }
  const requiredWorldSeries = new Set(series.map((item) => `/worlds/${item.worldId}/series/${item.id}`))
  for (const route of requiredWorldSeries) if (!allRoutes.has(route)) throw new Error(`Missing series route: ${route}`)
}

async function writeDocs(state) {
  const { planSummary } = state
  await writeMarkdown('site-current-audit-2026-08-02.md', buildAuditDoc(planSummary))
  await writeMarkdown('recruitment-narrative-and-information-architecture.md', buildIaDoc(planSummary))
  await writeMarkdown('visual-master-plan.md', buildVisualMasterPlanDoc(planSummary))
  await writeMarkdown('world-visual-bibles.md', buildWorldBibleDoc())
  await writeMarkdown('liluo-identity-and-variation-bible.md', buildLiluoBibleDoc())
  await writeMarkdown('visual-feedback-ledger.md', buildVisualFeedbackLedgerDoc())
  await writeMarkdown('image2-prompt-authoring-standard.md', buildPromptDoc())
  await writeMarkdown('visual-generation-batches.md', buildBatchDoc(planSummary))
  await writeMarkdown('screenshot-capture-plan.md', buildScreenshotDoc(state.screenshotBriefs))
  await writeMarkdown('visual-qa-and-publication-policy.md', buildQaDoc())
  await writeMarkdown('performance-and-r2-policy.md', buildPerformanceDoc(planSummary))
  await writeMarkdown('collaboration-conversion-plan.md', buildCollabDoc())
}

function buildAuditDoc(planSummary) {
  return `# 官网现状审计（2026-08-02）

## 本轮核对范围

- 当前仓库中的官网路由：${planSummary.routes.join('、')}
- 站点蓝图、已发布样张清单、R2 manifest、截图来源、首页与各子页结构
- \`/game\` 仍被保留为正式旗舰入口，官网不替代游戏

## 当前可复用基础

- 公开站点已经有首页、六界、角色、图鉴、证据、生产、路线图、开发日志和协作页路由骨架。
- 已有可复用视觉样张 ${planSummary.counts.publishedVisuals} 项，其中 R2 可直接复用 ${planSummary.counts.r2BackedVisuals} 项。
- 现有真实截图来源 ${planSummary.counts.screenshotCaptured} 项，足以支撑“先证据、后愿景”的首页证明条。

## 主要缺口

- 旧站点数据集中在单体 \`siteData.js\`，难以承接 1000+ 资产规划、状态追踪和批次恢复。
- 图鉴没有承载完整计划库、批次、prompt 状态与截图任务，容易把“已规划”误写成“已落地”。
- 世界页、分支页、协作页、路线图页和开发日志页缺少独立的视觉节奏与任务转化结构。
- 当前 \`/game\` 入口需要继续作为独立回归对象，不能被海报站结构掩盖。

## 本轮策略

1. 建立 1,248 项视觉资产 registry 与 96 项截图任务书。
2. 把首页升级为 15 章节滚动海报逻辑，并明确真实证据边界。
3. 让世界、角色、图鉴、证据、生产、路线图、开发日志和协作页都改为数据驱动。
4. 只把真实已发布样张接入站点；其余条目保留为 prompt-ready 计划项。
`
}

function buildIaDoc(planSummary) {
  return `# 招募叙事与信息架构

## 首页目标

陌生访客需要依次得到五个答案：这是什么、它真的存在吗、它为什么有意思、它为什么难、我能从哪里加入。

## 首页结构

1. Hero：一句定位与三条行动路径
2. 真实存在证明条：规划视觉 ${planSummary.counts.plannedVisuals} / 截图计划 ${planSummary.counts.screenshotPlan} / 已发布样张 ${planSummary.counts.publishedVisuals}
3. 同一故事多形态解释
4. 旗舰体验 \`/game\`
5. 六界入口与比较
6. 一个世界的一天
7. 璃落身份锚点
8. 重点分支预告
9. 视觉图鉴入口
10. AI 原生生产体系
11. 为什么这件事难
12. 路线图与最近进展
13. 协作地图
14. 最终 CTA 与贡献路径

## 子页职责

- 世界页：世界气质、生活切片、真实证据与协作缺口并置
- 分支页：只展示公开安全的分支封面、地点、器物与关系切片
- 角色页：固定身份 + 可变处境 + 长期记忆入口
- 图鉴：已发布样张与 prompt-ready 计划双轨承载
- 证据页：只展示真实截图、文档证据和构建证明
- 生产页：来源、规划、生成、审核、发布与回归
- 路线图 / 开发日志 / 协作页：必须参与转化，不再作为附属说明
`
}

function buildVisualMasterPlanDoc(planSummary) {
  return `# 视觉总计划

## 总量

- Image 2 资产：${planSummary.counts.plannedVisuals}
- 截图任务：${planSummary.counts.screenshotPlan}
- 已发布样张：${planSummary.counts.publishedVisuals}

## 分层

${planSummary.layerCounts.map((item) => `- ${item.label}：${item.count}`).join('\n')}

## 首轮批次

- Batch 00：璃落身份参考与视觉 QA 基线（24）
- Batch 01：品牌与首页（24）
- Batch 02–07：六界各 24 项第一波（144）
- Batch 08：协作 / 生产 / 路线图（24）

## 站点承载原则

- 首页只展示经过挑选的视觉样张，不一次加载全部计划库。
- 图鉴按 24 项分页加载，并按需拉取完整 prompt。
- 真实截图永远不由生成图代替。
`
}

function buildWorldBibleDoc() {
  const sections = worlds
    .map(
      (world) => `## ${world.name}

- 定位：${world.tagline}
- 公开状态：${developmentStatuses[world.status]}
- 公开证据等级：${evidenceLevels[world.evidenceLevel]}
- 重点材质：${world.materials.join('、')}
- 重点生活节奏：${world.routines.join('、')}
- 视觉禁忌：不把概念图写成可玩，不把同质站姿图堆成该世界主体
- 空间种子：${world.zones.map((zone) => zone.label).join('、')}
- 分支种子：${world.branchSeeds.map((seed) => seed.title).join('、')}
`,
    )
    .join('\n')
  return `# 六界视觉 bible

## 归档原则

- 世界风格评价进入账本后，必须明确归入 \`palette\`、\`materials\`、\`atmosphere\` 或 \`liluoLooks\` 这类绝对字段。
- 不能把“再轻一点”“更亮一点”“少一点压迫感”这类无基线相对词直接沉淀成长期世界规则。

${sections}`
}

function buildLiluoBibleDoc() {
  return `# 璃落身份与变化 bible

## 固定部分

- ${liluoProfile.fixedTraits.join('\n- ')}

## 发色参数

- 日常光线描述：${liluoProfile.hairColorProfile.everydayLighting.description}
- 基础色：${liluoProfile.hairColorProfile.everydayLighting.baseHex}
- 阴影色：${liluoProfile.hairColorProfile.everydayLighting.shadowHex}
- 高光色：${liluoProfile.hairColorProfile.everydayLighting.highlightHex}
- 最亮反光：${liluoProfile.hairColorProfile.everydayLighting.rimLightHex}
- 光线调整规则：
- ${liluoProfile.hairColorProfile.adjustmentRules.join('\n- ')}

## 可变部分

- ${liluoProfile.variableTraits.join('\n- ')}

## 穿搭偏好

- ${liluoProfile.stylePreferences.join('\n- ')}

## 公开安全

- ${liluoProfile.publicSafety.join('\n- ')}

## 反馈沉淀规则

- ${liluoProfile.feedbackIntakeRules.join('\n- ')}

## 人物展示构图

- ${characterShowcaseCompositionRules.join('\n- ')}

## 页面用途

- 批次基线：Batch 00
- 首页身份锚点
- 世界页中的 24 项角色视觉入口
- 角色页与图鉴的对照浏览
`
}

function buildVisualFeedbackLedgerDoc() {
  const entries = visualFeedbackLedger
    .map(
      (entry) => `## ${entry.date}｜${entry.id}

- 作用范围：${entry.scope.join('、')}
- 判层卡：${imageRuleKinds[entry.ruleKind]} / ${imageRuleScopes[entry.scopeLevel]} / ${imageRulePersistenceLevels[entry.persistence]} / ${imageRuleEnforcementModes[entry.enforcement]}
- 适用生成链路：${entry.generators?.join('、') || '未指定'}
- 归入对象：角色 ${entry.appliesTo?.characters?.join('、') || '未指定'}；世界 ${entry.appliesTo?.worlds?.join('、') || '未指定'}；集合 ${entry.appliesTo?.collections?.join('、') || '未指定'}
- 归入维度：${entry.appliesTo?.aspects?.join('、') || '未指定'}
- 来源：${entry.source}
- 归档规范：${entry.normalizationRule || '未指定'}
- 落点层：${entry.promptLayer || '未指定'}
- 回写目标：角色 ${entry.writebackTargets?.character?.join('、') || '未指定'}；世界 ${entry.writebackTargets?.worlds?.join('、') || '未指定'}；prompt ${entry.writebackTargets?.prompts?.join('、') || '未指定'}
- 原始评价摘要：${entry.rawSummary}
- 抽象出的长期特征：
${entry.abstractedTraits.map((item) => `  - ${item}`).join('\n')}
- 对 prompt 的直接影响：
${entry.promptEffects.map((item) => `  - ${item}`).join('\n')}
- 明确排除的错放方式：
${entry.negativeExamples.map((item) => `  - ${item}`).join('\n')}
- 升级门槛：${entry.promotionGate}`,
    )
    .join('\n\n')

  return `# 项目图像反馈账本

## 权威来源

- 角色风格：${posterStyleAuthorities.character.join('、')}
- 世界风格：${posterStyleAuthorities.worlds.join('、')}
- 归档规范：${posterStyleAuthorities.archiveRules.join('、')}
- 构图规则：${posterStyleAuthorities.composition.join('、')}
- 反馈沉淀：${posterStyleAuthorities.feedback.join('、')}

## 归档绝对化规则

- ${visualFeedbackArchiveRules.join('\n- ')}

## 自动归入规则

1. 角色、世界、镜头、材质、色板、页面节奏等任何项目图像评价都先写入本账本。
2. 账本负责把单次评价抽象成可复用特征和 prompt 影响。
3. 每条反馈都先过“纠正什么 / 影响多大 / 持续多久 / 应该落在哪层”的判层问题，再决定是否写入 authority、prompt 或 QA。
4. 确认后的稳定特征再回写到 \`liluoProfile\`、\`worlds[*]\` 或其他权威源，后续批次与 Grok 探索图共用同一套规则。
5. 归档时不得直接保留“更浅一些”“少一点”这类相对说法，必须改写成绝对、可执行的目标描述。

## 判层问题

${imageRulePlacementQuestions.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## 默认收窄原则

- ${imageRuleNarrowingPolicy.join('\n- ')}

## 当前已吸收的评价

${entries}
`
}

function buildPromptDoc() {
  return `# 项目图像生成提示词编写标准

## 适用范围

- 站点中的 Image 2 资产与批次 prompt
- 使用 Grok 生成项目草稿图时的单条生产 prompt
- 后续新增的项目内图像生成链路

## 每条 prompt 的默认装配顺序

${imagePromptAssemblyLayers.map((item, index) => `${index + 1}. ${item.title}：${item.description}`).join('\n')}

## 反馈归档要求

- 来自用户的新偏好先进入视觉反馈账本，再决定是否写回角色与世界权威字段。
- 不允许凭感觉直接把一句反馈升成全局规范；必须先填判层卡：\`ruleKind / scopeLevel / persistence / enforcement\`。
- 如果用户原话使用了“更弱气”“更浅一些”“少一点”这类相对表述，归档时必须改写成绝对描述，不能把相对词原样沉淀到长期规则或 prompt 模板里。
- 如果用户对人物展示方式提出长期要求，例如“专门展示人物时优先全身”，必须把它写成明确构图规则，再进入角色类 prompt。

## 禁止项

- 变量残留、占位符、TODO
- “换世界名重用同一条 prompt”
- 在图片中生成可读文字、Logo 或流程图
- 幼态、露骨、过度性感和现有 IP 影子

## 推荐结构

1. 说明该图属于哪个页面/批次/世界
2. 指定主体与空间关系
3. 指定镜头、比例、光线、材质与留白
4. 指定情绪与公开安全边界
5. 明确禁止项

## 默认收窄原则

- ${imageRuleNarrowingPolicy.join('\n- ')}
`
}

function buildBatchDoc(planSummary) {
  const rows = planSummary.batches.map((item) => `- ${item.batchId}：${item.title}（${item.size}）`).join('\n')
  return `# 视觉生成批次

## 批次原则

- 默认每批 24 项
- 状态流转：planned → promptReady → generated → qaApproved → published
- 任何已人工修改 prompt 的条目都不得被自动覆盖

## 当前批次清单

${rows}
`
}

function buildScreenshotDoc(screenshotBriefs) {
  const captured = screenshotBriefs.filter((item) => item.status === 'captured').length
  return `# 截图计划

## 数量

- 总任务数：${screenshotBriefs.length}
- 已有可复用截图：${captured}
- 待补截图：${screenshotBriefs.length - captured}

## 任务字段

- id
- title
- proofTarget
- routeOrEntry
- preconditions
- exactSteps
- expectedVisibleState
- viewport
- hideOrRedact
- captureFormat
- targetPages
- evidenceLevel
- validationDate
- buildOrCommit
- status

## 原则

- 每项任务必须能告诉用户从哪里进入、走到哪里、保留哪些 UI。
- 不允许用概念图代替截图。
- 移动端需要单独核对安全区。
`
}

function buildQaDoc() {
  return `# 视觉 QA 与公开发布策略

## QA 核对项

- prompt 是否完整且与画面一致
- 判层协议是否把该规则放在正确层级，而不是把 QA 问题误塞进全局 prompt
- 璃落身份是否稳定
- 发型、服装、动作与世界是否多样
- 是否出现文字、Logo、水印、IP 影子
- 是否幼态、露骨或过度性感
- 是否适合网页裁切与移动端安全区

## 发布策略

- \`public_safe\` 可进入公开站点
- \`review_required\` 只进入计划库，不默认公开
- 拒绝图保留摘要与原因，不进入公开 manifest
`
}

function buildPerformanceDoc(planSummary) {
  return `# 性能与 R2 策略

## 性能门禁

- 首页首屏只预加载 Hero
- 图鉴每页 24 项
- 完整 prompt registry 按需加载
- 真实统计和流程图坚持代码原生

## R2 边界

- 当前样张中 R2 可复用资产：${planSummary.counts.r2BackedVisuals}
- 其余样张可通过本地打包资源回退
- registry 不写临时签名 URL，只认稳定 public URL 或本地 sourcePath
`
}

function buildCollabDoc() {
  const tracks = collaborationTracks
    .map(
      (track) => `## ${track.title}

- 真实对象：${track.summary}
- 当前问题：${track.problem}
- 30 分钟任务：${track.quickStart}
- 2 小时任务：${track.halfDay}
- 1 天任务：${track.oneDay}
- 长期方向：${track.longRun}
- 基础能力：${track.skills.join('、')}
- 先读：${track.entryDoc}
- 如何认领：${track.claimRoute}
- 如何验收：${track.review}
`,
    )
    .join('\n')
  return `# 协作转化计划

${tracks}`
}

function buildVisualAssetSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Liluo Site Visual Asset',
    type: 'object',
    required: [
      'id',
      'title',
      'collection',
      'promptStatus',
      'publicationStatus',
      'prompt',
      'brief',
      'pageTargets',
      'tags',
      'generatedAt',
    ],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      collection: { enum: ['general-cross-site', 'world-atlas', 'story-branch', 'liluo-character'] },
      worldId: { type: ['string', 'null'] },
      seriesId: { type: ['string', 'null'] },
      promptStatus: { enum: ['planned', 'promptReady', 'generated', 'qaApproved', 'published'] },
      publicationStatus: { enum: ['review_required', 'internal_only', 'public_safe'] },
      prompt: { type: 'string', minLength: 140 },
      pageTargets: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      brief: {
        type: 'object',
        required: ['focus', 'composition', 'subject', 'use'],
        properties: {
          focus: { type: 'string' },
          composition: { type: 'string' },
          subject: { type: 'string' },
          use: { type: 'string' },
        },
      },
    },
  }
}

function buildPromptSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Liluo Site Image2 Prompt',
    type: 'object',
    required: ['id', 'title', 'prompt', 'proofBoundary'],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      prompt: { type: 'string', minLength: 140 },
      proofBoundary: { type: 'string' },
    },
  }
}

function buildScreenshotSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Liluo Site Screenshot Brief',
    type: 'object',
    required: [
      'id',
      'title',
      'proofTarget',
      'routeOrEntry',
      'preconditions',
      'exactSteps',
      'expectedVisibleState',
      'viewport',
      'hideOrRedact',
      'captureFormat',
      'targetPages',
      'evidenceLevel',
      'validationDate',
      'buildOrCommit',
      'status',
    ],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      proofTarget: { type: 'string' },
      routeOrEntry: { type: 'string' },
      preconditions: { type: 'array', items: { type: 'string' } },
      exactSteps: { type: 'array', items: { type: 'string' } },
      expectedVisibleState: { type: 'string' },
      viewport: {
        type: 'object',
        required: ['width', 'height', 'orientation'],
        properties: {
          width: { type: 'number' },
          height: { type: 'number' },
          orientation: { enum: ['landscape', 'portrait'] },
        },
      },
      hideOrRedact: { type: 'array', items: { type: 'string' } },
      captureFormat: { enum: ['png', 'webp'] },
      targetPages: { type: 'array', items: { type: 'string' } },
      evidenceLevel: { const: 'runtime-capture' },
      validationDate: { type: 'string' },
      buildOrCommit: { type: 'string' },
      status: { enum: ['planned', 'captured', 'blocked'] },
    },
  }
}

function createEntry({
  id,
  title,
  collection,
  world,
  seriesId = null,
  pageTargets,
  proofBoundary,
  publicationStatus,
  promptStatus,
  evidenceLevel,
  shotType,
  timeOfDay,
  weather,
  visualLanguage,
  tags,
  previewAssetId,
  brief,
  prompt,
}) {
  const normalizedPrompt = `${prompt} Registry key: ${id}. Primary page targets: ${pageTargets.join(', ')}.`
  return {
    id,
    title,
    collection,
    worldId: world?.id || null,
    seriesId,
    pageTargets,
    proofBoundary,
    publicationStatus,
    promptStatus,
    evidenceLevel,
    shotType,
    timeOfDay,
    weather,
    visualLanguage,
    tags,
    previewAssetId,
    brief,
    prompt: normalizedPrompt,
    generatedAt,
    promptModel,
    statusOrder: planStatusRank.indexOf(promptStatus),
    publicationOrder: publicationRank.indexOf(publicationStatus),
  }
}

function pickSpotlights(items, collections, count, extraFilter = () => true) {
  return items
    .filter((item) => collections.includes(item.collection))
    .filter(extraFilter)
    .slice(0, count)
    .map((item) => ({
      id: item.id,
      title: item.title,
      collection: item.collection,
      worldId: item.worldId,
      previewAssetId: item.previewAssetId,
      tags: item.tags.slice(0, 4),
      publicationStatus: item.publicationStatus,
      shotType: item.shotType,
      promptStatus: item.promptStatus,
      brief: item.brief,
    }))
}

function batchTitle(batchId, items) {
  if (batchId === 'B00') return '璃落身份参考与 QA 基线'
  if (batchId === 'B01') return '品牌与首页第一波'
  if (batchId >= 'B02' && batchId <= 'B07') return `${items[0].worldId} 世界 atlas 第一波`
  if (batchId === 'B08') return '协作与首页转化第一波'
  return `后续扩展批次 ${batchId}`
}

function aggregateCount(items, keyFn) {
  const answer = {}
  for (const item of items) {
    const key = keyFn(item)
    answer[key] = (answer[key] || 0) + 1
  }
  return answer
}

function groupBy(items, keyFn) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

async function writeMarkdown(fileName, content) {
  await writeOutput(path.join(docsDir, fileName), content)
}

async function writeOutput(filePath, payload) {
  if (dryRun) return
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const text = typeof payload === 'string' ? `${payload.trim()}\n` : `${JSON.stringify(payload, null, 2)}\n`
  await fs.writeFile(filePath, text, 'utf8')
}

function normalizePath(value) {
  return value.replaceAll('\\', '/')
}

function toRepo(filePath) {
  return normalizePath(path.relative(root, filePath))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
