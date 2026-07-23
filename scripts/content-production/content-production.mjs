import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownFrontmatter } from '../../src/game/data/story_outline/storyOutlineFrontmatter.js';
import { assessProvenance } from './provenance.mjs';
import { buildPlayablePlan } from './story-to-playable.mjs';
import { validateRoute, simulateRoute, resumeRoute } from './route-validation.mjs';
import { validateMemoryRecord } from './character-memory.mjs';
import { deriveCoverage } from './production-coverage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const command = args.shift();
const option = (name) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : null; };
const resolveProjectFile = (file) => {
  if (!file) throw new Error('input file is required');
  const target = path.resolve(ROOT, file);
  if (target !== ROOT && !target.startsWith(`${ROOT}${path.sep}`)) throw new Error('input file must stay inside the project root');
  return target;
};
const readJson = async (file) => JSON.parse(await fs.readFile(resolveProjectFile(file), 'utf8'));
const walk = async (dir, suffix) => {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target, suffix));
    else if (!suffix || target.endsWith(suffix)) result.push(target);
  }
  return result;
};

async function loadStoryNodes() {
  const sourceDir = path.join(ROOT, 'src/game/data/story_outline/sources');
  const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.json')).sort();
  return (await Promise.all(files.map(async (name) => ({ source: path.basename(name, '.json'), ...(await readJson(path.relative(ROOT, path.join(sourceDir, name)))) }))));
}

async function loadMarkdownByKey() {
  const root = path.join(ROOT, 'src/game/data/story_outline');
  const result = new Map();
  for (const file of await walk(root, '.md')) {
    const text = await fs.readFile(file, 'utf8');
    const frontmatter = parseMarkdownFrontmatter(text);
    const minimumSection = text.split(/^# 最小可玩版本\s*$/mu)[1]?.split(/^# /mu)[0] ?? '';
    const minimumPlayableVersion = minimumSection.split(/\r?\n/u)
      .map((line) => line.match(/^\s*\d+\.\s+(.+)$/u)?.[1]).filter(Boolean);
    if (frontmatter.key) result.set(frontmatter.key, { ...frontmatter, minimumPlayableVersion, path: path.relative(ROOT, file).replaceAll('\\', '/') });
  }
  return result;
}

async function catalogRuntime() {
  const mapsRoot = path.join(ROOT, 'src/game/data/maps');
  const maps = new Set(), events = new Set(), dialogues = new Set();
  for (const file of await walk(mapsRoot)) {
    if (file.endsWith(`${path.sep}meta.ts`)) {
      const meta = await fs.readFile(file, 'utf8');
      const id = meta.match(/\bid:\s*['"]([^'"]+)['"]/u)?.[1];
      if (id) maps.add(id);
    }
    if (!file.endsWith('.json') || (!file.endsWith('events.json') && !file.endsWith('dialogues.json'))) continue;
    const data = JSON.parse(await fs.readFile(file, 'utf8'));
    const target = file.endsWith('events.json') ? events : dialogues;
    const visit = (value) => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      if (typeof value.id === 'string') target.add(value.id);
      Object.values(value).forEach(visit);
    };
    visit(data);
  }
  return { maps, events, dialogues };
}

function mergeNode(node, frontmatter) {
  const merged = { ...node };
  for (const [key, value] of Object.entries(frontmatter ?? {})) if (key !== 'path') merged[key] = value;
  return merged;
}

async function projectCoverage() {
  const sources = await loadStoryNodes(), markdown = await loadMarkdownByKey(), runtime = await catalogRuntime();
  const worlds = [];
  for (const source of sources) {
    const byParent = new Map();
    for (const node of source.nodes) {
      const parent = node.parentKey ?? '__root__';
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(node);
    }
    const rootKey = source.rootKeys[0], root = source.nodes.find((node) => node.key === rootKey);
    const seriesRoots = byParent.get(rootKey) ?? [root];
    const collect = (start) => { const out = [], queue = [start]; while (queue.length) { const item = queue.shift(); if (!item) continue; out.push(item); queue.push(...(byParent.get(item.key) ?? [])); } return out; };
    const series = seriesRoots.filter(Boolean).map((seriesRoot) => {
      const nodes = collect(seriesRoot), md = nodes.map((node) => markdown.get(node.key)).filter(Boolean);
      const mapRefs = md.flatMap((item) => Array.isArray(item.mapRefs) ? item.mapRefs : item.mapRefs ? [item.mapRefs] : []).filter((id) => runtime.maps.has(id));
      const eventRefs = md.flatMap((item) => Array.isArray(item.eventRefs) ? item.eventRefs : item.eventRefs ? [item.eventRefs] : []).filter((id) => runtime.events.has(id));
      const dialogueRefs = md.flatMap((item) => Array.isArray(item.dialogueRefs) ? item.dialogueRefs : item.dialogueRefs ? [item.dialogueRefs] : []).filter((id) => runtime.dialogues.has(id));
      const production = md.filter((item) => item.detailLabel === '制作设计' || item.entryConditions || item.completionConditions || item.stateChanges).map((item) => item.path);
      return { id: seriesRoot.key, title: seriesRoot.title, evidence: {
        concept: nodes.map((node) => node.key), outline: md.map((item) => item.path), productionDesign: production,
        skeleton: [...mapRefs, ...eventRefs, ...dialogueRefs], graybox: [], partiallyPlayable: [], playable: [], validated: []
      }};
    });
    worlds.push({ id: source.source, title: root?.title ?? source.source, series });
  }
  return deriveCoverage({ worlds });
}

async function main() {
  let result;
  if (command === 'plan') {
    const storyKey = option('story-key');
    const sources = await loadStoryNodes(), markdown = await loadMarkdownByKey();
    const node = sources.flatMap((source) => source.nodes).find((item) => item.key === storyKey);
    if (!node) throw new Error(`story key not found: ${storyKey}`);
    result = buildPlayablePlan(mergeNode(node, markdown.get(storyKey)), await catalogRuntime());
  } else if (command === 'coverage') result = await projectCoverage();
  else if (command === 'provenance') result = assessProvenance(await readJson(option('input')));
  else if (command === 'route-validate') result = validateRoute(await readJson(option('input')));
  else if (command === 'route-simulate') result = simulateRoute(await readJson(option('input')));
  else if (command === 'route-resume') result = resumeRoute(await readJson(option('route')), await readJson(option('snapshot')));
  else if (command === 'memory-validate') {
    const input = await readJson(option('input'));
    if (Array.isArray(input.records)) {
      const records = input.records.map((record) => ({ id: record.id, ...validateMemoryRecord(record) }));
      result = { valid: records.every((record) => record.valid), records };
    } else result = validateMemoryRecord(input);
  }
  else throw new Error('commands: plan, coverage, provenance, route-validate, route-simulate, route-resume, memory-validate');
  console.log(JSON.stringify(result, null, 2));
  if (result.allowed === false || result.valid === false || result.completed === false) process.exitCode = 2;
}

await main();
