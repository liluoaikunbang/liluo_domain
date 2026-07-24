import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../..');
const DEFAULT_SOURCE_ROOT = path.join(REPO_ROOT, 'external-knowledge', 'sources', 'zhihu-novels');

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}
function hasFlag(name) { return process.argv.includes(name); }
function slugify(value) {
  return String(value ?? 'zhihu-novel')
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'zhihu-novel';
}
export function authorDirectoryName(markdown) {
  const authorMatch = markdown.match(/^\s*(?:\*\*)?(?:Author|作者)\s*[:：](?:\*\*)?\s*(?:\[([^\]]+)\]|([^\n\r]+))/im);
  const author = authorMatch?.[1] ?? authorMatch?.[2];
  return slugify(author || '未署名');
}
export function sourceUrlFromMarkdown(markdown, fallback) {
  const linkMatch = markdown.match(/^\s*(?:\*\*)?(?:Link|链接)\s*[:：](?:\*\*)?\s*\[([^\]]+)\]/im);
  return linkMatch?.[1] || fallback;
}
async function collectMarkdown(inputPath) {
  const stat = await fs.stat(inputPath);
  if (stat.isFile()) return path.extname(inputPath).toLowerCase() === '.md' ? [inputPath] : [];
  const result = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') result.push(target);
    }
  }
  await walk(inputPath);
  return result.sort((a, b) => a.localeCompare(b, 'zh-CN'));
}
async function main() {
  const input = argValue('--input');
  if (!input) throw new Error('Missing --input <markdown-file-or-directory>');
  const url = argValue('--url', 'unknown');
  const sourceRoot = path.resolve(argValue('--source-root', DEFAULT_SOURCE_ROOT));
  if (!sourceRoot.startsWith(path.join(REPO_ROOT, 'external-knowledge', 'sources'))) {
    throw new Error(`Refuse to import outside external-knowledge/sources: ${sourceRoot}`);
  }
  const files = await collectMarkdown(path.resolve(input));
  if (!files.length) throw new Error(`No Markdown files found under ${input}`);
  const imported = [];
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const archivedAt = new Date();
    const destDir = path.join(sourceRoot, authorDirectoryName(raw));
    const sourceUrl = sourceUrlFromMarkdown(raw, url);
    await fs.mkdir(destDir, { recursive: true });
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12);
    const base = slugify(path.basename(file, path.extname(file)));
    const dest = path.join(destDir, `${base}-${hash}.md`);
    const header = [
      '<!--',
      'knowledgeScope: external-fiction-reference',
      'canonical: false',
      'sourcePlatform: zhihu',
      `sourceUrl: ${sourceUrl}`,
      `archivedOn: ${archivedAt.toISOString().slice(0, 10)}`,
      `ingestedAt: ${archivedAt.toISOString()}`,
      'usage: inspiration-only; abstract before reuse; never treat as Liluo canon',
      '-->',
      '',
    ].join('\n');
    await fs.writeFile(dest, raw.startsWith('<!--') ? raw : `${header}${raw}`, 'utf8');
    imported.push(path.relative(REPO_ROOT, dest).replaceAll('\\', '/'));
  }
  if (hasFlag('--build-index')) {
    execFileSync('npm', ['run', 'external:knowledge:build'], { cwd: REPO_ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
    execFileSync('npm', ['run', 'external:knowledge:validate'], { cwd: REPO_ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
  }
  console.log(JSON.stringify({ ok: true, imported, buildIndex: hasFlag('--build-index') }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
}
