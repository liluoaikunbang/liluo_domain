import {
  collaborationTracks,
  devlogEntries,
  developmentStatuses,
  evidenceLevels,
  footerNavigation,
  generalVisualSeedSets,
  liluoProfile,
  navigation,
  productionPhases,
  publicScreenshotSources,
  publishedAssetDescriptors,
  roadmapItems,
  series,
  siteConfig,
  worlds,
} from './siteBlueprint.js'

const promptModel = 'gpt-image-2'
const generatedAt = '2026-08-02'
const batchSize = 24

const publishedKindMeta = {
  concept: { evidenceLevel: 'concept', sourceType: 'gpt-image-2', promptStatus: 'published' },
  character: { evidenceLevel: 'concept', sourceType: 'gpt-image-2', promptStatus: 'published' },
  documentation: { evidenceLevel: 'documentation', sourceType: 'documentation-board', promptStatus: 'published' },
  'runtime-capture': { evidenceLevel: 'runtime-capture', sourceType: 'real-screenshot', promptStatus: 'captured' },
}

export const publishedAssets = publishedAssetDescriptors.map((descriptor, index) => {
  const meta = publishedKindMeta[descriptor.kind] || publishedKindMeta.concept
  return {
    ...descriptor,
    evidenceLevel: meta.evidenceLevel,
    sourceType: meta.sourceType,
    promptStatus: meta.promptStatus,
    publicationStatus: 'public_safe',
    generatedAt,
    width: null,
    height: null,
    urls: {},
    order: index,
  }
})

export const publishedAssetsById = new Map(publishedAssets.map((item) => [item.id, item]))

const worldSeriesMap = new Map(worlds.map((world) => [world.id, series.find((item) => item.worldId === world.id) || null]))

const baseVisualRegistry = buildVisualRegistry()
export const visualRegistry = baseVisualRegistry.map((entry, index) => ({
  ...entry,
  batchId: `B${String(Math.floor(index / batchSize)).padStart(2, '0')}`,
  batchOrder: (index % batchSize) + 1,
}))

export const screenshotBriefs = buildScreenshotBriefs()

