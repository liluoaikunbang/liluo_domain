import { readFile } from 'node:fs/promises'
import { countChineseCharacters } from './style-explain.mjs'
import { repoPath } from './paths.mjs'

const STRICT_BOUNDARIES = [
  '不继承范例中的人名、地点、组织、道具、事件或结局。',
  '当前剧情事实只来自 CANON 和 SCENE CONTRACT。',
  'Style Pack 只控制表达，不提供剧情事实。',
]

function packIdFromQuery(queryId) {
  return `sp-${String(queryId).replace(/^sq-/, '')}`
}

async function tryRead(rel) {
  try {
    return await readFile(repoPath(rel), 'utf8')
  } catch {
    return null
  }
}

export async function assembleStylePack({ query, selected, policy, writingSheetText = null }) {
  const limit = policy.packLimits.maxRawReferenceChineseCharacters
  const sections = {
    writingSheet: writingSheetText,
    hardRules: (query.hardRules ?? []).slice(0, policy.packLimits.maxHardRules),
    positiveExamples: [],
    externalReferences: [],
    calibrationPairs: [],
    modelFailureModes: query.modelKnownFailureModes ?? [],
    strictBoundaries: [...STRICT_BOUNDARIES],
  }

  let used = 0
  const selectedAssets = []
  const explanations = []

  for (const item of selected) {
    const c = item.candidate
    const reasons = [
      `score=${item.score.toFixed(3)}`,
      `themeDomain=${c.themeDomain}`,
      ...(item.scoreDetail?.explanation?.slice(0, 4) ?? []),
    ]
    selectedAssets.push({
      assetId: c.assetId,
      assetType: c.assetType,
      score: item.score,
      sourceRecordId: c.sourceRecordId,
      reasons,
    })
    explanations.push(`${c.assetId}: ${reasons.join('; ')}`)

    if (c.assetType === 'external-article' || c.assetType === 'external-style-card') {
      const blurb = [
        `来源：${c.title}｜作者：${c.authorName}`,
        `只参考：节奏、叙述距离、动作/对话密度与适用域（${c.themeDomain}）`,
        '不得继承：专名、独特道具、情节事实与结局',
      ].join('\n')
      const cost = countChineseCharacters(blurb)
      if (used + cost <= limit) {
        sections.externalReferences.push({ assetId: c.assetId, text: blurb })
        used += cost
      }
      continue
    }

    if (c.path) {
      const text = await tryRead(c.path)
      if (text) {
        const slice = text.slice(0, Math.max(0, Math.min(800, (limit - used) * 2)))
        const cost = countChineseCharacters(slice)
        if (used + cost > limit) continue
        used += cost
        if (c.assetType === 'calibration-pair') {
          sections.calibrationPairs.push({ assetId: c.assetId, text: slice })
        } else {
          sections.positiveExamples.push({ assetId: c.assetId, text: slice })
        }
      }
    }
  }

  const status =
    selectedAssets.length === 0
      ? 'awaiting-assets'
      : selectedAssets.length < 1
        ? 'partial'
        : 'ready'

  const renderedMarkdown = renderStylePackMarkdown({ sections, status })

  return {
    schemaVersion: 1,
    packId: packIdFromQuery(query.queryId),
    queryId: query.queryId,
    requestContractId: query.requestContractId ?? null,
    status,
    mode: query.mode,
    sections,
    selectedAssets,
    explanations,
    characterBudget: { used, limit },
    renderedMarkdown,
    createdAt: new Date().toISOString(),
  }
}

export function renderStylePackMarkdown({ sections, status }) {
  if (status === 'awaiting-assets') {
    return [
      '[STYLE PACK — 只控制表达，不提供剧情事实]',
      '',
      '状态：awaiting-assets',
      '当前没有可生产使用的文风资产（未伪造范例）。',
      '请先完成外部文章评权与生产表示审批，或登记黄金正文 / 个人旧作 / 修改对照。',
      '',
      '## 严格边界',
      ...STRICT_BOUNDARIES.map((line) => `- ${line}`),
      '',
    ].join('\n')
  }

  const lines = ['[STYLE PACK — 只控制表达，不提供剧情事实]', '']
  if (sections.writingSheet) {
    lines.push('## 璃落写作表', sections.writingSheet, '')
  }
  if (sections.hardRules?.length) {
    lines.push('## 当前场景硬规则', ...sections.hardRules.map((r) => `- ${r}`), '')
  }
  if (sections.positiveExamples?.length) {
    lines.push('## 正向短例')
    for (const ex of sections.positiveExamples) {
      lines.push(`### ${ex.assetId}`, ex.text, '')
    }
  }
  if (sections.externalReferences?.length) {
    lines.push('## 外部文章参考')
    for (const ex of sections.externalReferences) {
      lines.push(ex.text, '')
    }
  }
  if (sections.calibrationPairs?.length) {
    lines.push('## 修改对照')
    for (const ex of sections.calibrationPairs) {
      lines.push(`### ${ex.assetId}`, ex.text, '')
    }
  }
  if (sections.modelFailureModes?.length) {
    lines.push('## 当前模型易错项', ...sections.modelFailureModes.map((r) => `- ${r}`), '')
  }
  lines.push('## 严格边界', ...STRICT_BOUNDARIES.map((line) => `- ${line}`), '')
  return lines.join('\n')
}
