import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { STYLE_FEEDBACK_PATH, repoPath } from './paths.mjs'

export async function loadStyleFeedback() {
  try {
    return JSON.parse(await readFile(repoPath(STYLE_FEEDBACK_PATH), 'utf8'))
  } catch {
    return { schemaVersion: 1, updatedAt: null, records: [] }
  }
}

export async function saveStyleFeedback(data) {
  data.updatedAt = new Date().toISOString()
  await mkdir(path.dirname(repoPath(STYLE_FEEDBACK_PATH)), { recursive: true })
  await writeFile(repoPath(STYLE_FEEDBACK_PATH), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/**
 * Record human feedback for model effectiveness.
 * Model self-scores are ignored by callers — only humanScore accepted.
 */
export async function recordStyleFeedback(input) {
  if (input.modelSelfScore != null) {
    throw new Error('不接受模型自评；仅记录人工评分')
  }
  if (input.humanScore == null || input.humanScore < 0 || input.humanScore > 5) {
    throw new Error('humanScore 必须为 0–5')
  }
  const data = await loadStyleFeedback()
  const record = {
    feedbackId: input.feedbackId ?? `sfb-${Date.now().toString(36)}`,
    queryId: input.queryId ?? null,
    packId: input.packId ?? null,
    assetId: input.assetId,
    modelId: input.modelId,
    humanScore: input.humanScore,
    editRatio: input.editRatio ?? null,
    helpful: input.helpful ?? null,
    notes: input.notes ?? '',
    createdAt: new Date().toISOString(),
  }
  data.records.push(record)
  await saveStyleFeedback(data)
  return record
}

export function summarizeModelEffectiveness(feedbackRecords, modelId, assetId, minimumRatedUses = 3) {
  const rows = feedbackRecords.filter(
    (r) => r.modelId === modelId && r.assetId === assetId && typeof r.humanScore === 'number',
  )
  if (rows.length < minimumRatedUses) {
    return { ratedUses: rows.length, ready: false, score: 0.5 }
  }
  const meanHumanScore = rows.reduce((s, r) => s + r.humanScore, 0) / rows.length
  const editRows = rows.filter((r) => typeof r.editRatio === 'number')
  const meanEditRatio = editRows.length
    ? editRows.reduce((s, r) => s + r.editRatio, 0) / editRows.length
    : 0.5
  const score = 0.7 * (meanHumanScore / 5) + 0.3 * (1 - Math.min(1, Math.max(0, meanEditRatio)))
  return { ratedUses: rows.length, ready: true, meanHumanScore, meanEditRatio, score }
}
