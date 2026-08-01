import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseMarkdownFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';
import { storyOutlineSource } from '../../src/game/data/story_outline/storyOutlineSource.js';
import { storyCharacterOutline } from '../../src/game/data/story_outline/storyCharacterOutline.js';
import { plotOutline } from '../../src/game/data/plot_outline/plotOutline.js';
import { gameplayOutline } from '../../src/game/data/gameplay_outline/gameplayOutline.js';
import { buildOutlineRelationGraph } from '../../src/game/data/outline_relation_graph/buildOutlineRelationGraph.js';
import { SEEDED_CONCEPTS } from '../../src/game/data/outline_relation_graph/conceptRegistry.js';
import { deriveCoverage } from '../content-production/production-coverage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const readmeAssetDir = path.join(repoRoot, 'docs', 'assets', 'readme');
const generatedDir = path.join(readmeAssetDir, 'generated');
const screenshotDir = path.join(readmeAssetDir, 'screenshots');

const worldOrder = ['0-munika', '1-modern', '2-apocalypse', '3-ancient', '4-fantasy', '5-science'];
const worldPublicTitles = {
  '0-munika': '慕妮卡帝国',
  '1-modern': '浮光掠影',
  '2-apocalypse': '寂土挽歌',
  '3-ancient': '尘寰问道',
  '4-fantasy': '咒缚回响',
  '5-science': '星宇织梦',
};

const existingScreenshots = [
  {
    id: 'prototype-campus-map',
    file: 'docs/assets/readme/prototype-campus-map.png',
    label: '现代校园地图探索截图',
    type: 'repository-real-screenshot',
    verifiedAt: '2026-07-31',
    notes: [
      '仓库内已存在的真实运行截图。',
      '画面展示地图探索、三栏信息结构和像素场景。',
    ],
  },
  {
    id: 'prototype-gallery-ui',
    file: 'docs/assets/readme/prototype-gallery-ui.png',
    label: '旅途菜单与图鉴截图',
    type: 'repository-real-screenshot',
    verifiedAt: '2026-07-31',
    notes: [
      '仓库内已存在的真实运行截图。',
      '画面展示菜单、图鉴和长期资料承载界面。',
    ],
  },
  {
    id: 'readme-shot-03',
    file: 'docs/assets/readme/screenshots/README-SHOT-03-dialogue-and-map-event.png',
    label: '地图内对话与事件触发截图',
    type: 'user-supplied-real-screenshot',
    verifiedAt: '2026-08-01',
    notes: [
      '用户补回的真实运行截图。',
      '画面同时包含地图场景、对话框、角色差分立绘与右侧当前状态显示。',
    ],
  },
  {
    id: 'readme-shot-04',
    file: 'docs/assets/readme/screenshots/README-SHOT-04-save-load-panel.png',
    label: '真实存档与读档界面截图',
    type: 'user-supplied-real-screenshot',
    verifiedAt: '2026-08-01',
    notes: [
      '用户补回的真实运行截图。',
      '画面展示存档槽位、地点、状态、时间和存档管理按钮。',
    ],
  },
  {
    id: 'readme-shot-05',
    file: 'docs/assets/readme/screenshots/README-SHOT-05-relation-graph-panel.png',
    label: '关系图谱与大纲图谱面板截图',
    type: 'user-supplied-real-screenshot',
    verifiedAt: '2026-08-01',
    notes: [
      '用户补回的真实运行截图。',
      '画面展示故事、情节、玩法、人物等节点与连线，以及图谱操作栏。',
    ],
  },
  {
    id: 'readme-shot-06',
    file: 'docs/assets/readme/screenshots/README-SHOT-06-interactive-fiction-mode.png',
    label: '十三号病院互动小说模式截图',
    type: 'user-supplied-real-screenshot',
    verifiedAt: '2026-08-01',
    notes: [
      '用户补回的真实运行截图。',
      '画面展示十三号病院正式副本入口、正文区域与副本侧栏。',
    ],
  },
  {
    id: 'readme-shot-07',
    file: 'docs/assets/readme/screenshots/README-SHOT-07-restraint-state-combinations.png',
    label: '紧缚状态差分组合面板截图',
    type: 'user-supplied-real-screenshot',
    verifiedAt: '2026-08-01',
    notes: [
      '用户额外补回的真实运行截图。',
      '画面展示可切换的紧缚状态组合、立绘差分与图层显示面板。',
    ],
  },
];

