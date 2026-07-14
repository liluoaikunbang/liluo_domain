import { parseGameSaveData, type GameSaveData } from './saveData.ts';
import { initialDesireCrystalAmount, initialGoldAmount } from './gameRuntime.ts';
import { resolvePlayerCharacterStaticPreview } from '../data/playerCharacter.ts';
import { resolvePlayerMovementPresentation } from '../data/playerMovementPresentationRules.ts';

export interface GameSavePlayerPreview {
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  frameIndex: number;
  frameColumns: number;
  displayOriginX: number;
  displayOriginY: number;
  displayScale: number;
}

export interface GameSaveFileSummary {
  slotId: string;
  savedAt: string | null;
  mapId: string | null;
  position: {
    x: number;
    y: number;
  } | null;
  playerStatus: string[];
  playerRestraints: string[];
  goldAmount: number;
  desireCrystalAmount: number;
  playerPreview: GameSavePlayerPreview | null;
}

export interface GameSaveExportData {
  version: 1;
  exportedAt: string;
  saves: Record<string, GameSaveData>;
}

const SAVE_STORAGE_KEY_PREFIX = 'liluo_domain:game_save:';
const SAVE_EXPORT_FILE_NAME = 'liluo-domain-saves.json';
export const AUTO_SAVE_SLOT_ID = 'autosave';
const SAVE_SLOT_ID_PREFIX = 'save';

function normalizeSlotId(slotId: string): string {
  const sanitizedSlotId = slotId.trim().replace(/[^a-zA-Z0-9_-]/g, '-');

  if (!sanitizedSlotId) {
    return createNextSlotId(listGameSaveFiles().map((save) => save.slotId));
  }

  const numberedSlotIndex = getNumberedSlotIndex(sanitizedSlotId);

  return numberedSlotIndex === null ? sanitizedSlotId : formatNumberedSlotId(numberedSlotIndex);
}

function getSaveStorageKey(slotId: string): string {
  return `${SAVE_STORAGE_KEY_PREFIX}${normalizeSlotId(slotId)}`;
}

function formatNumberedSlotId(index: number): string {
  return `${SAVE_SLOT_ID_PREFIX}${String(index).padStart(3, '0')}`;
}

function getNumberedSlotIndex(slotId: string): number | null {
  if (slotId === 'default') {
    return 1;
  }

  const match = /^save-?(\d{3})$/.exec(slotId);

  if (!match) {
    return null;
  }

  const index = Number.parseInt(match[1], 10);
  return Number.isFinite(index) && index > 0 ? index : null;
}

function createNextSlotId(existingSlotIds: string[]): string {
  const usedSlotIds = new Set(
    existingSlotIds
      .map((slotId) => getNumberedSlotIndex(slotId))
      .filter((index): index is number => index !== null)
  );

  for (let index = 1; index < 1000; index += 1) {
    if (!usedSlotIds.has(index)) {
      return formatNumberedSlotId(index);
    }
  }

  return `${SAVE_SLOT_ID_PREFIX}${Date.now()}`;
}

function readSaveDataFromStorageKey(storageKey: string): GameSaveData | null {
  const rawSaveData = window.localStorage.getItem(storageKey);

  if (!rawSaveData) {
    return null;
  }

  return JSON.parse(rawSaveData) as GameSaveData;
}

function createPlayerPreview(saveData: GameSaveData | null): GameSavePlayerPreview | null {
  if (!saveData?.player?.appearanceId) {
    return null;
  }

  const movementPresentation = resolvePlayerMovementPresentation(
    saveData.player.status ?? [],
    saveData.player.appearanceId
  );
  const staticPreview = resolvePlayerCharacterStaticPreview(movementPresentation.appearanceId);

  if (!staticPreview) {
    return null;
  }

  return staticPreview;
}

function normalizeSummaryGoldAmount(saveData: GameSaveData | null): number {
  const goldAmount = typeof saveData?.global?.gold === 'number' ? saveData.global.gold : Number(saveData?.global?.gold);

  return Number.isFinite(goldAmount) ? Math.max(0, Math.floor(goldAmount)) : initialGoldAmount;
}

