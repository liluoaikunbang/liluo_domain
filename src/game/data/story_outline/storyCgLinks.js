const slotIndexCache = new WeakMap();

export function resolveStoryCgEntries(cgRefs, cgSlots) {
  if (!Array.isArray(cgRefs) || !Array.isArray(cgSlots)) {
    return [];
  }

  const slotByTitle = getSlotIndex(cgSlots);
  const resolvedTitles = new Set();

  return cgRefs.reduce((entries, cgRef) => {
    const title = String(cgRef ?? '').trim();
    const slot = slotByTitle.get(title);

    if (!slot || resolvedTitles.has(title)) {
      return entries;
    }

    resolvedTitles.add(title);
    entries.push(slot);
    return entries;
  }, []);
}

export function resolveStoryCgSequence(cgRefs, cgSequence, cgSlots) {
  const referencedEntries = resolveStoryCgEntries(cgRefs, cgSlots);
  const entryByTitle = new Map(referencedEntries.map((entry) => [String(entry.title).trim(), entry]));
  const sequencedTitles = new Set();
  const sequenceItems = Array.isArray(cgSequence) ? cgSequence : [];

  const entries = sequenceItems.reduce((resolvedEntries, item) => {
    const [rawTitle = '', rawTiming = '', ...contentParts] = String(item ?? '').split('｜');
    const title = rawTitle.trim();
    const timing = rawTiming.trim();
    const content = contentParts.join('｜').trim();

    const linkedEntry = entryByTitle.get(title);

    if (!title || !linkedEntry || sequencedTitles.has(title)) {
      return resolvedEntries;
    }

    sequencedTitles.add(title);
    resolvedEntries.push({
      ...linkedEntry,
      sequenceIndex: resolvedEntries.length + 1,
      timing,
      content,
      hasAsset: true
    });
    return resolvedEntries;
  }, []);

  referencedEntries.forEach((entry) => {
    const title = String(entry.title ?? '').trim();
    if (sequencedTitles.has(title)) {
      return;
    }

    entries.push({
      ...entry,
      sequenceIndex: entries.length + 1,
      timing: '',
      content: '',
      hasAsset: true
    });
  });

  return entries;
}

export function createStoryCgPreview(entry, activeVariantIndex = 0) {
  const variants = Array.isArray(entry?.variants)
    ? entry.variants.filter((variant) => String(variant?.image ?? '').trim())
    : [];

  if (variants.length === 0) {
    return null;
  }

  const normalizedIndex = Number.isInteger(activeVariantIndex)
    ? Math.min(Math.max(activeVariantIndex, 0), variants.length - 1)
    : 0;

  return {
    title: String(entry?.title ?? '').trim() || '关联 CG',
    variants,
    activeVariantIndex: normalizedIndex
  };
}

function getSlotIndex(cgSlots) {
  const cachedIndex = slotIndexCache.get(cgSlots);

  if (cachedIndex) {
    return cachedIndex;
  }

  const slotByTitle = new Map(
    cgSlots
      .map((slot) => [String(slot?.title ?? '').trim(), slot])
      .filter(([title]) => title)
  );

  slotIndexCache.set(cgSlots, slotByTitle);
  return slotByTitle;
}
