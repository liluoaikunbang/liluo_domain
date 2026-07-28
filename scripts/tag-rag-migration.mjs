#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const batchId = 'tag-rag-restructure-v1';
const apply = process.argv.includes('--apply');
const finalize = process.argv.includes('--finalize');
const readJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
const unique = (values) => [...new Set((values ?? []).filter(Boolean))];
const slug = (value) =>
  String(value).trim().toLocaleLowerCase('zh-CN').replace(/did/giu, 'did')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '');

function loadStories() {
  const directory = join(root, 'src/game/data/story_outline/sources');
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .flatMap((name) => readJson(`src/game/data/story_outline/sources/${name}`).nodes ?? []);
}

function readHeadJson(relativePath) {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${relativePath.replaceAll('\\', '/')}`], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true
    }));
  } catch {
    return null;
  }
}

function loadBaselineStories() {
  const directory = join(root, 'src/game/data/story_outline/sources');
  return readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .flatMap((name) => readHeadJson(`src/game/data/story_outline/sources/${name}`)?.nodes ?? []);
}

function migrationValues(active, legacy, baseline) {
  if (Array.isArray(active)) return active;
  if (Array.isArray(legacy) && legacy.length) return legacy;
  return Array.isArray(baseline) ? baseline : [];
}

const ragIds = new Map([
  ['触手', 'rag.restraint.material.tentacle'], ['感官刺激', 'rag.restraint.effect.sensory-stimulation'],
  ['活埋', 'rag.restraint.context.burial-restraint'], ['监禁', 'rag.restraint.state.confinement'],
  ['胶水', 'rag.restraint.material.glue'], ['脚镣', 'rag.restraint.tool.leg-irons'],
  ['拘束生活', 'rag.restraint.context.restrained-life'], ['拘束衣', 'rag.restraint.tool.straitjacket'],
  ['镣铐', 'rag.restraint.tool.shackles'], ['灵魂拘束', 'rag.restraint.supernatural.soul-restraint'],
  ['挠痒', 'rag.restraint.effect.tickling'], ['气味系', 'rag.restraint.effect.odor-stimulation'],
  ['全身包裹', 'rag.restraint.structure.full-body-wrapping'], ['社死', 'rag.restraint.effect.public-humiliation'],
  ['手铐', 'rag.restraint.tool.handcuffs'], ['束腰', 'rag.restraint.structure.waist-restraint'],
  ['水泥鞋', 'rag.restraint.tool.cement-shoes'], ['丝袜拘束', 'rag.restraint.material.stocking-restraint'],
  ['锁链', 'rag.restraint.tool.chain'], ['疼痛', 'rag.restraint.effect.pain'],
  ['性刺激', 'rag.restraint.effect.sexual-stimulation'], ['永久拘束', 'rag.restraint.duration.permanent-restraint'],
  ['扎带', 'rag.restraint.tool.cable-tie'], ['蛛丝', 'rag.restraint.material.spider-silk']
]);
const plotTitles = new Set([
  'DID-绑架', 'DID-拐卖', '社死-捆绑上街', '社死-教室被绑', '社死-伪装拘束',
  '活埋-露头活埋', '活埋-沙滩活埋', '胶水-胶水粘嘴', '疼痛-捆绑拉伸'
]);
const ragSpecialTitles = new Set([
  '感官刺激-芥末辣椒等', '寒冷', '挠痒-山药汁', '挠痒-蚊子', '虐足-小鞋',
  '气味系-踩踩', '石膏-石膏包手', '水牢', '特殊-拘捕网', '无鞋', '小黑屋',
  '小笼子', '性刺激-三点刺激', '眼耳口鼻', '荧光绳', '语言羞辱', '冤罪'
]);
const gameplayHints = [
  '行动点', '回合', '进度', '管理', '训练', '评估', '调查', '取证', '证据', '探索',
  '收集', '选择', '路线', '定位', '比赛', '斗地主', '导览', '委托板', '改造',
  '摄影', '收藏', '识别', '辨识', '追踪', '申报', '时间线', '据点'
];
const gameplayRefsBySpecial = new Map([
  ['按案件性质联系警方或异常灾害处理组织', ['gameplay-107']],
  ['保全证据与优先救援的风险取舍', ['gameplay-013', 'gameplay-107']],
  ['暴露后强化约束路线', ['gameplay-116']],
  ['从城市委托板选择独立案件', ['gameplay-090']],
  ['电梯纵向时间线', ['gameplay-068']],
  ['房车移动据点', ['gameplay-087']],
  ['复学校园导览', ['gameplay-003']],
  ['改造进度管理', ['gameplay-091']],
  ['感知适应训练', ['gameplay-116']],
  ['记忆触发调查', ['gameplay-060']],
  ['监区身份伪装', ['gameplay-046']],
  ['旧房车改造', ['gameplay-083', 'gameplay-087']],
  ['救援进度与受限进度双主轴', ['gameplay-013']],
  ['拘束状态选择', ['gameplay-013']],
  ['课堂目标与整蛊升级竞速', ['gameplay-100']],
  ['灵异辨识', ['gameplay-066']],
  ['旅行摄影', ['gameplay-111']],
  ['每周身体适应评估', ['gameplay-114']],
  ['涉外手续取证', ['gameplay-060']],
  ['识别学生异能来源', ['gameplay-066']],
  ['受限书写训练', ['gameplay-116']],
  ['受限状态工具搜集', ['gameplay-082']],
  ['受限状态下维持授课', ['gameplay-116']],
  ['同一行动连续两次触发、切换一轮解除的敌方反制', ['gameplay-116']],
  ['无限层级探索', ['gameplay-012']],
  ['校园论坛线索收集', ['gameplay-060']],
  ['选择继续取证或提前救援', ['gameplay-013']],
  ['训练合规与暗中反抗', ['gameplay-046', 'gameplay-104']],
  ['永久拘束标记反向定位', ['gameplay-029']],
  ['泳池漂浮物路线', ['gameplay-094']],
  ['游客与定居身份申报', ['gameplay-104']],
  ['游戏-紧缚比赛', ['gameplay-099', 'gameplay-100']],
  ['游戏-紧缚斗地主', ['gameplay-072']],
  ['有限行动点驱动的四选一回合行动', ['gameplay-072']],
  ['在工业园轮班时刻表中追踪目标车辆', ['gameplay-060', 'gameplay-109']],
  ['照片墙收藏', ['gameplay-112']],
  ['证据筛选', ['gameplay-060']]
  ,['对照考勤、班车与劳务单建立证据链', ['gameplay-060']]
  ,['短篇职业体验', ['gameplay-119']]
  ,['危机拖延救援', ['gameplay-013']]
  ,['一年课程时间压缩', ['gameplay-114']]
]);
const plotIdsBySpecial = new Map([
  ['反套路-女仆捆主人', 'plot-055'],
  ['普通绑架脱困', 'plot-056'],
  ['区别对待', 'plot-057'],
  ['职业-火车乘务员', 'plot-058'],
  ['职业-教师', 'plot-059'],
  ['职业-美人鱼模特', 'plot-060'],
  ['职业-模特', 'plot-061'],
  ['职业-演员', 'plot-062']
]);
const extraRagIds = new Map([
  ['刺激-自由落体', 'rag.restraint.effect.free-fall-stimulation'],
  ['镣铐-压腿铐', 'rag.restraint.pose.leg-press-shackles'],
  ['露天地牢', 'rag.restraint.context.open-air-dungeon']
]);
const KNOWN_SPECIAL_TITLE_SET = new Set([
  ...plotTitles, ...ragSpecialTitles, ...gameplayRefsBySpecial.keys(),
  ...plotIdsBySpecial.keys(), ...extraRagIds.keys()
]);
const plotKindOverrides = new Map([
  ['plot-041', 'mixed'], ['plot-042', 'mixed'], ['plot-043', 'mixed'],
  ['plot-044', 'restraint'], ['plot-045', 'mixed']
]);

function classifySpecial(title) {
  if (plotIdsBySpecial.has(title)) return { migrationType: ['plot'], newIds: [plotIdsBySpecial.get(title)], status: 'proposed' };
  if (extraRagIds.has(title)) return { migrationType: ['rag'], newIds: [extraRagIds.get(title)], status: 'proposed' };
  if (gameplayRefsBySpecial.has(title)) {
    return { migrationType: ['gameplay'], newIds: gameplayRefsBySpecial.get(title), status: 'proposed' };
  }
  if (plotTitles.has(title)) return { migrationType: ['plot'], newIds: [`plot.migration.${slug(title)}`], status: 'proposed' };
  if (ragSpecialTitles.has(title)) return { migrationType: ['rag'], newIds: [`rag.restraint.detail.${slug(title)}`], status: 'proposed' };
  if (gameplayHints.some((hint) => title.includes(hint))) return {
    migrationType: ['gameplay'], newIds: [], status: 'pending_review',
    options: [
      { type: 'gameplay-existing', reason: '优先挂接玩法总表中语义相同的正式玩法或变体。' },
      { type: 'gameplay-new', reason: '只有现有玩法无法承载完整规则时才新增玩法条目。' }
    ]
  };
  return {
    migrationType: [], newIds: [], status: 'pending_review',
    options: [
      { type: 'plot', reason: '若正文包含明确场景、过程、参与者和结果，迁为情节。' },
      { type: 'rag', reason: '若它是可跨故事复用的器具、状态、结构或效果，迁为 RAG。' },
      { type: 'gameplay', reason: '若它规定玩家操作、回合、数值或挑战，迁为玩法。' }
    ]
  };
}

function buildPlan() {
  const stories = loadStories();
  const plots = readJson('src/game/data/plot_outline/catalog.json').entries ?? [];
  const baselineStories = new Map(loadBaselineStories().map((story) => [story.key, story]));
  const baselinePlots = new Map((readHeadJson('src/game/data/plot_outline/catalog.json')?.entries ?? []).map((plot) => [plot.id, plot]));
  const storyTags = new Map(), specialGameplay = new Map(), plotTags = new Map();
  for (const story of stories) {
    const baseline = baselineStories.get(story.key);
    for (const title of migrationValues(story.bondageTags, story.legacyTagMigration?.bondageTags, baseline?.bondageTags)) {
      if (!storyTags.has(title)) storyTags.set(title, []);
      storyTags.get(title).push(story.key);
    }
    for (const title of migrationValues(
      story.specialGameplay,
      story.legacyTagMigration?.specialGameplay,
      baseline?.specialGameplay
    ).filter((value) => KNOWN_SPECIAL_TITLE_SET.has(value))) {
      if (!specialGameplay.has(title)) specialGameplay.set(title, []);
      specialGameplay.get(title).push(story.key);
    }
  }
  for (const plot of plots) for (const title of migrationValues(
    plot.bondageTags,
    plot.legacyTagMigration?.bondageTags,
    baselinePlots.get(plot.id)?.bondageTags
  )) {
    if (!plotTags.has(title)) plotTags.set(title, []);
    plotTags.get(title).push(plot.id);
  }

  const records = [];
  for (const title of unique([...storyTags.keys(), ...plotTags.keys()]).sort((a, b) => a.localeCompare(b, 'zh-CN'))) {
    if (title === '游戏') {
      records.push({
        oldId: `bondage_tag:${slug(title)}`, oldTitle: title, oldLayer: 'category',
        migrationType: ['gameplay'], newIds: ['gameplay-072', 'gameplay-099', 'gameplay-100'],
        affectedStoryIds: unique(storyTags.get(title)), affectedPlotIds: unique(plotTags.get(title)),
        status: 'proposed'
      });
    } else if (title === 'DID' || title === '模特') {
      records.push({
        oldId: `bondage_tag:${slug(title)}`, oldTitle: title, oldLayer: 'category',
        migrationType: ['plot'], newIds: unique(plotTags.get(title)),
        affectedStoryIds: unique(storyTags.get(title)), affectedPlotIds: unique(plotTags.get(title)),
        status: 'proposed'
      });
    } else {
      records.push({
        oldId: `bondage_tag:${slug(title)}`, oldTitle: title, oldLayer: 'category',
        migrationType: ['rag'], newIds: [ragIds.get(title) ?? `rag.restraint.concept.${slug(title)}`],
        affectedStoryIds: unique(storyTags.get(title)), affectedPlotIds: unique(plotTags.get(title)),
        status: 'proposed'
      });
    }
  }
  for (const [title, storyIds] of [...specialGameplay].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))) {
    records.push({
      oldId: `bondage_tag:sg:${slug(title)}`, oldTitle: title, oldLayer: 'concept',
      ...classifySpecial(title), affectedStoryIds: unique(storyIds), affectedPlotIds: []
    });
  }
  const knownSpecialTitles = [...KNOWN_SPECIAL_TITLE_SET];
  for (const title of knownSpecialTitles) {
    if (records.some((record) => record.oldLayer === 'concept' && record.oldTitle === title)) continue;
    const classification = classifySpecial(title);
    const affectedStoryIds = stories.filter((story) =>
      classification.newIds.some((id) =>
        classification.migrationType.includes('rag') ? (story.ragRefs ?? []).includes(id)
          : classification.migrationType.includes('plot') ? (story.plotRefs ?? []).includes(id)
            : (story.gameplayRefs ?? []).includes(id)
      )
    ).map((story) => story.key);
    records.push({
      oldId: `bondage_tag:sg:${slug(title)}`, oldTitle: title, oldLayer: 'concept',
      ...classification, affectedStoryIds: unique(affectedStoryIds), affectedPlotIds: [],
      recoveredFrom: 'post-migration refs after legacy snapshot repair'
    });
  }
  const counts = records.reduce((result, record) => {
    result.total += 1;
    result[record.status] = (result[record.status] ?? 0) + 1;
    for (const type of record.migrationType) result.byTarget[type] = (result.byTarget[type] ?? 0) + 1;
    return result;
  }, { total: 0, proposed: 0, pending_review: 0, byTarget: {} });
  return {
    schemaVersion: 1, batchId, mode: finalize ? 'finalize' : apply ? 'apply' : 'dry-run', generatedAt: new Date().toISOString(),
    sourcePolicy: 'Existing working tree is the migration baseline; no reset or rollback.',
    rollback: {
      strategy: 'Keep this oldId→newIds manifest and retain the pre-migration Git/worktree snapshot until validation passes.',
      destructiveDeletionAllowed: false
    },
    counts, records
  };
}

const plan = buildPlan();
const output = join(root, 'project-workflows/runs', `${batchId}.dry-run.json`);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
if (apply || finalize) {
  if (finalize && plan.counts.pending_review > 0) throw new Error('Cannot finalize with pending_review records.');
  applyMigration(plan);
}
console.log(JSON.stringify({ output: output.slice(root.length + 1), ...plan.counts }, null, 2));

function cardTypeFromId(id) {
  return ['tool', 'material', 'structure', 'state', 'effect', 'duration', 'supernatural', 'context']
    .find((type) => id.includes(`.${type}.`)) ?? 'term';
}

function applyMigration(currentPlan) {
  const recordsByTitle = new Map(currentPlan.records.map((record) => [record.oldTitle, record]));
  const ragRecords = currentPlan.records.filter((record) => record.status === 'proposed' && record.migrationType.includes('rag'));
  for (const record of ragRecords) {
    for (const cardId of record.newIds) {
      const directory = join(root, 'external-knowledge/cards/restraint');
      mkdirSync(directory, { recursive: true });
      const path = join(directory, `${cardId}.json`);
      if (exists(path)) continue;
      const card = {
        cardId, title: record.oldTitle, domain: 'restraint', cardType: cardTypeFromId(cardId),
        aliases: [], summary: '', definition: '', sourceRefs: [], evidenceStatus: 'missing',
        contentStatus: 'stub', reviewStatus: 'pending', directQuoteIncluded: false, canonical: false,
        knowledgeScope: 'external-fiction-reference', migration: {
          batchId, oldIds: [record.oldId], generatedFrom: 'legacy-tag-title-only'
        }
      };
      writeFileSync(path, `${JSON.stringify(card, null, 2)}\n`, 'utf8');
    }
  }

  const plotPath = join(root, 'src/game/data/plot_outline/catalog.json');
  const plotCatalog = JSON.parse(readFileSync(plotPath, 'utf8'));
  if (!plotCatalog.groups.some((group) => group.id === 'plot-group-025')) {
    plotCatalog.groups.push({
      id: 'plot-group-025',
      title: '职业与身份体验',
      summary: '人物进入具体职业或身份场景后形成的可复用情节；玩家操作规则仍由玩法库承担。'
    });
  }
  for (const record of currentPlan.records.filter((item) =>
    item.status === 'proposed' &&
    item.oldLayer === 'concept' &&
    item.migrationType.includes('plot') &&
    item.newIds.some((id) => /^plot-\d+$/u.test(id))
  )) {
    for (const id of record.newIds) {
      const existing = plotCatalog.entries.find((entry) => entry.id === id);
      if (existing) {
        if ((existing.usedByLabels ?? []).length !== (existing.usedBy ?? []).length) {
          existing.usedByLabels = [...(existing.usedBy ?? [])];
        }
        continue;
      }
      const isCareer = record.oldTitle.startsWith('职业-');
      plotCatalog.entries.push({
        id,
        number: id.replace('plot-', ''),
        groupId: isCareer ? 'plot-group-025' : 'plot-group-004',
        title: record.oldTitle.replace(/^[^-]+-/u, ''),
        summary: `由旧 specialGameplay「${record.oldTitle}」迁移；具体场景、过程与结果以关联故事正文为准。`,
        plotKind: isCareer ? 'mixed' : 'restraint',
        worldBiases: [],
        ragRefs: [],
        characters: [],
        isUsed: record.affectedStoryIds.length > 0,
        usageStatus: record.affectedStoryIds.length > 0 ? 'used' : 'unused',
        usedBy: record.affectedStoryIds,
        usedByLabels: record.affectedStoryIds,
        notes: `迁移批次 ${batchId}；未从标题补写缺失剧情。`,
        development: {
          premise: '具体内容见关联故事正文',
          escalation: '具体内容见关联故事正文',
          turn: '具体内容见关联故事正文',
          consequence: '具体内容见关联故事正文'
        },
        migration: { batchId, oldIds: [record.oldId] }
      });
    }
  }
  for (const entry of plotCatalog.entries ?? []) {
    const oldTags = unique(entry.bondageTags ?? entry.legacyTagMigration?.bondageTags);
    entry.legacyTagMigration = {
      batchId,
      bondageTags: oldTags,
      ordinaryTags: unique(entry.tags ?? entry.legacyTagMigration?.ordinaryTags),
      status: oldTags.some((title) => recordsByTitle.get(title)?.status !== 'proposed')
        ? 'pending_review'
        : 'mapped'
    };
    entry.plotKind ??= oldTags.length ? 'restraint' : 'ordinary';
    if (plotKindOverrides.has(entry.id)) entry.plotKind = plotKindOverrides.get(entry.id);
    entry.ragRefs = unique([...(entry.ragRefs ?? []), ...oldTags.flatMap((title) => {
      const record = recordsByTitle.get(title);
      return record?.status === 'proposed' && record.migrationType.includes('rag') ? record.newIds : [];
    })]);
    if (finalize) {
      delete entry.tags;
      delete entry.bondageTags;
      delete entry.isBondagePlot;
    }
  }
  writeFileSync(plotPath, `${JSON.stringify(plotCatalog, null, 2)}\n`, 'utf8');

  const sourceDirectory = join(root, 'src/game/data/story_outline/sources');
  const storyByKey = new Map();
  for (const name of readdirSync(sourceDirectory).filter((item) => item.endsWith('.json')).sort()) {
    const path = join(sourceDirectory, name);
    const source = JSON.parse(readFileSync(path, 'utf8'));
    for (const story of source.nodes ?? []) {
      const pending = [];
      const oldBondageTags = story.bondageTags ?? story.legacyTagMigration?.bondageTags ?? [];
      const oldSpecialGameplay = story.specialGameplay ?? story.legacyTagMigration?.specialGameplay ?? [];
      story.legacyTagMigration = {
        batchId,
        plotTags: unique(story.plotTags ?? story.legacyTagMigration?.plotTags),
        bondageTags: unique(oldBondageTags),
        specialGameplay: unique(oldSpecialGameplay)
      };
      story.ragRefs = unique([...(story.ragRefs ?? []), ...oldBondageTags.flatMap((title) => {
        const record = recordsByTitle.get(title);
        if (record?.status === 'proposed' && record.migrationType.includes('rag')) return record.newIds;
        pending.push(record?.oldId ?? `bondage_tag:${slug(title)}`);
        return [];
      })]);
      story.plotRefs = unique([...(story.plotRefs ?? []), ...oldSpecialGameplay.flatMap((title) => {
        const record = recordsByTitle.get(title);
        if (record?.status === 'proposed' && record.migrationType.includes('plot')) return record.newIds;
        return [];
      })]);
      story.gameplayRefs = unique([...(story.gameplayRefs ?? []), ...oldSpecialGameplay.flatMap((title) => {
        const record = recordsByTitle.get(title);
        if (record?.status === 'proposed' && record.migrationType.includes('gameplay')) return record.newIds;
        return [];
      })]);
      for (const title of oldSpecialGameplay) {
        const record = recordsByTitle.get(title);
        if (!record || record.status !== 'proposed') pending.push(record?.oldId ?? `bondage_tag:sg:${slug(title)}`);
      }
      story.migrationPending = unique([...(story.migrationPending ?? []), ...pending]);
      if (finalize) {
        delete story.plotTags;
        delete story.bondageTags;
        delete story.specialGameplay;
        if (!story.migrationPending.length) delete story.migrationPending;
      }
      storyByKey.set(story.key, story);
    }
    writeFileSync(path, `${JSON.stringify(source, null, 2)}\n`, 'utf8');
  }

  const storyRoot = join(root, 'src/game/data/story_outline');
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'sources') walk(path);
      } else if (entry.name.endsWith('.md')) {
        const text = readFileSync(path, 'utf8');
        const key = text.match(/^key:\s*(.+)$/mu)?.[1]?.trim();
        const story = storyByKey.get(key);
        writeFileSync(path, story ? rewriteFrontmatter(text, story) : rewriteOrphanFrontmatter(text), 'utf8');
      }
    }
  };
  walk(storyRoot);
}

function rewriteOrphanFrontmatter(markdown) {
  if (!finalize || !markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end < 0) return markdown;
  const body = markdown.slice(end + 4);
  let frontmatter = markdown.slice(4, end);
  const legacy = [];
  for (const field of ['tags', 'plotTags', 'bondageTags', 'specialGameplay']) {
    const match = frontmatter.match(new RegExp(`(?:^|\\n)${field}:([^\\n]*)(?<items>(?:\\n\\s+-[^\\n]*)*)`, 'u'));
    if (match) {
      const scalar = match[1].trim();
      if (scalar && scalar !== '[]') legacy.push(`${field}:${scalar}`);
      for (const line of match.groups?.items?.split('\n') ?? []) {
        const value = line.replace(/^\s+-\s*/u, '').trim();
        if (value) legacy.push(`${field}:${value}`);
      }
    }
    frontmatter = frontmatter.replace(new RegExp(`(?:^|\\n)${field}:[^\\n]*(?:\\n\\s+-[^\\n]*)*`, 'gu'), '');
  }
  if (legacy.length) frontmatter = `${frontmatter.trim()}\nlegacyTagRefs:\n${unique(legacy).map((value) => `  - ${value}`).join('\n')}`;
  return `---\n${frontmatter.trim()}\n---${body}`;
}

function exists(path) {
  try { readFileSync(path); return true; } catch { return false; }
}

function rewriteFrontmatter(markdown, story) {
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end < 0) return markdown;
  const body = markdown.slice(end + 4);
  let frontmatter = markdown.slice(4, end);
  for (const field of [
    ...(finalize ? ['plotTags', 'bondageTags', 'specialGameplay'] : []),
    'plotRefs', 'ragRefs', 'gameplayRefs', 'migrationPending'
  ]) {
    frontmatter = frontmatter.replace(new RegExp(`(?:^|\\n)${field}:[^\\n]*(?:\\n\\s+-[^\\n]*)*`, 'gu'), '');
  }
  const blocks = [];
  for (const field of ['plotRefs', 'ragRefs', 'gameplayRefs', 'migrationPending']) {
    const values = unique(story[field]);
    if (!values.length) continue;
    blocks.push(`${field}:\n${values.map((value) => `  - ${value}`).join('\n')}`);
  }
  return `---\n${frontmatter.trim()}\n${blocks.join('\n')}\n---${body}`;
}