function normalizeSummaryDesireCrystalAmount(saveData: GameSaveData | null): number {
  const desireCrystalAmount = typeof saveData?.global?.desireCrystals === 'number'
    ? saveData.global.desireCrystals
    : Number(saveData?.global?.desireCrystals);

  return Number.isFinite(desireCrystalAmount)
    ? Math.max(0, Math.floor(desireCrystalAmount))
    : initialDesireCrystalAmount;
}

function createSaveFileSummary(slotId: string, saveData: GameSaveData | null): GameSaveFileSummary {
  return {
    slotId,
    savedAt: typeof saveData?.savedAt === 'string' ? saveData.savedAt : null,
    mapId: typeof saveData?.location?.mapId === 'string' ? saveData.location.mapId : null,
    position: saveData?.location?.position
      ? {
          x: saveData.location.position.x,
          y: saveData.location.position.y
        }
      : null,
    playerStatus: Array.isArray(saveData?.player?.status) ? [...saveData.player.status] : [],
    playerRestraints: Array.isArray(saveData?.player?.restraints) ? [...saveData.player.restraints] : [],
    goldAmount: normalizeSummaryGoldAmount(saveData),
    desireCrystalAmount: normalizeSummaryDesireCrystalAmount(saveData),
    playerPreview: createPlayerPreview(saveData)
  };
}

function listSaveStorageKeys(): string[] {
  const storageKeys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);

    if (storageKey?.startsWith(SAVE_STORAGE_KEY_PREFIX)) {
      storageKeys.push(storageKey);
    }
  }

  return storageKeys;
}

function migrateLegacySaveSlotIds(): void {
  const storageKeys = listSaveStorageKeys();
  const occupiedSlotIds = new Set(
    storageKeys
      .map((storageKey) => storageKey.slice(SAVE_STORAGE_KEY_PREFIX.length))
      .filter((slotId) => getNumberedSlotIndex(slotId) === null || slotId === formatNumberedSlotId(getNumberedSlotIndex(slotId) ?? 0))
  );

  storageKeys.forEach((storageKey) => {
    const slotId = storageKey.slice(SAVE_STORAGE_KEY_PREFIX.length);
    const numberedSlotIndex = getNumberedSlotIndex(slotId);
    const canonicalSlotId = numberedSlotIndex === null ? slotId : formatNumberedSlotId(numberedSlotIndex);

    if (slotId === canonicalSlotId) {
      return;
    }

    let targetSlotId = canonicalSlotId;
    let targetIndex = numberedSlotIndex;

    while (occupiedSlotIds.has(targetSlotId)) {
      targetIndex = targetIndex === null ? null : targetIndex + 1;
      targetSlotId = targetIndex === null ? createNextSlotId([...occupiedSlotIds]) : formatNumberedSlotId(targetIndex);
    }

    const rawSaveData = window.localStorage.getItem(storageKey);

    if (rawSaveData === null) {
      return;
    }

    window.localStorage.setItem(getSaveStorageKey(targetSlotId), rawSaveData);
    window.localStorage.removeItem(storageKey);
    occupiedSlotIds.add(targetSlotId);
  });
}

function compactNumberedSaveSlotIds(): void {
  const numberedEntries = listSaveStorageKeys()
    .map((storageKey) => {
      const slotId = storageKey.slice(SAVE_STORAGE_KEY_PREFIX.length);
      const index = getNumberedSlotIndex(slotId);

      return index === null
        ? null
        : {
            index,
            storageKey,
            rawSaveData: window.localStorage.getItem(storageKey)
          };
    })
    .filter((entry): entry is { index: number; storageKey: string; rawSaveData: string | null } => entry !== null)
    .sort((left, right) => left.index - right.index);

  if (numberedEntries.length === 0) {
    return;
  }

  const shouldCompact = numberedEntries.some((entry, entryIndex) => {
    return entry.storageKey.slice(SAVE_STORAGE_KEY_PREFIX.length) !== formatNumberedSlotId(entryIndex + 1);
  });

  if (!shouldCompact) {
    return;
  }

  numberedEntries.forEach((entry) => {
    window.localStorage.removeItem(entry.storageKey);
  });

  numberedEntries.forEach((entry, entryIndex) => {
    if (entry.rawSaveData === null) {
      return;
    }

    window.localStorage.setItem(`${SAVE_STORAGE_KEY_PREFIX}${formatNumberedSlotId(entryIndex + 1)}`, entry.rawSaveData);
  });
}

