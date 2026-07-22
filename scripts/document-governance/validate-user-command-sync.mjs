import { printReport, validateUserCommands } from './lib/governance.mjs';
const result = validateUserCommands({ root: process.cwd() });
printReport(result);
process.exitCode = result.errors.length ? 1 : 0;
