import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { queryRecords } from './lib/query.mjs'
const args = {}; for (let i = 2; i < process.argv.length; i += 2) { const key = process.argv[i]; if (!key.startsWith('--')) { console.error(`Invalid argument: ${key}`); process.exit(2) } args[key.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = process.argv[i + 1] }
if (args.help !== undefined) { console.log('Options: --domain --type --key --query --world --parent --child-of --reverse-reference --source-path --fields --limit --format --max-chars'); process.exit(0) }
const validDomains = new Set(['story', 'gameplay', 'game', 'code', 'assets', 'docs', 'graph']); if (!args.domain || !validDomains.has(args.domain)) { console.error('A valid --domain is required.'); process.exit(2) }
const root = path.resolve(import.meta.dirname, '../../project-index', args.domain); const files = []
const visit = (dir) => { if (!fs.existsSync(dir)) return; for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) visit(full); else if (entry.name.endsWith('.json') && !['catalog.json', 'summary.json'].includes(entry.name)) files.push(full) } }; visit(root)
if (args.domain === 'story') files.push(path.join(root, 'nodes').replace(/$/, ''))
let records = []; for (const file of [...new Set(files)].filter((item) => fs.existsSync(item) && fs.statSync(item).isFile())) { const value = JSON.parse(fs.readFileSync(file, 'utf8')); if (Array.isArray(value)) records.push(...value); else if (Array.isArray(value.records)) records.push(...value.records) }
if (args.domain === 'story') records = records.filter((item) => item.type === 'story-node'); if (args.domain === 'gameplay') records = records.filter((item) => item.type === 'gameplay')
const fields = args.fields?.split(',').filter(Boolean); const limit = args.limit === undefined ? 10 : Number(args.limit); if (!Number.isInteger(limit) || limit < 1 || limit > 100) { console.error('--limit must be an integer from 1 to 100.'); process.exit(2) }
const result = queryRecords(records, { ...args, fields, limit }); if (!result.length) { console.log('No matching index records.'); process.exit(0) }
let output = args.format === 'json' ? JSON.stringify(result, null, 2) : result.map((item) => `- ${item.key ?? item.id}｜${item.title}\n  ${item.sourcePath ?? item.markdownPath ?? item.sourceJsonPath ?? ''}\n  ${item.summary ?? ''}`).join('\n')
const maxChars = Number(args.maxChars ?? 12000); if (!Number.isFinite(maxChars) || maxChars < 100) { console.error('--max-chars must be at least 100.'); process.exit(2) } console.log(output.slice(0, maxChars))
