export function mergeMapContentRegistry(
  contentKind: 'event' | 'dialogue',
  sources: ReadonlyArray<{ mapId: string; entries: Record<string, unknown> }>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const sourceById = new Map<string, string>();

  for (const { mapId, entries } of sources) {
    for (const [id, entry] of Object.entries(entries)) {
      const existingMapId = sourceById.get(id);

      if (existingMapId) {
        throw new Error(`Duplicate ${contentKind} id "${id}" in maps "${existingMapId}" and "${mapId}".`);
      }

      sourceById.set(id, mapId);
      merged[id] = entry;
    }
  }

  return merged;
}
