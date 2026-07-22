import { createHash } from 'node:crypto';
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const normalizeText = (value) => value.normalize('NFKC').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