export function listGameSaveFiles(): GameSaveFileSummary[] {
  const saves: GameSaveFileSummary[] = [];
  migrateLegacySaveSlotIds();
  compactNumberedSaveSlotIds();

  listSaveStorageKeys().forEach((storageKey) => {
    try {
      const saveData = readSaveDataFromStorageKey(storageKey);

      saves.push(createSaveFileSummary(storageKey.slice(SAVE_STORAGE_KEY_PREFIX.length), saveData));
    } catch {
      saves.push(createSaveFileSummary(storageKey.slice(SAVE_STORAGE_KEY_PREFIX.length), null));
    }
  });

  return saves.sort((left, right) => {
    if (left.slotId === AUTO_SAVE_SLOT_ID) {
      return -1;
    }

    if (right.slotId === AUTO_SAVE_SLOT_ID) {
      return 1;
    }

    return left.slotId.localeCompare(right.slotId);
  });
}

export function createNewGameSaveSlotId(): string {
  return createNextSlotId(listGameSaveFiles().map((save) => save.slotId));
}

export function saveGameToFile(saveData: GameSaveData, slotId = createNewGameSaveSlotId()): GameSaveFileSummary {
  const normalizedSlotId = normalizeSlotId(slotId);
  window.localStorage.setItem(getSaveStorageKey(normalizedSlotId), JSON.stringify(saveData));

  return createSaveFileSummary(normalizedSlotId, saveData);
}

export function loadGameFromFile(slotId = 'default'): GameSaveData | null {
  return readSaveDataFromStorageKey(getSaveStorageKey(slotId));
}

export function deleteGameSaveFile(slotId: string): boolean {
  const storageKey = getSaveStorageKey(slotId);
  const hadSave = window.localStorage.getItem(storageKey) !== null;
  window.localStorage.removeItem(storageKey);
  compactNumberedSaveSlotIds();

  return hadSave;
}

export function deleteAllGameSaveFiles(): number {
  const storageKeys = listSaveStorageKeys();

  storageKeys.forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });

  return storageKeys.length;
}

export function createGameSaveExportData(): GameSaveExportData {
  const saves = Object.fromEntries(
    listGameSaveFiles()
      .map((summary) => [summary.slotId, loadGameFromFile(summary.slotId)] as const)
      .filter((entry): entry is [string, GameSaveData] => Boolean(entry[1]))
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    saves
  };
}

export function importGameSaveExportData(exportData: GameSaveExportData): number {
  if (!exportData || exportData.version !== 1 || !exportData.saves) {
    throw new Error('存档 JSON 格式不正确。');
  }

  const parsedSaves = Object.entries(exportData.saves).map(([slotId, saveData]) => {
    const parsedSaveData = parseGameSaveData(saveData);

    if (!parsedSaveData) {
      throw new Error(`存档 ${slotId} 无法读取。`);
    }

    return [slotId, parsedSaveData] as const;
  });

  listGameSaveFiles().forEach((summary) => {
    window.localStorage.removeItem(getSaveStorageKey(summary.slotId));
  });

  parsedSaves.forEach(([slotId, saveData]) => {
    saveGameToFile(saveData, slotId);
  });

  return parsedSaves.length;
}

export function exportAllGameSavesToLocalFile(): boolean {
  const exportData = createGameSaveExportData();
  const blob = new Blob([`${JSON.stringify(exportData, null, 2)}\n`], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = SAVE_EXPORT_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
