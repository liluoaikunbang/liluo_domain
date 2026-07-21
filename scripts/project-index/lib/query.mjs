const includes = (value, query) => String(value ?? '').toLocaleLowerCase().includes(String(query).toLocaleLowerCase())
export function queryRecords(records, options = {}) {
  let result = records.filter((record) => {
    if (options.key && record.key !== options.key && record.id !== options.key) return false
    if (options.type && record.type !== options.type) return false
    if (options.world && record.world !== options.world) return false
    if ((options.parent || options.childOf) && record.parentKey !== (options.parent ?? options.childOf)) return false
    if (options.sourcePath && !includes(record.sourcePath ?? record.markdownPath ?? record.sourceJsonPath, options.sourcePath)) return false
    if (options.query && !includes([record.id, record.key, record.title, record.summary, record.sourcePath, ...(record.tags ?? [])].join(' '), options.query)) return false
    if (options.reverseReference && !includes(record.entityId, options.reverseReference) && !Object.values(record.references ?? {}).flat(Infinity).some((value) => includes(value, options.reverseReference))) return false
    return true
  })
  result.sort((a, b) => String(a.key ?? a.id ?? '').localeCompare(String(b.key ?? b.id ?? ''), 'zh-CN')); result = result.slice(0, options.limit ?? 10)
  if (options.fields?.length) result = result.map((record) => Object.fromEntries(options.fields.filter((field) => field in record).map((field) => [field, record[field]])))
  return result
}
