import { buildKnowledge } from './lib/indexer.mjs';
import { syncAuthoritativeSource } from './lib/sync.mjs';
const sync = await syncAuthoritativeSource();
const index = await buildKnowledge({ changedOnly: true });
console.log(JSON.stringify({ sync, index }, null, 2));
