import fs from 'node:fs';
import path from 'node:path';

const roots = [
  'src/game/data/story_outline/sources',
  'src/game/data/plot_outline/catalog.json'
];
const retiredFields = new Set([
  'tags',
  'plotTags',
  'bondageTags',
  'specialGameplay',
  'isBondagePlot'
]);

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (retiredFields.has(key) || key === 'legacyTagMigration') continue;
    if (key === 'migrationPending') {
      next.legacyTagRefs = clean(child);
      continue;
    }
    next[key] = clean(child);
  }
  return next;
}

function collectJsonFiles(target) {
  const stats = fs.statSync(target);
  if (stats.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true })
    .flatMap((entry) => collectJsonFiles(path.join(target, entry.name)))
    .filter((file) => file.endsWith('.json'));
}

let changed = 0;
for (const root of roots) {
  for (const file of collectJsonFiles(root)) {
    const before = fs.readFileSync(file, 'utf8');
    const after = `${JSON.stringify(clean(JSON.parse(before)), null, 2)}\n`;
    if (after === before) continue;
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ changed, roots }, null, 2));