export const routeMatrix = [
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

export const layerCounts = [
  { id: 'general-cross-site', label: '跨页海报', count: visualRegistry.filter((item) => item.collection === 'general-cross-site').length },
  { id: 'world-atlas', label: '世界 atlas', count: visualRegistry.filter((item) => item.collection === 'world-atlas').length },
  { id: 'story-branch', label: '分支海报', count: visualRegistry.filter((item) => item.collection === 'story-branch').length },
  { id: 'liluo-character', label: '璃落角色线', count: visualRegistry.filter((item) => item.collection === 'liluo-character').length },
]

export const batchSummaries = Array.from(groupBy(visualRegistry, (item) => item.batchId).entries()).map(([batchId, items]) => ({
  batchId,
  title: batchTitle(batchId, items),
  size: items.length,
  collections: summarizeCounts(items, (item) => item.collection),
  worlds: [...new Set(items.map((item) => item.worldId).filter(Boolean))],
  promptReady: items.filter((item) => item.promptStatus === 'promptReady').length,
  publicSafe: items.filter((item) => item.publicationStatus === 'public_safe').length,
}))

export const worldSummaries = worlds.map((world) => ({
  id: world.id,
  name: world.name,
  published: publishedAssets.filter((item) => item.worldId === world.id).length,
  atlas: visualRegistry.filter((item) => item.worldId === world.id && item.collection === 'world-atlas').length,
  branches: visualRegistry.filter((item) => item.worldId === world.id && item.collection === 'story-branch').length,
  liluo: visualRegistry.filter((item) => item.worldId === world.id && item.collection === 'liluo-character').length,
  screenshots: screenshotBriefs.filter((item) => item.worldId === world.id).length,
}))

export const spotlightGroups = {
  hero: publishedAssets.filter((item) => ['home-hero', 'home-worlds', 'home-closing'].some((role) => item.pageRoles.includes(role))).slice(0, 6),
  worlds: visualRegistry.filter((item) => item.collection === 'world-atlas').slice(0, 8),
  branches: visualRegistry.filter((item) => item.collection === 'story-branch').slice(0, 8),
  liluo: visualRegistry.filter((item) => item.collection === 'liluo-character').slice(0, 8),
  production: publishedAssets.filter((item) => item.pageRoles.includes('production')).slice(0, 8),
}

export const evidenceItems = publishedAssets.filter((item) => item.kind === 'runtime-capture')

export const planCounts = {
  plannedVisuals: visualRegistry.length,
  screenshotPlan: screenshotBriefs.length,
  screenshotCaptured: screenshotBriefs.filter((item) => item.status === 'captured').length,
  publishedVisuals: publishedAssets.length,
  worlds: worlds.length,
  routes: routeMatrix.length,
  batches: batchSummaries.length,
}

export const siteStats = [
  { label: '视觉计划', value: String(planCounts.plannedVisuals), note: 'Image 2 海报与图鉴规划条目' },
  { label: '截图任务', value: String(planCounts.screenshotPlan), note: '真实运行证据与构建共存证明' },
  { label: '已接入素材', value: String(planCounts.publishedVisuals), note: '当前公开可展示的海报、图板与截图' },
  { label: '主世界', value: String(planCounts.worlds), note: '六界长期扩展入口保留' },
  { label: '生成批次', value: String(planCounts.batches), note: '按 24 张一批推进与审校' },
]

export function getPublishedAsset(assetId) {
  return publishedAssetsById.get(assetId) || null
}

export function getWorld(worldId) {
  return worlds.find((world) => world.id === worldId) || null
}

export function getSeries(seriesId) {
  return series.find((item) => item.id === seriesId) || null
}

export function getSeriesForWorld(worldId) {
  return series.filter((item) => item.worldId === worldId)
}

export function getWorldSummary(worldId) {
  return worldSummaries.find((item) => item.id === worldId) || null
}

export function getWorldPublishedAssets(worldId) {
  return publishedAssets.filter((item) => item.worldId === worldId)
}

export function getSpotlights(name) {
  return spotlightGroups[name] || []
}

function buildVisualRegistry() {
  const entries = []

  entries.push(...buildLiluoBaselineEntries())
  entries.push(...buildGeneralEntries('brand', generalVisualSeedSets.brand))

  for (const world of worlds) {
    entries.push(...buildWorldAtlasEntries(world).slice(0, 24))
  }

  entries.push(...buildGeneralEntries('collaboration', generalVisualSeedSets.collaboration))

  const remainingAtlas = []
  const remainingLiluo = []
  const branchEntries = []

  for (const world of worlds) {
    remainingAtlas.push(...buildWorldAtlasEntries(world).slice(24))
    remainingLiluo.push(...buildLiluoWorldEntries(world).slice(4))
    branchEntries.push(...buildBranchEntries(world))
  }

  entries.push(...buildGeneralEntries('system', generalVisualSeedSets.system))
  entries.push(...buildGeneralEntries('support', generalVisualSeedSets.support))
  entries.push(...buildGeneralEntries('evidence', generalVisualSeedSets.evidence))
  entries.push(...buildGeneralEntries('brandExpansion', generalVisualSeedSets.brand))
  entries.push(...remainingAtlas)
  entries.push(...remainingLiluo)
  entries.push(...branchEntries)

  return entries
}

function buildLiluoBaselineEntries() {
  const frames = ['portrait', 'mid-shot', 'full-body', 'environmental']
  return worlds.flatMap((world) =>
    frames.map((frame, index) => {
      const look = world.liluoLooks[index % world.liluoLooks.length]
      return createEntry({
        id: `visual-liluo-baseline-${world.id}-${frame}`,
        title: `${world.name} / 璃落身份基线 / ${frame}`,
        collection: 'liluo-character',
        worldId: world.id,
        seriesId: worldSeriesMap.get(world.id)?.id || null,
        pageTargets: ['home-liluo', 'characters', `world-${world.id}`],
        publicationStatus: 'public_safe',
        promptStatus: 'promptReady',
        evidenceLevel: 'concept',
        shotType: frame,
        timeOfDay: ['day', 'dawn', 'dusk', 'night'][index % 4],
        weather: ['clear', 'overcast', 'indoor', 'windy'][index % 4],
        visualLanguage: 'editorial-character-sheet',
        tags: ['璃落', world.name, '身份基线', look.hair, look.outfit],
        previewAssetId: getPublishedAsset(`pub-liluo-${world.id}-variant`) ? `pub-liluo-${world.id}-variant` : 'pub-liluo-portrait',
        proofBoundary: '公开角色基线海报，不声明玩法落地。',
        brief: {
          focus: `${world.name} 中的璃落身份基线`,
          composition: frame,
          subject: `${look.hair} / ${look.outfit}`,
          use: 'Batch 00 身份校准',
        },
        prompt: [
          `为璃落宇宙官网生成一张璃落身份基线海报，世界是 ${world.name}。`,
          `她固定为 22 岁成年女性，红发红瞳，气质稳定，当前造型使用 ${look.hair} 与 ${look.outfit}。`,
          `镜头采用 ${frame}，画面需要同时说明她与 ${world.tagline} 的关系，背景可以参考 ${world.zones[index % world.zones.length].scene}。`,
          `整体情绪偏向 ${look.mood}，保持公开安全、可阅读、适合网页排版留白，不在图中生成文字。`,
        ].join(' '),
      })
    }),
  )
}

function buildLiluoWorldEntries(world) {
  const actions = [
    { id: 'observe', label: '观察', detail: '在真实可停留的空间里做判断' },
    { id: 'walk', label: '行走', detail: '带着目的穿过一个被持续使用的场景' },
    { id: 'work', label: '工作', detail: '正在完成一项具体劳动' },
    { id: 'read', label: '阅读', detail: '处理文档、线索或长期资料' },
    { id: 'assist', label: '协助', detail: '和其他成年人共同完成事务' },
    { id: 'rest', label: '短暂休息', detail: '在世界里停下而不是摆拍' },
  ]
  const frames = [
    { id: 'portrait', label: '角色封面', aspect: '4:5' },
    { id: 'mid', label: '叙事中景', aspect: '16:9' },
    { id: 'full', label: '全身动作', aspect: '16:9' },
    { id: 'env', label: '人与环境', aspect: '21:9' },
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
          title: `${world.name} / 璃落 / ${action.label} / ${frame.label}`,
          collection: 'liluo-character',
          worldId: world.id,
          seriesId: worldSeriesMap.get(world.id)?.id || null,
          pageTargets: ['characters', 'gallery', `world-${world.id}`],
          publicationStatus: 'public_safe',
          promptStatus: 'promptReady',
          evidenceLevel: 'concept',
          shotType: frame.id,
          timeOfDay: ['dawn', 'day', 'dusk', 'night'][counter % 4],
          weather: ['clear', 'overcast', 'interior', 'wind'][counter % 4],
          visualLanguage: 'narrative-character-illustration',
          tags: ['璃落', world.name, action.label, frame.label, look.hair, look.outfit],
          previewAssetId: `pub-liluo-${world.id}-variant`,
          proofBoundary: '公开角色视觉，不直接写入未确认剧情。',
          brief: {
            focus: `${world.name} 中的璃落角色变化`,
            composition: frame.label,
            subject: `${action.label} / ${look.hair} / ${look.outfit}`,
            use: '角色页、世界页、图鉴',
          },
          prompt: [
            `为官网生成一张 ${world.name} 世界中的璃落角色海报，主题是“璃落正在${action.detail}”。`,
            `她固定为成年女性，红发红瞳，当前外观为 ${look.hair} 与 ${look.outfit}，情绪基调 ${look.mood}。`,
            `场景放在 ${zone.label}，要表现 ${zone.scene} 与 ${zone.detail}，镜头采用 ${frame.label}，比例偏向 ${frame.aspect}。`,
            `保持世界氛围 ${world.atmosphere}，适合网页裁切，不生成文字，不做幼态或过度性感表达。`,
          ].join(' '),
        }),
      )
      counter += 1
    }
  }
  return entries
}