const requestedScreenshots = [];

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function analyzeReadmeVisuals() {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const markdownImageCount = (readme.match(/!\[[^\]]*\]\((?!https?:\/\/|data:)[^)]+\)/g) ?? []).length;
  const htmlImageCount = (readme.match(/<img\s/gi) ?? []).length;
  return {
    markdownImageCount,
    htmlImageCount,
    visualUnitCount: markdownImageCount + htmlImageCount,
    targetMin: 28,
    targetMax: 36,
  };
}

function walkFiles(targetDir, predicate = () => true, bucket = []) {
  if (!fs.existsSync(targetDir)) {
    return bucket;
  }
  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    const fullPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, bucket);
      continue;
    }
    if (predicate(fullPath)) {
      bucket.push(fullPath);
    }
  }
  return bucket;
}

function sha256File(targetPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(targetPath));
  return hash.digest('hex');
}

function getPngDimensions(buffer) {
  if (buffer.length < 24) {
    return null;
  }
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function getSvgDimensions(text) {
  const viewBoxMatch = text.match(/viewBox="([\d.\s-]+)"/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
      return {
        width: parts[2],
        height: parts[3],
      };
    }
  }
  const widthMatch = text.match(/width="([\d.]+)"/i);
  const heightMatch = text.match(/height="([\d.]+)"/i);
  if (widthMatch && heightMatch) {
    return {
      width: Number(widthMatch[1]),
      height: Number(heightMatch[1]),
    };
  }
  return null;
}

function getAssetMetadata(absolutePath) {
  const ext = path.extname(absolutePath).toLowerCase();
  const buffer = fs.readFileSync(absolutePath);
  let dimensions = null;

  if (ext === '.png') {
    dimensions = getPngDimensions(buffer);
  } else if (ext === '.svg') {
    dimensions = getSvgDimensions(buffer.toString('utf8'));
  }

  return {
    path: path.relative(repoRoot, absolutePath).replaceAll('\\', '/'),
    bytes: buffer.length,
    sha256: sha256File(absolutePath),
    dimensions,
  };
}

function countStoryMarkdownFiles() {
  return walkFiles(path.join(repoRoot, 'src', 'game', 'data', 'story_outline'), (filePath) => filePath.endsWith('.md')).length;
}

function countProjectSkillDirs() {
  const skillRoot = path.join(repoRoot, '.agents', 'skills', 'liluo-project');
  return fs.readdirSync(skillRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
}

function loadRagCards() {
  const cardsDir = path.join(repoRoot, 'external-knowledge', 'cards');
  if (!fs.existsSync(cardsDir)) {
    return [];
  }

  const cards = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (entry.name.endsWith('.json')) {
        cards.push(JSON.parse(fs.readFileSync(absolute, 'utf8')));
      }
    }
  };

  visit(cardsDir);
  return cards;
}

function countPlotGroups() {
  const catalog = readJson(path.join('src', 'game', 'data', 'plot_outline', 'catalog.json'));
  return Array.isArray(catalog.groups) ? catalog.groups.length : 0;
}

function loadMarkdownByKey() {
  const root = path.join(repoRoot, 'src', 'game', 'data', 'story_outline');
  const result = new Map();
  for (const file of walkFiles(root, (filePath) => filePath.endsWith('.md'))) {
    const text = fs.readFileSync(file, 'utf8');
    const frontmatter = parseMarkdownFrontmatter(text);
    if (frontmatter?.key) {
      result.set(frontmatter.key, {
        ...frontmatter,
        path: path.relative(repoRoot, file).replaceAll('\\', '/'),
      });
    }
  }
  return result;
}

