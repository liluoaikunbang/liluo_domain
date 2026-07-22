import { freshness } from './lib/indexer.mjs';
const result = await freshness(); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.status === 'current' ? 0 : 1;
