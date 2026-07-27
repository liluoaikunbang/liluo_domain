import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { WRITING_SHEET_CURRENT_PATH, repoPath } from './paths.mjs'

export function emptyWritingSheet() {
  return {
    schemaVersion: 1,
    sheetId: 'liluo-writing-sheet',
    status: 'awaiting-assets',
    approvedByUser: false,
    evidenceAssetIds: [],
    evidencePriority: [
      'golden-approved',
      'calibration-pair',
      'personal-history',
      'external-article-high-score',
      'external-style-card',
    ],
    principles: [],
    preferredPatterns: [],
    avoidedPatterns: [],
    notes: '外部文章可作为补充证据，但不得单独定义璃落文风。用户批准后才更新 current。',
    updatedAt: new Date().toISOString(),
  }
}

export async function loadWritingSheet() {
  try {
    return JSON.parse(await readFile(repoPath(WRITING_SHEET_CURRENT_PATH), 'utf8'))
  } catch {
    return emptyWritingSheet()
  }
}

export async function saveWritingSheet(sheet) {
  sheet.updatedAt = new Date().toISOString()
  await mkdir(path.dirname(repoPath(WRITING_SHEET_CURRENT_PATH)), { recursive: true })
  await writeFile(repoPath(WRITING_SHEET_CURRENT_PATH), `${JSON.stringify(sheet, null, 2)}\n`, 'utf8')
}

export async function draftWritingSheet(input = {}) {
  const current = await loadWritingSheet()
  const draft = {
    ...current,
    ...input,
    status: 'draft',
    approvedByUser: false,
    sheetId: current.sheetId,
    updatedAt: new Date().toISOString(),
  }
  const draftPath = 'docs/写作资产/璃落写作表/drafts/draft-latest.json'
  await mkdir(repoPath('docs/写作资产/璃落写作表/drafts'), { recursive: true })
  await writeFile(repoPath(draftPath), `${JSON.stringify(draft, null, 2)}\n`, 'utf8')
  return { draftPath, draft }
}

export async function approveWritingSheet(options = {}) {
  if (options.userApproved !== true) {
    throw new Error('写作表批准需要显式 --user-approved')
  }
  const draftPath = options.draftPath ?? 'docs/写作资产/璃落写作表/drafts/draft-latest.json'
  const draft = JSON.parse(await readFile(repoPath(draftPath), 'utf8'))
  if (!draft.evidenceAssetIds?.length) {
    throw new Error('写作表证据为空；外部文章不得单独定义璃落文风，且当前无黄金正文时保持 awaiting-assets')
  }
  const approved = {
    ...draft,
    status: 'approved',
    approvedByUser: true,
    approvedAt: new Date().toISOString(),
  }
  await saveWritingSheet(approved)
  const versionPath = `docs/写作资产/璃落写作表/versions/${Date.now()}.json`
  await mkdir(repoPath('docs/写作资产/璃落写作表/versions'), { recursive: true })
  await writeFile(repoPath(versionPath), `${JSON.stringify(approved, null, 2)}\n`, 'utf8')
  return { sheet: approved, versionPath }
}

export function renderWritingSheetText(sheet) {
  if (!sheet || sheet.status === 'awaiting-assets' || sheet.approvedByUser !== true) {
    return null
  }
  const lines = ['璃落写作表（用户批准）']
  for (const p of sheet.principles ?? []) lines.push(`- 原则：${p}`)
  for (const p of sheet.preferredPatterns ?? []) lines.push(`- 偏好：${p}`)
  for (const p of sheet.avoidedPatterns ?? []) lines.push(`- 避免：${p}`)
  return lines.join('\n')
}