function buildWorldAtlasEntries(world) {
  const times = [
    { id: 'dawn', label: '黎明', light: '低角度晨光与刚开始活动的人流' },
    { id: 'day', label: '白昼', light: '清晰日照与完整运行状态' },
    { id: 'dusk', label: '黄昏', light: '暖冷交替的边界时刻' },
    { id: 'night', label: '夜晚', light: '受控灯光与更强空间层次' },
  ]
  const shots = [
    { id: 'establishing', label: '建立镜头', composition: '宽幅建立镜头，优先读空间秩序' },
    { id: 'lived-in', label: '生活中景', composition: '中景，突出空间被长期使用的痕迹' },
    { id: 'detail', label: '细节近景', composition: '近景切入材质、器物与重复劳动' },
    { id: 'circulation', label: '流动视角', composition: '带前景遮挡的通行镜头，强调路径与停留' },
  ]
  const entries = []
  for (const zone of world.zones) {
    for (const time of times) {
      for (const shot of shots) {
        entries.push(
          createEntry({
            id: `visual-world-${world.id}-${zone.id}-${time.id}-${shot.id}`,
            title: `${world.name} / ${zone.label} / ${time.label} / ${shot.label}`,
            collection: 'world-atlas',
            worldId: world.id,
            seriesId: worldSeriesMap.get(world.id)?.id || null,
            pageTargets: ['worlds', `world-${world.id}`, 'gallery'],
            publicationStatus: 'public_safe',
            promptStatus: 'promptReady',
            evidenceLevel: 'concept',
            shotType: shot.id,
            timeOfDay: time.id,
            weather: ['clear', 'haze', 'interior', 'wind'][entries.length % 4],
            visualLanguage: 'world-atlas-poster',
            tags: [world.name, zone.label, time.label, shot.label, 'world-atlas'],
            previewAssetId:
              shot.id === 'establishing'
                ? `pub-world-${world.id}-poster`
                : shot.id === 'detail'
                  ? `pub-world-${world.id}-event`
                  : `pub-world-${world.id}-scene`,
            proofBoundary: '世界 atlas 只表达公开安全环境与生活切片，不把概念图写成可玩证据。',
            brief: {
              focus: `${world.name} 世界 atlas`,
              composition: `${time.label} / ${shot.label}`,
              subject: zone.label,
              use: '世界页、首页、图鉴、分享素材',
            },
            prompt: [
              `为璃落宇宙官网生成一张 ${world.name} 世界 atlas 海报，位置是 ${zone.label}。`,
              `公开方向是“${world.tagline}”，场景需要表现 ${zone.scene}，并把 ${zone.detail} 放入画面。`,
              `时间设定为 ${time.label}，光线强调 ${time.light}，镜头使用 ${shot.composition}。`,
              `材质重点包含 ${world.materials.join('、')}，生活节奏参考 ${world.routines.join('、')}，整体氛围为 ${world.atmosphere}。`,
            ].join(' '),
          }),
        )
      }
    }
  }
  return entries
}

