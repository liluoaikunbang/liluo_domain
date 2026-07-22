import { loadGovernance, printReport, validateDesignMemory } from './lib/governance.mjs';
const root = process.cwd();
const { ruleRegistry } = loadGovernance(root);
const result = validateDesignMemory({ root, ruleRegistry });
result.info = [`records=${result.records}`];
printReport(result);
process.exitCode = result.errors.length ? 1 : 0;
