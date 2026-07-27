export function selectDiverse(scored, query, policy) {
  const limits = policy.packLimits
  const selected = []
  const rejected = []
  const authors = new Set()
  const works = new Set()
  const paths = new Set()
  const issueCats = new Set()
  let externalCount = 0
  let golden = 0
  let personal = 0
  let calibration = 0
  let styleCards = 0

  const sorted = [...scored].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return String(a.candidate.assetId).localeCompare(String(b.candidate.assetId), 'en')
  })

  const hasNonExternalEligible = sorted.some(
    (item) => item.eligible && item.score >= policy.selection.minimumScore && item.candidate.assetType !== 'external-article',
  )

  for (const item of sorted) {
    if (!item.eligible) {
      rejected.push({ ...item, rejectReason: item.reasons?.join(',') || 'ineligible' })
      continue
    }
    if (item.score < policy.selection.minimumScore) {
      rejected.push({ ...item, rejectReason: 'below-minimum-score' })
      continue
    }
    const c = item.candidate
    if (c.authorId && authors.has(c.authorId)) {
      rejected.push({ ...item, rejectReason: 'same-author' })
      continue
    }
    if (c.authorName && c.authorName !== 'unknown' && [...selected].some((s) => s.candidate.authorName === c.authorName)) {
      rejected.push({ ...item, rejectReason: 'same-author-name' })
      continue
    }
    if (c.workId && works.has(c.workId)) {
      rejected.push({ ...item, rejectReason: 'same-work' })
      continue
    }
    if (c.path && paths.has(c.path)) {
      rejected.push({ ...item, rejectReason: 'same-path' })
      continue
    }
    let sameIssue = false
    for (const cat of c.issueCategories ?? []) {
      if (issueCats.has(cat)) {
        sameIssue = true
        break
      }
    }
    if (sameIssue) {
      rejected.push({ ...item, rejectReason: 'same-issue-category' })
      continue
    }

    if (c.assetType === 'external-article' || c.assetType === 'external-style-card') {
      if (externalCount >= limits.maxExternalArticles) {
        rejected.push({ ...item, rejectReason: 'max-external' })
        continue
      }
      // keep one non-external slot if such assets exist
      if (hasNonExternalEligible && selected.length === 0 && externalCount === 0) {
        // allow first external
      }
    }
    if (c.assetType === 'golden-approved' && golden >= limits.maxGoldenExamples) {
      rejected.push({ ...item, rejectReason: 'max-golden' })
      continue
    }
    if (c.assetType === 'personal-history' && personal >= limits.maxPersonalHistoryExamples) {
      rejected.push({ ...item, rejectReason: 'max-personal' })
      continue
    }
    if (c.assetType === 'calibration-pair' && calibration >= limits.maxCalibrationPairs) {
      rejected.push({ ...item, rejectReason: 'max-calibration' })
      continue
    }
    if (c.assetType === 'external-style-card' && styleCards >= limits.maxExternalStyleCards) {
      rejected.push({ ...item, rejectReason: 'max-style-cards' })
      continue
    }

    selected.push(item)
    if (c.authorId) authors.add(c.authorId)
    if (c.workId) works.add(c.workId)
    if (c.path) paths.add(c.path)
    for (const cat of c.issueCategories ?? []) issueCats.add(cat)
    if (c.assetType === 'external-article' || c.assetType === 'external-style-card') externalCount += 1
    if (c.assetType === 'golden-approved') golden += 1
    if (c.assetType === 'personal-history') personal += 1
    if (c.assetType === 'calibration-pair') calibration += 1
    if (c.assetType === 'external-style-card') styleCards += 1
  }

  // If we filled only with externals and non-external eligible exist, drop last external to reserve slot — already limited by maxExternalArticles=2 and selection order by score.
  return { selected, rejected }
}
