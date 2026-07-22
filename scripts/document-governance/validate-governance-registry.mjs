import { loadGovernance, printReport, validateRegistries } from './lib/governance.mjs';
const root = process.cwd();
const registries = loadGovernance(root);
const result = validateRegistries({ root, ...registries });
printReport(result);
process.exitCode = result.errors.length ? 1 : 0;