function buildBranchEntries(world) {
  const positions = [
    { id: 'space', label: '空间建立', detail: '用地点说明分支为什么值得进入' },
    { id: 'object', label: '关键物件', detail: '用器物承载线索与关系' },
    { id: 'interaction', label: '协作动作', detail: '通过具体动作呈现人物关系' },
    { id: 'afterglow', label: '余波停留', detail: '在事件后给出可停留的安静痕迹' },
  ]
  const tones = [
    { id: 'calm', label: '平静', mood: '克制、可停留、不过度剧透' },
    { id: 'tense', label: '紧张', mood: '压力在场，但不靠极端冲突直给' },
    { id: 'turning', label: '转折前', mood: '下一步即将变化，但先停在门槛上' },
    { id: 'recovery', label: '恢复中', mood: '留下关系与环境被影响后的痕迹' },
  ]
  const worldSeries = worldSeriesMap.get(world.id)
  const entries = []
  for (const seed of world.branchSeeds) {
    for (const position of positions) {
      for (const tone of tones) {
        entries.push(
          createEntry({
            id: `visual-branch-${world.id}-${seed.id}-${position.id}-${tone.id}`,
            title: `${world.name} / ${seed.title} / ${position.label} / ${tone.label}`,
            collection: 'story-branch',
            worldId: world.id,
            seriesId: worldSeries?.id || null,
            pageTargets: [`world-${world.id}`, worldSeries?.id ? `series-${worldSeries.id}` : 'gallery', 'home-branch'],
            publicationStatus: position.id === 'space' || position.id === 'object' ? 'public_safe' : 'review_required',
            promptStatus: 'promptReady',
            evidenceLevel: 'concept',
            shotType: position.id,
            timeOfDay: ['day', 'dusk', 'night', 'dawn'][entries.length % 4],
            weather: ['clear', 'overcast', 'rain', 'wind'][entries.length % 4],
            visualLanguage: 'branch-poster',
            tags: [world.name, seed.title, position.label, tone.label, seed.object],
            previewAssetId: `pub-world-${world.id}-event`,
            proofBoundary: '分支海报只做公开安全预告，不直接写结局与敏感细节。',
            brief: {
              focus: `${seed.title} 的公开预告`,
              composition: `${position.label} / ${tone.label}`,
              subject: seed.object,
              use: '世界详情、分支页、首页分支段落',
            },
            prompt: [
              `为官网生成一张 ${world.name} 分支海报，主题是“${seed.title}”。`,
              `海报要围绕 ${position.detail} 展开，关键物件是 ${seed.object}，情绪为 ${tone.mood}。`,
              `分支前提是 ${seed.premise}，核心张力是 ${seed.tension}，必须保持公开安全和非剧透表达。`,
              `世界氛围继续遵循 ${world.atmosphere}，适合作为网页章节海报与分支入口图。`,
            ].join(' '),
          }),
        )
      }
    }
  }
  return entries
}

