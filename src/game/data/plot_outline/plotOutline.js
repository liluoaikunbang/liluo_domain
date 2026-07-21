import catalog from './catalog.json' with { type: 'json' }

const normalize = (value) => String(value ?? '').toLocaleLowerCase('zh-CN').trim()

export const plotOutline = Object.freeze(catalog)

export function findPlotEntries(outline = plotOutline, filters = {}) {
  const keyword = normalize(filters.query ?? filters.keyword)
  const groupsById = new Map((outline.groups ?? []).map((group) => [group.id, group]))
  return outline.entries.filter((entry) => {
    if (filters.usage === 'used' && entry.usageStatus !== 'used') return false
    if (filters.usage === 'partial' && entry.usageStatus !== 'partial') return false
    if (filters.usage === 'unused' && entry.usageStatus === 'used') return false
    if (filters.bondage === 'yes' && !entry.isBondagePlot) return false
    if (filters.bondage === 'no' && entry.isBondagePlot) return false
    if (filters.worldBias === 'general' && entry.worldBiases.length > 0) return false
    if (filters.worldBias && !['all', 'general'].includes(filters.worldBias) && !entry.worldBiases.includes(filters.worldBias)) return false
    if (!keyword) return true
    const group = groupsById.get(entry.groupId)
    return [entry.id, entry.number, entry.title, entry.summary, group?.id, group?.title, group?.summary, ...entry.worldBiases, ...entry.tags, ...(entry.characters ?? []), ...entry.usedBy, ...(entry.usedByLabels ?? []), entry.notes]
      .some((value) => normalize(value).includes(keyword))
  })
}

export function getPlotWorldBiasOptions(outline = plotOutline) {
  return [...new Set(outline.entries.flatMap((entry) => entry.worldBiases))]
}
