import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1];
};
if (args.includes('--help')) {
  console.log('Usage: node validate-game-content.mjs --scope changed|world|all [--world NAME] [--check]');
  process.exit(0);
}
const root = path.resolve(value('--root') ?? '.');
const scope = value('--scope') ?? 'all';
const world = value('--world');
if (!['changed', 'world', 'all'].includes(scope) || (scope === 'world' && !world)) {
  console.error('ERROR invalid scope or missing --world');
  process.exit(2);
}
let files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.(json|md)$/.test(target)) files.push(target);
  }
};
if (scope === 'all') walk(path.join(root, 'src/game/data'));
else if (scope === 'world') {
  const source = path.join(root, 'src/game/data/story_outline/sources', `${world}.json`);
  const directory = path.join(root, 'src/game/data/story_outline', world);
  if (fs.existsSync(source)) files.push(source);
  if (fs.existsSync(directory)) walk(directory);
} else {
  const changed = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  files = (changed.stdout ?? '').split(/\r?\n/).filter(Boolean).map((line) => path.join(root, line.slice(3))).filter((file) => fs.existsSync(file) && /\.(json|md)$/.test(file));
}
const errors = [];
for (const file of files) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('\uFFFD')) errors.push(`${file}: replacement character`);
    if (file.endsWith('.json')) JSON.parse(text);
  } catch (error) { errors.push(`${file}: ${error.message}`); }
}
const graph = path.join(root, '.agents/skills/liluo-project/liluo-story-outline-graph-maintenance/scripts/outline-graph-ops.mjs');
const result = spawnSync(process.execPath, [graph, '--root', root, '--check'], { encoding: 'utf8' });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status) errors.push('story graph validation failed');
console.log(`INFO scope=${scope} files=${files.length}`);
for (const issue of errors) console.error(`ERROR ${issue}`);
process.exit(errors.length ? 1 : 0);
