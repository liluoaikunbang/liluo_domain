import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

async function walkJson(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walkJson(absolute))
    else if (entry.name.endsWith('.json')) files.push(absolute)
  }
  return files
}

export async function loadEvalCases(root) {
  const directory = path.join(root, 'evals', 'cases')
  const files = await walkJson(directory)
  const cases = []
  for (const file of files.sort()) {
    const value = JSON.parse(await readFile(file, 'utf8'))
    cases.push({ ...value, file: path.relative(root, file).replaceAll(path.sep, '/') })
  }
  return cases
}

export function matchesCaseGlob(caseFile, glob) {
  if (glob.endsWith('/*.json')) return caseFile.startsWith(glob.slice(0, -6)) && caseFile.endsWith('.json')
  return caseFile === glob
}
