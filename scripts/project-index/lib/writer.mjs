import fs from 'node:fs'
import path from 'node:path'
export async function atomicReplaceDirectory(target, build) {
  fs.mkdirSync(target, { recursive: true }); const temp = fs.mkdtempSync(path.join(target, '.build-tmp-'))
  try {
    await build(temp)
    const staged = []
    const visit = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) visit(full); else staged.push(full) } }; visit(temp)
    const stagedRelative = new Set(staged.map((file) => path.relative(temp, file)))
    const existing = []
    const visitExisting = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { if (entry.name.startsWith('.build-tmp-')) continue; const full = path.join(dir, entry.name); if (entry.isDirectory()) visitExisting(full); else existing.push(full) } }; visitExisting(target)
    for (const file of staged) { const relative = path.relative(temp, file); const destination = path.join(target, relative); fs.mkdirSync(path.dirname(destination), { recursive: true }); const swap = `${destination}.new`; fs.copyFileSync(file, swap); fs.renameSync(swap, destination) }
    for (const file of existing) if (!stagedRelative.has(path.relative(target, file))) fs.rmSync(file)
    fs.rmSync(temp, { recursive: true, force: true })
  } catch (error) { if (fs.existsSync(temp)) fs.rmSync(temp, { recursive: true, force: true }); throw error }
}
export function writeText(root, relativePath, text) { const target = path.join(root, relativePath); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text.replaceAll('\r\n', '\n'), 'utf8') }
