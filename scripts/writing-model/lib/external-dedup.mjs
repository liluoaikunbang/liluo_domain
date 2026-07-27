import { createHash } from 'node:crypto'
import { normalizeComparableAuthor, normalizeComparableTitle } from './external-metadata.mjs'

function makeGroupId(key) {
  return `dg-${createHash('sha256').update(key).digest('hex').slice(0, 10)}`
}

export function detectDuplicates(articles) {
  const groupsMap = new Map()

  function addToGroup(key, article) {
    if (!groupsMap.has(key)) groupsMap.set(key, [])
    groupsMap.get(key).push(article)
  }

  for (const article of articles) {
    addToGroup(`hash:${article.hash}`, article)
    if (article.contentHash) addToGroup(`content:${article.contentHash}`, article)
    if (article.sourceUrl) addToGroup(`url:${article.sourceUrl}`, article)
    const titleKey = normalizeComparableTitle(article.title?.value)
    const authorKey = normalizeComparableAuthor(article.author?.displayName)
    if (titleKey && titleKey !== 'unknown' && authorKey && authorKey !== 'unknown') {
      addToGroup(`title-author:${titleKey}|${authorKey}`, article)
    }
  }

  const membership = new Map()
  const groups = []
  for (const [key, members] of groupsMap.entries()) {
    const unique = [...new Map(members.map((item) => [item.articleId, item])).values()]
    if (unique.length < 2) continue
    const sorted = unique.sort((a, b) => a.path.localeCompare(b.path, 'en'))
    const groupId = makeGroupId(key)
    const canonical = sorted[0]
    groups.push({
      duplicateGroupId: groupId,
      key,
      canonicalRecordId: canonical.articleId,
      duplicateRecordIds: sorted.slice(1).map((item) => item.articleId),
    })
    for (const item of sorted) {
      const existing = membership.get(item.articleId)
      if (!existing || item.articleId === canonical.articleId) {
        membership.set(item.articleId, {
          duplicateGroupId: groupId,
          isCanonicalDuplicate: item.articleId === canonical.articleId,
        })
      }
    }
  }

  const result = articles.map((article) => {
    const meta = membership.get(article.articleId)
    return {
      ...article,
      duplicateGroupId: meta?.duplicateGroupId ?? null,
      isCanonicalDuplicate: meta ? meta.isCanonicalDuplicate : true,
    }
  })

  return { articles: result, groups }
}
