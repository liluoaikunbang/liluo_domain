import fs from 'node:fs';
import path from 'node:path';
import { analyzeImpact, classifyPersistence, loadGovernance } from './lib/governance.mjs';

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? null : args[index + 1]; };
const root = process.cwd();
const { impactMap, ruleRegistry } = loadGovernance(root);

if (value('--text')) console.log(JSON.stringify(classifyPersistence(value('--text')), null, 2));
else if (value('--rule')) {
  const rule = ruleRegistry.rules.find((item) => item.ruleId === value('--rule'));
  if (!rule) throw new Error(`unknown rule ${value('--rule')}`);
  console.log(JSON.stringify({ ruleId: rule.ruleId, authority: rule.authority, consumers: rule.consumers }, null, 2));
} else if (value('--files')) {
  const files = value('--files').split(',').map((item) => item.trim());
  const matches = ruleRegistry.rules.filter((rule) => [rule.authority, rule.decision, ...(rule.consumers ?? [])].some((file) => files.includes(file)));
  console.log(JSON.stringify({ files, affectedRules: matches.map((rule) => rule.ruleId), indexUpdate: true }, null, 2));
} else if (args.includes('--changed')) {
  const changedFile = path.join(root, '.git', 'index');
  console.log(JSON.stringify({ mode: 'changed', note: fs.existsSync(changedFile) ? 'Use git status/diff to supply exact files with --files.' : 'Git metadata unavailable.', indexUpdate: true }, null, 2));
} else {
  const type = value('--type');
  if (!type) throw new Error('Use --type, --rule, --files, --changed, or --text.');
  console.log(JSON.stringify(analyzeImpact({ type, impactMap }), null, 2));
}