function buildGeneralEntries(groupId, seeds) {
  const compositions = [
    { id: 'hero', label: '横幅主视觉', aspect: '21:9' },
    { id: 'editorial', label: '编辑式双栏', aspect: '16:9' },
    { id: 'mosaic', label: '拼贴组合', aspect: '16:9' },
    { id: 'poster', label: '竖向封面', aspect: '4:5' },
  ]
  const repetitions = groupId === 'brand' || groupId === 'brandExpansion' ? 3 : 4
  const laneLabel =
    groupId === 'brand'
      ? '首页品牌首轮'
      : groupId === 'brandExpansion'
        ? '品牌扩展波次'
        : groupId === 'collaboration'
          ? '协作转化'
          : groupId === 'system'
            ? '系统说明'
            : groupId === 'support'
              ? '支撑转场'
              : '证据辅助'
  const routeTarget =
    groupId === 'collaboration' ? 'collab' : groupId === 'system' ? 'production' : groupId === 'evidence' ? 'evidence' : 'roadmap'
  const entries = []
  for (const seed of seeds) {
    for (let index = 0; index < repetitions; index += 1) {
      const composition = compositions[(entries.length + index) % compositions.length]
      const timeHint = ['白昼', '金色时段', '室内柔光', '夜间点灯'][entries.length % 4]
      entries.push(
        createEntry({
          id: `visual-${groupId}-${seed.id}-${index + 1}`,
          title: `${seed.title} / ${composition.label} / ${index + 1}`,
          collection: 'general-cross-site',
          pageTargets: ['home', routeTarget],
          publicationStatus: 'public_safe',
          promptStatus: 'promptReady',
          evidenceLevel: 'concept',
          shotType: composition.id,
          timeOfDay: ['day', 'dusk', 'night', 'interior'][entries.length % 4],
          weather: ['clear', 'soft-haze', 'interior', 'wind'][entries.length % 4],
          visualLanguage: `${groupId}-visual`,
          tags: [seed.title, composition.label, groupId],
          previewAssetId: seed.previewAssetId,
          proofBoundary: '跨页海报只用于海报节奏、信息分层与转化，不冒充真实运行状态。',
          brief: {
            focus: seed.title,
            composition: composition.label,
            subject: seed.scene,
            use: laneLabel,
          },
          prompt: [
            `为璃落宇宙官网生成一张 ${laneLabel} 海报，主题是 ${seed.title}。`,
            `主场景为 ${seed.scene}，构图使用 ${composition.label}，比例偏向 ${composition.aspect}，适合网页叠加标题与统计卡。`,
            `整体情绪是 ${seed.mood}，时间提示偏向 ${timeHint}，核心意图是 ${seed.composition}。`,
            `必须公开安全、原创、无文字、无 Logo、无水印，并明确属于 registry 条目 visual-${groupId}-${seed.id}-${index + 1}。`,
          ].join(' '),
        }),
      )
    }
  }
  return entries
}

