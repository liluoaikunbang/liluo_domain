import { buildKnowledge } from './lib/indexer.mjs';
console.log(JSON.stringify(await buildKnowledge({ changedOnly: false }), null, 2));
