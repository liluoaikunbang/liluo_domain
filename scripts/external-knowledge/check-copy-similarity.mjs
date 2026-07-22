import fs from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_ROOT, REPO_ROOT } from './lib/config.mjs';
import { assessSimilarity } from './lib/similarity.mjs';
import { readJson, writeJson } from './lib/store.mjs';
const args = process.argv.slice(2), get = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }, inputPath = get('--input'), inline = get('--text');
if (!inputPath && !inline) throw new Error('Use --input <file> or --text <text>.');
const generated = inputPath ? await fs.readFile(path.resolve(inputPath), 'utf8') : inline, sources = await readJson(path.join(KNOWLEDGE_ROOT, 'catalog', 'sources.json'), []), segments = [];
const textCache = new Map();
for (const name of await fs.readdir(path.join(KNOWLEDGE_ROOT, 'index', 'segments'))) for (const segment of await readJson(path.join(KNOWLEDGE_ROOT, 'index', 'segments', name), [])) { if (!textCache.has(segment.sourceId)) textCache.set(segment.sourceId, (await fs.readFile(path.join(REPO_ROOT, segment.sourcePath), 'utf8')).split(/\r?\n/)); segments.push({ ...segment, text: textCache.get(segment.sourceId).slice(segment.startLine - 1, segment.endLine).join('\n') }); }
const result = assessSimilarity(generated, segments), reportPath = path.join(KNOWLEDGE_ROOT, 'reports', 'direct-copy-risk.json'), previous = await readJson(reportPath, { checks: [] });
const check = { checkedAt: new Date().toISOString(), input: inputPath ? path.relative(REPO_ROOT, path.resolve(inputPath)).replaceAll('\\', '/') : 'inline-text', ...result };
await writeJson(reportPath, { note: 'Conservative writing-similarity warnings; not legal copyright determinations. Source prose is not copied into this report.', checks: [...(previous.checks ?? []), check].slice(-50) }); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.risk === 'high' ? 2 : 0;
