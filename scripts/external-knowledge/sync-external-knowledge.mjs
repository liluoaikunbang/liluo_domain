import { syncAuthoritativeSource } from './lib/sync.mjs';
console.log(JSON.stringify(await syncAuthoritativeSource(), null, 2));
