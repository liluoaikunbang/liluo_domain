/**
 * Derive 紧缚 RAG primary (level-1) labels from story/plot ragRefs.
 * - category card → its title
 * - concept card → parent category title when present; otherwise own title
 */

function asArray(value) {
  return Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const raw of asArray(values)) {
    const text = String(raw ?? '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

export function indexRagCardsById(cards = []) {
  const byId = new Map();
  for (const card of asArray(cards)) {
    const id = String(card?.cardId ?? card?.id ?? '').trim();
    if (!id) continue;
    byId.set(id, card);
  }
  return byId;
}

/**
 * @param {string[]|string} ragRefs
 * @param {Map<string, object>|object[]} cardsOrIndex
 * @returns {string[]}
 */
export function resolveRestraintRagPrimaryLabels(ragRefs, cardsOrIndex) {
  const byId =
    cardsOrIndex instanceof Map ? cardsOrIndex : indexRagCardsById(cardsOrIndex);
  const labels = [];
  for (const ref of uniqueStrings(ragRefs)) {
    const card = byId.get(ref);
    if (!card) {
      labels.push(ref);
      continue;
    }
    const layer = String(card.ragLayer ?? '').trim();
    if (layer === 'category') {
      labels.push(String(card.title ?? ref).trim() || ref);
      continue;
    }
    const parentId = asArray(card.parentCardIds)[0];
    const parent = parentId ? byId.get(String(parentId)) : null;
    if (parent?.title) {
      labels.push(String(parent.title).trim());
      continue;
    }
    labels.push(String(card.title ?? ref).trim() || ref);
  }
  return uniqueStrings(labels);
}

export function cardNeedsRestraintBodyTodo(card) {
  if (!card) return true;
  const stub = card.contentStatus === 'stub' || card.evidenceStatus === 'missing';
  const emptyBody = !String(card.summary ?? '').trim() && !String(card.definition ?? '').trim();
  const noSources = asArray(card.sourceRefs).length === 0;
  return stub || emptyBody || noSources;
}

export function buildRestraintRagMissingItem(cardOrTitle) {
  const title =
    typeof cardOrTitle === 'string'
      ? cardOrTitle.trim()
      : String(cardOrTitle?.title ?? cardOrTitle?.cardId ?? '').trim();
  return `RAG｜紧缚RAG｜补全「${title || '未命名卡'}」正文与来源`;
}
