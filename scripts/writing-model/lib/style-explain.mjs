export function countChineseCharacters(text) {
  const matches = String(text ?? '').match(/[\u3400-\u9FFF]/g)
  return matches ? matches.length : 0
}

export function explainSearchResult({ query, selected, rejected, policy }) {
  const lines = [
    `Style-RAG 模式：${query.mode}`,
    `场景功能：${query.primarySceneFunction}`,
    `主题域：${query.themeDomain}（适用域匹配，不是质量分）`,
    `最低分阈值：${policy.selection.minimumScore}`,
    `选中 ${selected.length} 条，淘汰 ${rejected.length} 条`,
  ]
  for (const item of selected) {
    lines.push(
      `✓ ${item.candidate.assetId} (${item.candidate.assetType}) score=${item.score.toFixed(3)} theme=${item.candidate.themeDomain} userQ=${Number(item.candidate.userQuality ?? 0).toFixed(3)}`,
    )
  }
  for (const item of rejected.slice(0, 12)) {
    lines.push(
      `✗ ${item.candidate.assetId}: ${item.rejectReason || item.reasons?.join(',') || 'rejected'}`,
    )
  }
  if (selected.length === 0) {
    lines.push('结果：awaiting-assets（不伪造范例）')
  }
  lines.push('禁止：embedding / 向量库 / learned reranker / 模型训练（V2–V4 暂缓）')
  return lines
}
