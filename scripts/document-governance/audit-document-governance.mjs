import { auditDocumentation, loadGovernance, printReport } from './lib/governance.mjs';
const root = process.cwd();
const result = auditDocumentation({ root, ...loadGovernance(root) });
printReport(result);
process.exitCode = result.errors.length ? 1 : 0;