function catalogRuntime() {
  const mapsRoot = path.join(repoRoot, 'src', 'game', 'data', 'maps');
  const maps = new Set();
  const events = new Set();
  const dialogues = new Set();

  for (const file of walkFiles(mapsRoot)) {
    if (file.endsWith(`${path.sep}meta.ts`)) {
      const meta = fs.readFileSync(file, 'utf8');
      const id = meta.match(/\bid:\s*['"]([^'"]+)['"]/u)?.[1];
      if (id) {
        maps.add(id);
      }
    }

    if (!file.endsWith('.json') || (!file.endsWith('events.json') && !file.endsWith('dialogues.json'))) {
      continue;
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const target = file.endsWith('events.json') ? events : dialogues;
    const visit = (value) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== 'object') {
        return;
      }
      if (typeof value.id === 'string') {
        target.add(value.id);
      }
      Object.values(value).forEach(visit);
    };
    visit(data);
  }

  return { maps, events, dialogues };
}

function projectCoverage() {
  const markdown = loadMarkdownByKey();
  const runtime = catalogRuntime();
  const sourcesDir = path.join(repoRoot, 'src', 'game', 'data', 'story_outline', 'sources');
  const sourceFiles = fs.readdirSync(sourcesDir).filter((name) => name.endsWith('.json')).sort();
  const worlds = sourceFiles.map((name) => {
    const source = JSON.parse(fs.readFileSync(path.join(sourcesDir, name), 'utf8'));
    const byParent = new Map();

    for (const node of source.nodes ?? []) {
      const parent = node.parentKey ?? '__root__';
      if (!byParent.has(parent)) {
        byParent.set(parent, []);
      }
      byParent.get(parent).push(node);
    }

    const rootKey = source.rootKeys?.[0];
    const rootNode = (source.nodes ?? []).find((node) => node.key === rootKey);
    const seriesRoots = byParent.get(rootKey) ?? (rootNode ? [rootNode] : []);

    const collect = (start) => {
      const out = [];
      const queue = [start];
      while (queue.length) {
        const item = queue.shift();
        if (!item) {
          continue;
        }
        out.push(item);
        queue.push(...(byParent.get(item.key) ?? []));
      }
      return out;
    };

    const series = seriesRoots.filter(Boolean).map((seriesRoot) => {
      const nodes = collect(seriesRoot);
      const markdownEntries = nodes.map((node) => markdown.get(node.key)).filter(Boolean);
      const mapRefs = markdownEntries
        .flatMap((item) => (Array.isArray(item.mapRefs) ? item.mapRefs : item.mapRefs ? [item.mapRefs] : []))
        .filter((id) => runtime.maps.has(id));
      const eventRefs = markdownEntries
        .flatMap((item) => (Array.isArray(item.eventRefs) ? item.eventRefs : item.eventRefs ? [item.eventRefs] : []))
        .filter((id) => runtime.events.has(id));
      const dialogueRefs = markdownEntries
        .flatMap((item) => (Array.isArray(item.dialogueRefs) ? item.dialogueRefs : item.dialogueRefs ? [item.dialogueRefs] : []))
        .filter((id) => runtime.dialogues.has(id));
      const production = markdownEntries
        .filter((item) => item.detailLabel === '制作设计' || item.entryConditions || item.completionConditions || item.stateChanges)
        .map((item) => item.path);

      return {
        id: seriesRoot.key,
        title: seriesRoot.title,
        evidence: {
          concept: nodes.map((node) => node.key),
          outline: markdownEntries.map((item) => item.path),
          productionDesign: production,
          skeleton: [...mapRefs, ...eventRefs, ...dialogueRefs],
          graybox: [],
          partiallyPlayable: [],
          playable: [],
          validated: [],
        },
      };
    });

    return {
      id: path.basename(name, '.json'),
      title: rootNode?.title ?? path.basename(name, '.json'),
      series,
    };
  });

  return deriveCoverage({ worlds });
}

