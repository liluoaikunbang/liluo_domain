import fs from 'node:fs/promises';
import path from 'node:path';
export async function readJson(filePath, fallback = null) { try { return JSON.parse(await fs.readFile(filePath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; } }
export async function writeJson(filePath, value) { await fs.mkdir(path.dirname(filePath), { recursive: true }); await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
export async function listFiles(root) { const result = []; async function walk(directory) { let entries; try { entries = await fs.readdir(directory, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return; throw error; } for (const entry of entries) { const target = path.join(directory, entry.name); if (entry.isDirectory()) await walk(target); else if (entry.isFile()) result.push(target); } } await walk(root); return result.sort((a, b) => a.localeCompare(b, 'zh-CN')); }
export async function publishDirectory(tempPath, finalPath) {
  await fs.mkdir(finalPath, { recursive: true });
  const desired = new Set((await listFiles(tempPath)).map((file) => path.relative(tempPath, file)));
  for (const existing of await listFiles(finalPath)) if (!desired.has(path.relative(finalPath, existing))) await fs.rm(existing, { force: true });
  for (const relative of desired) {
    const destination = path.join(finalPath, relative), temporary = `${destination}.publishing`;
    await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.copyFile(path.join(tempPath, relative), temporary);
    await fs.rm(destination, { force: true }); await fs.rename(temporary, destination);
  }
}
