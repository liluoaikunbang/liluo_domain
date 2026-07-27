import { createHash } from 'node:crypto'
import path from 'node:path'

function field(value, confidence, extractedFrom) {
  return { value, confidence, extractedFrom }
}

function normalizeTitleCandidate(raw) {
  if (!raw) return null
  let text = String(raw).trim()
  text = text.replace(/^#+\s*/, '')
  text = text.replace(/^【|】$/g, '')
  text = text.replace(/\s+/g, ' ').trim()
  if (!text) return null
  return text
}

function stripExtension(name) {
  return name.replace(/\.md$/i, '')
}

function parseHtmlCommentFrontmatter(text) {
  const match = text.match(/^<!--([\s\S]*?)-->/)
  if (!match) return null
  const body = match[1]
  const data = {}
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.+)\s*$/)
    if (m) data[m[1]] = m[2].trim()
  }
  return data
}

function parseYamlFrontmatter(text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end < 0) return null
  const block = text.slice(3, end).trim()
  const data = {}
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)\s*$/)
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return data
}

function extractBodyTitle(text) {
  const lines = text.split(/\r?\n/).slice(0, 40)
  for (const line of lines) {
    const heading = line.match(/^#\s+(.+)\s*$/)
    if (heading) return normalizeTitleCandidate(heading[1])
  }
  return null
}

function extractAuthorFromFilename(fileName) {
  const base = stripExtension(fileName)
  // pattern: title-author（tag） or title-author
  const dash = base.match(/^(.+?)-([^-（(]{1,40})(?:[（(].*)?$/)
  if (dash && dash[2] && !/^\d+$/.test(dash[2])) {
    return { displayName: dash[2].trim(), confidence: 'low', extractedFrom: 'filename' }
  }
  return null
}

function extractAuthorFromZhihuPath(relativePath) {
  const parts = relativePath.split('/')
  // external-knowledge/sources/zhihu-novels/{author}/file.md
  const idx = parts.findIndex((p) => p === 'zhihu-novels')
  if (idx >= 0 && parts[idx + 1]) {
    return {
      displayName: parts[idx + 1],
      confidence: 'high',
      extractedFrom: 'folder',
    }
  }
  return null
}

function extractAuthorFromBondagePath(relativePath, source) {
  const parts = relativePath.split('/')
  const hints = source.authorExtractionHints ?? {}
  const prefix = hints.authorFolderPrefix
  const unknownFolders = new Set(hints.unknownAuthorFolders ?? [])
  const idx = parts.findIndex((p) => p === 'fiction-bondage')
  if (idx < 0) return null
  const top = parts[idx + 1]
  if (!top) return null
  if (unknownFolders.has(top)) {
    return { displayName: 'unknown', confidence: 'unknown', extractedFrom: 'folder' }
  }
  if (prefix && top === prefix) {
    const author = parts[idx + 2]
    if (author) {
      return { displayName: author, confidence: 'medium', extractedFrom: 'folder' }
    }
  }
  return { displayName: 'unknown', confidence: 'unknown', extractedFrom: 'unknown' }
}

function extractTitleFromZhihuFilename(fileName) {
  const base = stripExtension(fileName)
  // (YYYYMMDD)question_author-hash
  const m = base.match(/^\(\d{8}\)(.+?)_[^-]+-[a-f0-9]{6,}$/i)
  if (m) return normalizeTitleCandidate(m[1])
  return normalizeTitleCandidate(base)
}

export function extractArticleMetadata({ text, relativePath, source, fileName }) {
  const htmlMeta = parseHtmlCommentFrontmatter(text)
  const yamlMeta = parseYamlFrontmatter(text)
  const meta = { ...(yamlMeta ?? {}), ...(htmlMeta ?? {}) }

  let title = null
  if (meta.title) {
    title = field(normalizeTitleCandidate(meta.title) ?? 'unknown', 'high', 'frontmatter')
  } else {
    const bodyTitle = extractBodyTitle(text)
    if (bodyTitle) title = field(bodyTitle, 'high', 'body')
    else if (source.id === 'zhihu-articles') {
      const fromName = extractTitleFromZhihuFilename(fileName)
      title = field(fromName ?? 'unknown', fromName ? 'medium' : 'unknown', 'filename')
    } else {
      const fromName = normalizeTitleCandidate(stripExtension(fileName))
      title = field(fromName ?? 'unknown', fromName ? 'medium' : 'unknown', 'filename')
    }
  }

  let author = null
  if (meta.author || meta.authorName) {
    author = {
      displayName: String(meta.author ?? meta.authorName).trim() || 'unknown',
      confidence: 'high',
      extractedFrom: 'frontmatter',
    }
  } else if (source.id === 'zhihu-articles' || source.authorExtractionHints?.authorIsFirstPathSegment) {
    author = extractAuthorFromZhihuPath(relativePath) ?? {
      displayName: 'unknown',
      confidence: 'unknown',
      extractedFrom: 'unknown',
    }
  } else if (source.id === 'restraint-articles') {
    author = extractAuthorFromBondagePath(relativePath, source)
    if (!author || author.displayName === 'unknown') {
      const fromFile = extractAuthorFromFilename(fileName)
      if (fromFile) author = fromFile
      else author = author ?? { displayName: 'unknown', confidence: 'unknown', extractedFrom: 'unknown' }
    }
  } else {
    author = { displayName: 'unknown', confidence: 'unknown', extractedFrom: 'unknown' }
  }

  const sourceUrl = meta.sourceUrl ?? meta.url ?? null
  const contentHash = createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex')

  return {
    title,
    author,
    sourceUrl,
    contentHash,
    pathBasename: path.basename(relativePath),
  }
}

export function normalizeComparableTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .replace(/[《》【】\[\]（）()\s_\-—–·.,，。:：!！?？]/g, '')
}

export function normalizeComparableAuthor(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\s+/g, '')
    .trim()
}