function projectOutlineGraph() {
  const auditRegistry = readJson(path.join('docs', '知识检索校准', 'registry.json'));
  const cardRules = readJson(path.join('external-knowledge', 'card-rules.json')) ?? { terms: [], plotPatterns: [] };
  const evidenceExcerpts = readJson(path.join('external-knowledge', 'evidence', 'excerpts.json'))?.excerpts ?? [];
  const evidenceReviews = readJson(path.join('external-knowledge', 'evidence', 'reviews.json'))?.reviews ?? [];
  const sourceCatalog = readJson(path.join('external-knowledge', 'catalog', 'sources.json')) ?? [];

  return buildOutlineRelationGraph({
    storySource: storyOutlineSource,
    plotCatalog: plotOutline,
    gameplayCatalog: gameplayOutline,
    characterOutline: storyCharacterOutline,
    ragCards: loadRagCards(),
    cardRules,
    evidenceExcerpts,
    evidenceReviews,
    sourceCatalog,
    concepts: SEEDED_CONCEPTS,
    auditRegistry,
    builtAt: new Date().toISOString(),
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderMetricCard({ x, y, width, title, value, detail, fill }) {
  return `
    <g transform="translate(${x} ${y})">
      <rect width="${width}" height="176" rx="28" fill="${fill}" />
      <text x="32" y="54" font-size="24" font-weight="700" fill="#fff">${escapeXml(title)}</text>
      <text x="32" y="112" font-size="56" font-weight="800" fill="#fff">${escapeXml(value)}</text>
      <text x="32" y="148" font-size="20" fill="rgba(255,255,255,0.84)">${escapeXml(detail)}</text>
    </g>
  `;
}

function buildDashboardSvg(stats) {
  const byType = stats.outlineGraph.byType;
  const coverageSummary = stats.coverageSummary.map((item) => `${worldPublicTitles[item.id]}: ${item.seriesTitle} / ${item.stageLabel}`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="980" viewBox="0 0 1600 980" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="80" y1="60" x2="1520" y2="920" gradientUnits="userSpaceOnUse">
      <stop stop-color="#221B36" />
      <stop offset="0.45" stop-color="#19324F" />
      <stop offset="1" stop-color="#0F1828" />
    </linearGradient>
    <linearGradient id="cardA" x1="0" y1="0" x2="400" y2="176" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D05B64" />
      <stop offset="1" stop-color="#8C2F43" />
    </linearGradient>
    <linearGradient id="cardB" x1="0" y1="0" x2="400" y2="176" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4E8BCF" />
      <stop offset="1" stop-color="#27568F" />
    </linearGradient>
    <linearGradient id="cardC" x1="0" y1="0" x2="400" y2="176" gradientUnits="userSpaceOnUse">
      <stop stop-color="#5F9A7C" />
      <stop offset="1" stop-color="#2D5F48" />
    </linearGradient>
  </defs>
  <rect width="1600" height="980" fill="url(#bg)" />
  <text x="88" y="112" font-size="56" font-weight="800" fill="#F8F4FF">璃落宇宙公开规模快照</text>
  <text x="88" y="156" font-size="24" fill="rgba(248,244,255,0.78)">生成于 ${escapeXml(stats.generatedAt)}，所有数字均来自仓库脚本或文件系统扫描。</text>
  ${renderMetricCard({
    x: 88,
    y: 208,
    width: 440,
    title: '公开世界',
    value: `${stats.counts.publicWorldCount}`,
    detail: '当前公开结构固定为六大世界。',
    fill: 'url(#cardA)',
  })}
  ${renderMetricCard({
    x: 580,
    y: 208,
    width: 440,
    title: '大纲关系图节点',
    value: `${stats.outlineGraph.nodeCount}`,
    detail: `其中故事 ${byType.story} / 角色 ${byType.character} / 玩法 ${byType.gameplay}`,
    fill: 'url(#cardB)',
  })}
  ${renderMetricCard({
    x: 1072,
    y: 208,
    width: 440,
    title: '关系边',
    value: `${stats.outlineGraph.edgeCount}`,
    detail: `包含 located_at、contains、parent 等 ${Object.keys(stats.outlineGraph.byRelation).length} 类关系`,
    fill: 'url(#cardC)',
  })}
  ${renderMetricCard({
    x: 88,
    y: 430,
    width: 440,
    title: '可运行地图包',
    value: `${stats.counts.mapPackageCount}`,
    detail: '按 map.json 计数，已接入当前 Phaser 运行时。',
    fill: 'url(#cardB)',
  })}
  ${renderMetricCard({
    x: 580,
    y: 430,
    width: 440,
    title: '互动小说副本',
    value: `${stats.counts.interactiveFictionScenarioCount}`,
    detail: '当前仓库内可确认到 1 个正式 scenario.json 副本。',
    fill: 'url(#cardC)',
  })}
  ${renderMetricCard({
    x: 1072,
    y: 430,
    width: 440,
    title: 'Schema 文件',
    value: `${stats.counts.schemaCount}`,
    detail: `系统说明 ${stats.counts.systemDocCount} 篇 / 项目 Skill ${stats.counts.projectSkillCount} 个`,
    fill: 'url(#cardA)',
  })}
  <rect x="88" y="652" width="1424" height="248" rx="30" fill="rgba(255,255,255,0.08)" />
  <text x="124" y="714" font-size="30" font-weight="700" fill="#F8F4FF">六大世界当前制作阶段</text>
  <text x="124" y="752" font-size="20" fill="rgba(248,244,255,0.78)">以下阶段来自 npm run production:coverage，反映的是当前有证据的最高阶段。</text>
  ${coverageSummary
    .map(
      (line, index) => `
  <text x="${index < 3 ? 124 : 828}" y="${index < 3 ? 812 + index * 34 : 812 + (index - 3) * 34}" font-size="24" fill="#FFFFFF">${escapeXml(line)}</text>`,
    )
    .join('')}
</svg>
`;
}

function buildPipelineSvg() {
  const stages = [
    {
      title: '世界与情节来源',
      body: '世界来源 JSON、故事大纲、情节库、角色与关系约束',
      x: 72,
      color: '#A4435C',
    },
    {
      title: '正式生产设计',
      body: '把同一故事拆成可执行章节、事件、地图、互动小说和资料页',
      x: 420,
      color: '#3C6B9D',
    },
    {
      title: '可玩运行层',
      body: 'Phaser 地图探索、菜单、图谱、对话、存档、副本入口',
      x: 768,
      color: '#4A7C63',
    },
    {
      title: '验证与回流',
      body: '浏览器回归、路线验证、产能统计、证据页与 README 公示',
      x: 1116,
      color: '#8A5C33',
    },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="540" viewBox="0 0 1600 540" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="540" rx="36" fill="#F6F0EB" />
  <text x="72" y="92" font-size="42" font-weight="800" fill="#2F2434">同一故事如何进入多种正式形态</text>
  <text x="72" y="130" font-size="22" fill="#5A4D5F">这张图是程序生成的说明图，不冒充游戏截图，也不依赖图片模型绘制中文。</text>
  ${stages
    .map(
      (stage, index) => `
  <g transform="translate(${stage.x} 208)">
    <rect width="280" height="212" rx="26" fill="${stage.color}" />
    <text x="26" y="54" font-size="28" font-weight="800" fill="#FFFFFF">${escapeXml(stage.title)}</text>
    <foreignObject x="24" y="82" width="232" height="110">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:19px;line-height:1.55;color:rgba(255,255,255,0.9);font-family:'Microsoft YaHei UI','PingFang SC',sans-serif;">
        ${escapeXml(stage.body)}
      </div>
    </foreignObject>
    <text x="26" y="194" font-size="16" fill="rgba(255,255,255,0.74)">阶段 ${index + 1}</text>
  </g>`,
    )
    .join('')}
  <path d="M362 314H402" stroke="#7A687B" stroke-width="8" stroke-linecap="round" />
  <path d="M710 314H750" stroke="#7A687B" stroke-width="8" stroke-linecap="round" />
  <path d="M1058 314H1098" stroke="#7A687B" stroke-width="8" stroke-linecap="round" />
  <path d="M390 298L410 314L390 330" stroke="#7A687B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M738 298L758 314L738 330" stroke="#7A687B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M1086 298L1106 314L1086 330" stroke="#7A687B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;
}

function buildEvidenceSvg() {
  const columns = [
    {
      x: 72,
      title: '真实可玩证据',
      body: '只放真实运行截图、构建验证、代码中可确认的当前功能。',
      fill: '#DCEEE4',
      text: '#254C39',
    },
    {
      x: 548,
      title: 'AI 概念视觉',
      body: '只负责表达宇宙气质、角色气质和世界氛围，不冒充可玩程度。',
      fill: '#F6E3E3',
      text: '#6F2F43',
    },
    {
      x: 1024,
      title: '自动统计与清单',
      body: '由脚本回算地图、节点、Schema、Skill、截图清单和素材元数据。',
      fill: '#E2EAF7',
      text: '#24456E',
    },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="420" viewBox="0 0 1600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="420" rx="32" fill="#FBF8F4" />
  <text x="72" y="82" font-size="40" font-weight="800" fill="#2E2631">README 证据边界</text>
  <text x="72" y="118" font-size="20" fill="#625667">所有公开信息分三条通道展示，防止把概念图、文件数量和真实可玩程度混在一起。</text>
  ${columns
    .map(
      (column) => `
  <g transform="translate(${column.x} 170)">
    <rect width="404" height="184" rx="28" fill="${column.fill}" />
    <text x="28" y="58" font-size="28" font-weight="800" fill="${column.text}">${escapeXml(column.title)}</text>
    <foreignObject x="28" y="84" width="348" height="74">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:20px;line-height:1.6;color:${column.text};font-family:'Microsoft YaHei UI','PingFang SC',sans-serif;">
        ${escapeXml(column.body)}
      </div>
    </foreignObject>
  </g>`,
    )
    .join('')}
</svg>
`;
}

function main() {
  ensureDir(generatedDir);
  ensureDir(screenshotDir);

  const coverage = projectCoverage();
  const graph = projectOutlineGraph();
  const outlineGraph = {
    builtAt: graph.builtAt,
    nodeCount: graph.stats.nodeCount,
    edgeCount: graph.stats.edgeCount,
    orphanCount: graph.stats.orphanCount,
    pendingReviewCount: graph.stats.pendingReviewCount,
    lowConfidenceEdgeCount: graph.stats.lowConfidenceEdgeCount,
    missingSourceCount: graph.stats.missingSourceCount,
    contentGapCount: graph.stats.contentGapCount,
    conceptWithoutRag: graph.stats.conceptWithoutRag,
    conceptCategoryCount: graph.stats.conceptCategoryCount,
    conceptDetailCount: graph.stats.conceptDetailCount,
    evidenceNodeCount: graph.stats.evidenceNodeCount,
    sourceNodeCount: graph.stats.sourceNodeCount,
    ragStubCount: graph.stats.ragStubCount,
    ragMissingEvidenceCount: graph.stats.ragMissingEvidenceCount,
    pendingEvidenceCount: graph.stats.pendingEvidenceCount,
    confirmedEvidenceCount: graph.stats.confirmedEvidenceCount,
    byType: graph.stats.byType,
    byRelation: graph.stats.byRelation,
  };
  const mapPackageCount = walkFiles(path.join(repoRoot, 'src', 'game', 'data', 'maps'), (filePath) => path.basename(filePath) === 'map.json').length;
  const interactiveFictionScenarioCount = walkFiles(
    path.join(repoRoot, 'src', 'game', 'data', 'interactive_fictions'),
    (filePath) => path.basename(filePath) === 'scenario.json',
  ).length;
  const schemaCount = walkFiles(path.join(repoRoot, 'schemas'), () => true).length;
  const systemDocCount = walkFiles(path.join(repoRoot, 'docs', '系统说明'), (filePath) => filePath.endsWith('.md')).length;
  const projectSkillCount = countProjectSkillDirs();
  const storyMarkdownCount = countStoryMarkdownFiles();
  const plotGroupCount = countPlotGroups();
  const promptRecordCount = walkFiles(path.join(readmeAssetDir, 'prompts'), (filePath) => /\.(md|txt)$/i.test(filePath)).length;
  const readmeAssetFiles = walkFiles(readmeAssetDir, (filePath) => /\.(png|svg|json|md)$/i.test(filePath));
  const readmeVisuals = analyzeReadmeVisuals();

  const coverageSummary = worldOrder.map((worldId) => {
    const world = coverage.worlds.find((item) => item.id === worldId);
    const series = world?.series?.[0];
    return {
      id: worldId,
      publicTitle: worldPublicTitles[worldId],
      worldTitle: world?.title ?? worldPublicTitles[worldId],
      seriesTitle: series?.title ?? '待补充',
      stage: series?.stage ?? 'unknown',
      stageLabel: series?.stage ?? 'unknown',
      gaps: series?.gaps ?? [],
    };
  });

  const assetMetadata = readmeAssetFiles
    .filter((filePath) => /\.(png|svg)$/i.test(filePath))
    .map(getAssetMetadata)
    .sort((left, right) => left.path.localeCompare(right.path, 'zh-Hans-CN'));

  const stats = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    buildEvidence: {
      command: 'npm run build:web',
      verified: true,
      verifiedAt: '2026-07-31',
      note: '本轮 README 升级前已在当前仓库成功完成一次 Web 构建。',
    },
    counts: {
      publicWorldCount: worldOrder.length,
      mapPackageCount,
      interactiveFictionScenarioCount,
      storyMarkdownCount,
      plotGroupCount,
      schemaCount,
      systemDocCount,
      projectSkillCount,
      promptRecordCount,
      readmeAssetCount: readmeAssetFiles.length,
      readmeVisualUnitCount: readmeVisuals.visualUnitCount,
      readmeMarkdownImageCount: readmeVisuals.markdownImageCount,
      readmeHtmlImageCount: readmeVisuals.htmlImageCount,
      verifiedScreenshotCount: existingScreenshots.length,
      pendingScreenshotRequestCount: requestedScreenshots.length,
    },
    readmeVisualSummary: {
      visualUnitCount: readmeVisuals.visualUnitCount,
      markdownImageCount: readmeVisuals.markdownImageCount,
      htmlImageCount: readmeVisuals.htmlImageCount,
      targetRange: [readmeVisuals.targetMin, readmeVisuals.targetMax],
      inTargetRange:
        readmeVisuals.visualUnitCount >= readmeVisuals.targetMin &&
        readmeVisuals.visualUnitCount <= readmeVisuals.targetMax,
    },
    outlineGraph,
    coverageSummary,
    runtimeEvidence: {
      existingScreenshots,
      requestedScreenshots,
    },
    assetMetadata,
  };

  writeJson(path.join(generatedDir, 'project-stats.json'), stats);
  writeJson(path.join(generatedDir, 'screenshot-inventory.json'), {
    generatedAt: stats.generatedAt,
    existingScreenshots,
    requestedScreenshots,
  });
  fs.writeFileSync(path.join(generatedDir, 'project-scale-dashboard.svg'), buildDashboardSvg(stats), 'utf8');
  fs.writeFileSync(path.join(generatedDir, 'story-production-pipeline.svg'), buildPipelineSvg(), 'utf8');
  fs.writeFileSync(path.join(generatedDir, 'readme-evidence-boundary.svg'), buildEvidenceSvg(), 'utf8');

  console.log(JSON.stringify(stats, null, 2));
}

main();