function buildScreenshotBriefs() {
  const captured = publicScreenshotSources.map((source, index) => ({
    id: `shot-captured-${source.id}`,
    title: source.title,
    proofTarget: source.proofTarget,
    routeOrEntry: index < 2 ? '/game' : '/game -> menu',
    preconditions: ['使用现有公开截图素材', '仅用于证据页与首页证据段落'],
    exactSteps: ['复核现有截图来源路径', '确认截图对应的可见状态', '保留必要 UI 与世界信息'],
    expectedVisibleState: source.proofTarget,
    viewport: { width: 1600, height: 900, orientation: 'landscape' },
    hideOrRedact: ['不显示浏览器外壳', '不暴露本地路径'],
    captureFormat: 'png',
    targetPages: source.targetPages,
    evidenceLevel: 'runtime-capture',
    validationDate: generatedAt,
    buildOrCommit: 'existing-public-proof',
    status: 'captured',
    worldId: inferWorldFromTargets(source.targetPages),
  }))

  const generalSeeds = [
    'main-menu-shell',
    'world-entry-map',
    'dialogue-panel',
    'save-load-panel',
    'travel-menu',
    'gallery-filter',
    'relationship-graph',
    'interactive-fiction',
    'state-panel',
    'build-proof',
    'home-to-game-cta',
    'mobile-safe-area',
    'world-detail-scroll',
    'series-poster-view',
    'collab-cta-proof',
    'devlog-card-proof',
    'production-route-proof',
  ]

  const plannedGeneral = generalSeeds.map((seed, index) => ({
    id: `shot-general-${seed}`,
    title: `通用证据任务 / ${index + 1}`,
    proofTarget: '补齐官网与 /game 的真实共存证据',
    routeOrEntry: index < 10 ? '/game' : '/',
    preconditions: ['本地构建成功', '页面可稳定进入目标状态'],
    exactSteps: ['进入指定路由', '切换到说明中的 UI 状态', '等待动画与布局稳定', '保留关键证据元素后截图'],
    expectedVisibleState: '证据页声明中的真实系统或真实入口状态',
    viewport: { width: 1600, height: 900, orientation: 'landscape' },
    hideOrRedact: ['不保留浏览器书签栏', '不泄露调试面板'],
    captureFormat: 'png',
    targetPages: ['evidence', 'home-proof'],
    evidenceLevel: 'runtime-capture',
    validationDate: generatedAt,
    buildOrCommit: 'site-poster-upgrade',
    status: 'planned',
    worldId: null,
  }))

  const worldTasks = worlds.flatMap((world) =>
    [
      'world-entry',
      'world-movement',
      'world-ui',
      'world-dialogue',
      'world-event',
      'world-state',
      'world-menu',
      'world-evidence',
      'world-portrait',
      'world-route',
      'world-series',
      'world-mobile',
    ].map((suffix, index) => ({
      id: `shot-${world.id}-${suffix}`,
      title: `${world.name} / 截图任务 / ${index + 1}`,
      proofTarget: `${world.name} 需要一组可复核的真实截图，证明官网不是空海报。`,
      routeOrEntry: '/game',
      preconditions: [`进入 ${world.name} 对应可展示入口`, '确认地图、UI 或相关面板已加载'],
      exactSteps: ['进入对应世界或相关运行入口', '抵达指定 UI 与场景组合', '保留世界辨识元素与必要系统 UI', '等待稳定后截图'],
      expectedVisibleState: `${world.name} 的空间、UI、人物或系统证据同时可见`,
      viewport: { width: 1600, height: 900, orientation: index % 4 === 0 ? 'portrait' : 'landscape' },
      hideOrRedact: ['不显示浏览器外壳', '不隐藏真实关键 UI'],
      captureFormat: 'png',
      targetPages: ['evidence', `world-${world.id}`],
      evidenceLevel: 'runtime-capture',
      validationDate: generatedAt,
      buildOrCommit: 'site-poster-upgrade',
      status: 'planned',
      worldId: world.id,
    })),
  )

  return [...captured, ...plannedGeneral, ...worldTasks].slice(0, 96)
}

function createEntry({
  id,
  title,
  collection,
  worldId = null,
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
  return {
    id,
    title,
    collection,
    worldId,
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
    prompt: `${prompt} Registry key: ${id}. Primary page targets: ${pageTargets.join(', ')}.`,
    generatedAt,
    promptModel,
  }
}

function inferWorldFromTargets(targetPages) {
  const match = targetPages.find((item) => item.startsWith('world-'))
  return match ? match.replace('world-', '') : null
}

function batchTitle(batchId, items) {
  if (batchId === 'B00') return '璃落身份参考与 QA 基线'
  if (batchId === 'B01') return '品牌与首页第一波'
  if (batchId >= 'B02' && batchId <= 'B07') return `${items[0]?.worldId || 'world'} 世界 atlas 第一波`
  if (batchId === 'B08') return '协作与系统首页补强'
  return `扩展批次 ${batchId}`
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

function summarizeCounts(items, keyFn) {
  return Object.entries(
    items.reduce((acc, item) => {
      const key = keyFn(item)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}),
  ).map(([key, count]) => ({ key, count }))
}

export {
  collaborationTracks,
  devlogEntries,
  developmentStatuses,
  evidenceLevels,
  footerNavigation,
  liluoProfile,
  navigation,
  productionPhases,
  roadmapItems,
  series,
  siteConfig,
  worlds,
}
