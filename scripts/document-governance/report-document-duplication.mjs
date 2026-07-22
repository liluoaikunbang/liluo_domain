import { findExactDuplicates } from './lib/governance.mjs';
const duplicates = findExactDuplicates({ root: process.cwd() });
for (const item of duplicates) console.log(`WARNING exact-duplicate similarity=${item.similarity} chars=${item.chars} first=${item.first} second=${item.second}`);
console.log(`INFO exactDuplicatePairs=${duplicates.length}`);
