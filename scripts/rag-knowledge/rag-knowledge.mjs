#!/usr/bin/env node
/** Conservative RAG proposal and source-association workbench. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchQuery } from '../external-knowledge/lib/query.mjs';
import { ensureProfessionalShape, normalizeRagDomain } from '../external-knowledge/lib/professional-rag.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const registryPath = path.join(root, 'external-knowledge/rag-governance/registry.json');
const cardsDir = path.join(root, 'external-knowledge/cards');
const sourcesPath = path.join(root, 'external-knowledge/catalog/sources.json');
const segmentsDir = path.join(root, 'external-knowledge/index/segments');
const storyDir = path.join(root, 'src/game/data/story_outline/sources');
const list = (value) => Array.isArray(value) ? value : [];
const stamp = (prefix) => `${prefix}-${Date.now().toString(36)}`;

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2), next = argv[i + 1];
    flags[key] = !next || next.startsWith('--') ? true : next;
    if (flags[key] === next) i += 1;
  }
  return flags;
}
async function readJson(file, fallback) { try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; } }
async function writeJson(file, value) { await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
async function walkJson(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walkJson(file));
    else if (entry.name.endsWith('.json')) result.push({ file, value: await readJson(file, null) });
  }
  return result.filter((entry) => entry.value);
}
async function registry() { return await readJson(registryPath, { schemaVersion: 1, updatedAt: null, proposals: [], researchTodos: [], relations: [], approvalPolicies: [] }); }
async function save(doc) { doc.updatedAt = new Date().toISOString(); await writeJson(registryPath, doc); }
function findCard(cards, id) {
  const needle = String(id || '').trim().toLocaleLowerCase('zh-CN');
  return cards.find(({ value }) => {
    const card = ensureProfessionalShape(value);
    return [card.cardId, card.id, card.title, ...list(card.aliases), ...list(card.knowledge?.aliases)]
      .filter(Boolean).some((item) => String(item).toLocaleLowerCase('zh-CN') === needle);
  });
}

async function propose(flags) {
  if (!flags.input) throw new Error('Usage: propose --input <proposal.json> [--dry-run]');
  const input = await readJson(path.resolve(root, String(flags.input)), null);
  if (!input?.title) throw new Error('Proposal input requires title.');
  const proposal = {
    id: stamp('srp'), kind: 'story-rag-proposal', status: 'pending', createdAt: new Date().toISOString(),
    source: input.source || { kind: 'manual' },
    candidate: {
      title: String(input.title).trim(), ragDomain: normalizeRagDomain(input.ragDomain), scope: String(input.scope || ''),
      excludes: list(input.excludes), storyEvidence: list(input.storyEvidence), futureQuestions: list(input.futureQuestions),
      suggestedParentCardId: input.suggestedParentCardId || '', similarCardIds: list(input.similarCardIds),
      knowledge: { status: 'stub', reviewStatus: 'pending', ...(input.knowledge || {}) },
      expression: { status: 'stub', reviewStatus: 'pending', ...(input.expression || {}) }
    }, decision: null
  };
  const doc = await registry();
  const duplicate = doc.proposals.find((item) => item.status === 'pending' && item.candidate?.title === proposal.candidate.title && item.candidate?.ragDomain === proposal.candidate.ragDomain);
  if (!flags['dry-run'] && !duplicate) { doc.proposals.push(proposal); await save(doc); }
  console.log(JSON.stringify({ dryRun: Boolean(flags['dry-run']), proposal, duplicateId: duplicate?.id || null }, null, 2));
}

async function rescanStories(flags) {
  const scope = String(flags.scope || ''); const nodes = [];
  for (const name of (await fs.readdir(storyDir)).filter((item) => item.endsWith('.json')).sort()) {
    for (const node of list((await readJson(path.join(storyDir, name), { nodes: [] })).nodes)) {
      if (scope && !`${node.key} ${node.title} ${node.world}`.includes(scope)) continue;
      nodes.push({ key: node.key, title: node.title, world: node.world, ragRefs: list(node.ragRefs), status: node.status || '' });
    }
  }
  console.log(JSON.stringify({ dryRun: true, kind: 'story-rag-rescan-request', scope: scope || 'all-story-nodes', nodeCount: nodes.length, nodes, nextAction: 'Use the RAG candidate proposal Skill to create pending proposals; this command never infers or confirms terms.' }, null, 2));
}

async function sourceScan(flags) {
  if (!flags.card) throw new Error('Usage: source-scan --card <card-id> [--limit 12] [--source-domain restraint|general] [--commit-pending]');
  const found = findCard(await walkJson(cardsDir), flags.card);
  if (!found) throw new Error(`Unknown RAG card: ${flags.card}`);
  const card = ensureProfessionalShape(found.value);
  const sources = await readJson(sourcesPath, []), sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  const domain = String(flags['source-domain'] || (card.ragDomain === 'restraint-professional' ? 'restraint' : 'general'));
  const query = [card.title, ...list(card.aliases), ...list(card.knowledge?.aliases)].filter(Boolean).join(' ');
  const segments = [];
  for (const name of await fs.readdir(segmentsDir)) segments.push(...await readJson(path.join(segmentsDir, name), []));
  const results = segments.filter((segment) => {
    const relativePath = String(sourceById.get(segment.sourceId)?.relativePath || '');
    return domain === 'restraint' ? relativePath.includes('fiction-bondage') : domain === 'general' ? relativePath.includes('zhihu-novels') : true;
  }).map((segment) => ({ segment, match: matchQuery({ ...segment, title: sourceById.get(segment.sourceId)?.title, searchableText: `${segment.headingPath?.join(' ') || ''} ${segment.preview || ''}` }, { query, mode: 'or', retrievalMode: 'calibration' }) }))
    .filter(({ match }) => match.matched).sort((a, b) => b.match.score - a.match.score).slice(0, Math.max(1, Math.min(50, Number(flags.limit || 12))))
    .map(({ segment, match }) => ({ sourceId: segment.sourceId, sourceTitle: sourceById.get(segment.sourceId)?.title || segment.sourceId, segmentId: segment.segmentId, startLine: segment.startLine, endLine: segment.endLine, preview: segment.preview || '', matchScore: match.score, status: 'pending' }));
  const scan = { id: stamp('rss'), kind: 'source-association-scan', status: 'pending', createdAt: new Date().toISOString(), cardId: card.cardId, ragDomain: card.ragDomain, sourceDomain: domain, query, results };
  if (flags['commit-pending']) { const doc = await registry(); doc.relations.push(scan); await save(doc); }
  console.log(JSON.stringify({ dryRun: !flags['commit-pending'], scan }, null, 2));
}

async function allSegments() {
  const entries = [];
  for (const name of (await fs.readdir(segmentsDir)).filter((item) => item.endsWith('.json')).sort()) entries.push(...await readJson(path.join(segmentsDir, name), []));
  return entries;
}

function decisionStatus(action) {
  return ({ relate: 'confirmed', none: 'no-rag-value', context: 'needs-context', resplit: 'needs-resplit', exclude: 'excluded', defer: 'deferred' })[action] || '';
}

async function sourceInterview(flags) {
  const doc = await registry(), decisions = list(doc.segmentDecisions);
  const segments = (await allSegments()).filter((segment) => !decisions.some((item) => item.segmentId === segment.segmentId && item.status !== 'deferred'));
  const current = String(flags['current-source'] || '');
  let segment = flags.segment ? segments.find((item) => item.segmentId === flags.segment) || (await allSegments()).find((item) => item.segmentId === flags.segment) : null;
  if (!segment) {
    const currentItems = segments.filter((item) => item.sourceId === current), otherItems = segments.filter((item) => item.sourceId !== current);
    const seed = Number(flags.seed || 0); const useCurrent = currentItems.length && (seed % 10) < 4;
    segment = (useCurrent ? currentItems : otherItems.length ? otherItems : currentItems)[Math.abs(seed) % (useCurrent ? currentItems.length : (otherItems.length || currentItems.length))];
  }
  if (!segment) throw new Error('No unprocessed source segment is available.');
  const sources = await readJson(sourcesPath, []), source = sources.find((item) => item.sourceId === segment.sourceId);
  const lines = String(await fs.readFile(path.join(root, segment.sourcePath || source?.relativePath), 'utf8')).split(/\r?\n/);
  const excerpt = lines.slice(Math.max(0, segment.startLine - 1), segment.endLine).join('\n');
  const cards = (await walkJson(cardsDir)).map(({ value }) => ensureProfessionalShape(value));
  const suggestions = cards.filter((card) => String(card.title || '').split(/\s+/).some((word) => word && excerpt.includes(word))).slice(0, 3).map((card) => ({ cardId: card.cardId, title: card.title }));
  console.log(JSON.stringify({ kind: 'rag-source-interview', status: 'pending-user-decision', randomPolicy: current ? { currentSource: current, currentProbability: 0.4, otherProbability: 0.6 } : { balanced: true }, segment: { ...segment, sourceTitle: source?.title || segment.sourceId, excerpt }, suggestions, actions: ['relate', 'new-rag', 'none', 'context', 'resplit', 'exclude', 'defer'] }, null, 2));
}

async function decideSegment(flags) {
  const action = String(flags.action || '');
  if (!decisionStatus(action)) throw new Error('Usage: decide-segment --segment <id> --action relate|none|context|resplit|exclude|defer [--card <id>]');
  const segment = (await allSegments()).find((item) => item.segmentId === flags.segment);
  if (!segment) throw new Error(`Unknown source segment: ${flags.segment}`);
  if (action === 'relate' && !flags.card) throw new Error('A confirmed relation requires --card <card-id>.');
  const doc = await registry(); doc.segmentDecisions = list(doc.segmentDecisions);
  const decision = { id: stamp('rsd'), segmentId: segment.segmentId, sourceId: segment.sourceId, startLine: segment.startLine, endLine: segment.endLine, status: decisionStatus(action), cardId: flags.card || null, purpose: String(flags.purpose || 'both'), decidedAt: new Date().toISOString(), decidedBy: 'user' };
  doc.segmentDecisions.push(decision); await save(doc); console.log(JSON.stringify({ ok: true, decision }, null, 2));
}

async function createRag(flags) {
  if (!flags.segment || !flags.title) throw new Error('Usage: create-rag --segment <id> --title <title> [--parent <card-id>] [--purpose both]');
  const segment = (await allSegments()).find((item) => item.segmentId === flags.segment);
  if (!segment) throw new Error(`Unknown source segment: ${flags.segment}`);
  const title = String(flags.title).trim(), slug = title.toLocaleLowerCase('zh-CN').replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_.-]/gu, '').slice(0, 72);
  if (!slug) throw new Error('RAG title must contain letters or numbers.');
  const cardId = `rag.restraint.${slug}`, cardFile = path.join(cardsDir, 'restraint', `${cardId}.json`);
  if (await readJson(cardFile, null)) throw new Error(`Card already exists: ${cardId}`);
  const purpose = String(flags.purpose || 'both');
  const card = ensureProfessionalShape({ cardId, title, ragDomain: 'restraint-professional', cardType: 'term', ragLayer: flags.parent ? 'concept' : 'category', parentCardIds: flags.parent ? [String(flags.parent)] : [], knowledgeScope: 'external-fiction-reference', canonical: false, contentStatus: 'draft', evidenceStatus: 'partial', reviewStatus: 'confirmed', sourceRefs: [{ sourceId: segment.sourceId, segmentId: segment.segmentId, startLine: segment.startLine, endLine: segment.endLine }], knowledge: { definition: '', boundaries: { includes: [title], excludes: [] }, distinctions: [], aliases: [], parentConceptRefs: flags.parent ? [String(flags.parent)] : [], childConceptRefs: [], relatedConceptRefs: [], factualClaims: [], evidenceRefs: [], projectInterpretation: '', commonMisreadings: [], status: 'usable', evidenceStatus: 'partial', reviewStatus: 'confirmed' }, expression: { visualFocus: [], actionLogic: [], movementEffects: [], postureEffects: [], sensoryFocus: [], emotionalPossibilities: [], narrativeUses: [], applicableScenes: [], unsuitableScenes: [], expressionPrinciples: [], commonFailures: [], prohibitedMisreadings: [], styleEvidenceRefs: [], goldExampleRefs: [], calibrationPairRefs: [], relatedStyleRagRefs: [], evidenceRefs: [], status: purpose === 'knowledge-evidence' ? 'stub' : 'usable', evidenceStatus: 'partial', reviewStatus: 'confirmed' }, retrievalPolicy: { searchable: true, graphVisible: true, relationAnchor: true, contentRetrievable: true, knowledgeRetrievable: true, expressionRetrievable: purpose !== 'knowledge-evidence', evidenceRetrievable: true }, createdAt: new Date().toISOString(), origin: 'user-confirmed-source-interview' });
  await fs.mkdir(path.dirname(cardFile), { recursive: true }); await writeJson(cardFile, card);
  const doc = await registry(); doc.segmentDecisions = list(doc.segmentDecisions); doc.segmentDecisions.push({ id: stamp('rsd'), segmentId: segment.segmentId, sourceId: segment.sourceId, startLine: segment.startLine, endLine: segment.endLine, status: 'confirmed', cardId, purpose, decidedAt: new Date().toISOString(), decidedBy: 'user' }); await save(doc);
  console.log(JSON.stringify({ ok: true, cardId, cardFile: path.relative(root, cardFile) }, null, 2));
}

async function resetBaseline(flags) {
  const archivedIds = new Set(list((await registry()).baselineResets).map((item) => item.cardId));
  const cards = await walkJson(cardsDir); const retired = cards.flatMap(({ value }) => list(value.sourceRefs).length || list(value.evidenceRefs).length || list(value.evidenceBindings).length || (flags.repair && archivedIds.has(value.cardId) && value.contentStatus !== 'stub') ? [{ cardId: value.cardId, sourceRefs: list(value.sourceRefs).length, evidenceRefs: list(value.evidenceRefs).length, evidenceBindings: list(value.evidenceBindings).length }] : []);
  const pack = { id: stamp('rbr'), kind: 'human-baseline-reset', status: 'awaiting-user-approval', createdAt: new Date().toISOString(), retired, note: 'Dry-run only. No raw source, card, evidence, or relation was modified.' };
  if (flags.commit) {
    const doc = await registry(); doc.baselineResets = list(doc.baselineResets);
    for (const entry of cards) {
      if (!retired.some((item) => item.cardId === entry.value.cardId)) continue;
      doc.baselineResets.push({ resetId: pack.id, cardId: entry.value.cardId, sourceRefs: list(entry.value.sourceRefs), evidenceRefs: list(entry.value.evidenceRefs), evidenceBindings: list(entry.value.evidenceBindings), retiredAt: new Date().toISOString() });
      const cleared = { ...entry.value, sourceRefs: [], evidenceRefs: [], evidenceBindings: [], contentStatus: 'stub', evidenceStatus: 'missing', reviewStatus: 'pending', overallStatus: 'stub', knowledge: { ...(entry.value.knowledge || {}), factualClaims: [], evidenceRefs: [], status: 'stub', evidenceStatus: 'missing', reviewStatus: 'pending' }, expression: { ...(entry.value.expression || {}), evidenceRefs: [], styleEvidenceRefs: [], status: 'stub', evidenceStatus: 'missing', reviewStatus: 'pending' }, retrievalPolicy: { ...(entry.value.retrievalPolicy || {}), contentRetrievable: false, knowledgeRetrievable: false, expressionRetrievable: false, evidenceRetrievable: false } };
      await writeJson(entry.file, cleared);
    }
    pack.status = 'committed'; pack.note = 'Legacy source relations were archived in rag-governance before being removed from cards.'; await save(doc);
  }
  console.log(JSON.stringify({ dryRun: !flags.commit, pack }, null, 2));
}

async function reviewProposal(flags) {
  if (!flags.proposal || !['confirm', 'reject', 'defer'].includes(String(flags.action))) throw new Error('Usage: review-proposal --proposal <id> --action confirm|reject|defer');
  const doc = await registry(), item = doc.proposals.find((proposal) => proposal.id === flags.proposal);
  if (!item) throw new Error(`Unknown proposal: ${flags.proposal}`);
  item.status = flags.action === 'confirm' ? 'confirmed' : flags.action === 'reject' ? 'rejected' : 'deferred';
  item.decision = { action: flags.action, decidedAt: new Date().toISOString(), note: String(flags.note || '') };
  if (flags.action === 'confirm' && flags.materialize) {
    const candidate = item.candidate;
    const domainFolder = candidate.ragDomain === 'general-craft' ? 'general' : candidate.ragDomain === 'canon' ? 'canon' : 'restraint';
    const slug = String(candidate.title).trim().toLocaleLowerCase('zh-CN').replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_.-]/gu, '').slice(0, 72) || 'unnamed';
    const cardId = `rag.${domainFolder}.${slug}`;
    const cardFile = path.join(cardsDir, domainFolder, `${cardId}.json`);
    const existing = await readJson(cardFile, null);
    if (existing) throw new Error(`Card already exists: ${cardId}`);
    const card = {
      cardId, title: candidate.title, ragDomain: candidate.ragDomain, cardType: 'term',
      ragLayer: candidate.suggestedParentCardId ? 'concept' : 'category',
      parentCardIds: candidate.suggestedParentCardId ? [candidate.suggestedParentCardId] : [],
      knowledgeScope: candidate.ragDomain === 'canon' ? 'canonical-project-reference' : 'external-fiction-reference',
      canonical: candidate.ragDomain === 'canon', contentStatus: 'stub', evidenceStatus: 'missing', reviewStatus: 'pending',
      proposalStatus: 'confirmed', origin: 'story-auto', sourcePolicy: candidate.ragDomain === 'canon' ? 'project-authority-only' : 'manual-source-scan-only',
      knowledge: { definition: '', boundaries: { includes: [], excludes: list(candidate.excludes) }, distinctions: [], aliases: [], parentConceptRefs: candidate.suggestedParentCardId ? [candidate.suggestedParentCardId] : [], childConceptRefs: [], relatedConceptRefs: [], factualClaims: [], evidenceRefs: [], projectInterpretation: '', commonMisreadings: [], status: 'stub', evidenceStatus: 'missing', reviewStatus: 'pending' },
      expression: { visualFocus: [], actionLogic: [], movementEffects: [], postureEffects: [], sensoryFocus: [], emotionalPossibilities: [], narrativeUses: [], applicableScenes: [], unsuitableScenes: [], expressionPrinciples: [], commonFailures: [], prohibitedMisreadings: [], styleEvidenceRefs: [], goldExampleRefs: [], calibrationPairRefs: [], relatedStyleRagRefs: [], evidenceRefs: [], status: 'stub', evidenceStatus: 'missing', reviewStatus: 'pending' },
      missingItems: ['补全知识分支来源与正文', '补全表达分支来源与正文'], createdAt: new Date().toISOString()
    };
    await fs.mkdir(path.dirname(cardFile), { recursive: true });
    await writeJson(cardFile, card);
    item.materializedCardId = cardId;
    doc.researchTodos.push({ id: stamp('rt'), status: 'pending', cardId, ragDomain: candidate.ragDomain, sourcePolicy: card.sourcePolicy, questions: list(candidate.futureQuestions), createdAt: new Date().toISOString() });
  }
  await save(doc); console.log(JSON.stringify({ ok: true, proposal: item }, null, 2));
}

const [command = 'help', ...argv] = process.argv.slice(2), flags = parseArgs(argv);
try {
  if (command === 'propose') await propose(flags);
  else if (command === 'rescan-stories') await rescanStories(flags);
  else if (command === 'source-scan') await sourceScan(flags);
  else if (command === 'source-interview') await sourceInterview(flags);
  else if (command === 'decide-segment') await decideSegment(flags);
  else if (command === 'create-rag') await createRag(flags);
  else if (command === 'reset-human-baseline') await resetBaseline(flags);
  else if (command === 'review-proposal') await reviewProposal(flags);
  else console.log('Commands: propose | rescan-stories | source-scan | source-interview | decide-segment | create-rag | reset-human-baseline | review-proposal');
} catch (error) { console.error(`ERROR ${error.message}`); process.exitCode = 1; }
