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
