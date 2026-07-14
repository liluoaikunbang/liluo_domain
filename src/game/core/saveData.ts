import {
  applyPlayerRuntimePatch,
  getPlayerRuntimeState,
  type PlayerRuntimePatch,
  type PlayerRuntimeState
} from './playerRuntime.ts';
import {
  applyGameRuntimePatch,
  getGameRuntimeState,
  initialDesireCrystalAmount,
  initialGoldAmount,
  type GameRuntimePatch,
  type GameRuntimeState
} from './gameRuntime.ts';
import { getPlayerCharacterDefinition } from '../data/playerCharacter.ts';
import { normalizePlayerStatusList } from '../data/playerStatus.ts';

export interface WorldPosition {
  x: number;
  y: number;
}

export interface MapSessionSaveState {
  mapId: string;
  flags: Record<string, boolean>;
}

export interface GameSaveData {
  version: 1;
  savedAt: string;
  global: GameRuntimeState;
  player: PlayerRuntimeState;
  location: {
    mapId: string;
    position: WorldPosition;
  };
  mapSession: MapSessionSaveState;
}

export interface CreateGameSaveDataOptions {
  mapId: string;
  position: WorldPosition;
  mapSession: MapSessionSaveState;
  savedAt?: string;
  global?: Readonly<GameRuntimeState>;
  player?: Readonly<PlayerRuntimeState>;
}

function normalizeRecord<T>(
  value: unknown,
  normalizeEntry: (entry: [string, unknown]) => [string, T] | null
): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(normalizeEntry)
      .filter((entry): entry is [string, T] => entry !== null)
  );
}

function normalizePlayerRuntimeState(player: Partial<PlayerRuntimeState> | null | undefined): PlayerRuntimeState {
  return {
    appearanceId: player?.appearanceId ?? '',
    portraitKey: player?.portraitKey ?? '',
    status: normalizePlayerStatusList(
      Array.isArray(player?.status)
        ? player.status.filter((item): item is string => typeof item === 'string')
        : []
    ),
    restraints: Array.isArray(player?.restraints)
      ? player.restraints
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    inventory: normalizeRecord<number>(player?.inventory, ([itemId, amount]) => {
      const normalizedAmount = typeof amount === 'number' ? amount : Number(amount);

      if (!itemId.trim() || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return null;
      }

      return [itemId.trim(), Math.floor(normalizedAmount)];
    }),
    equipment: normalizeRecord<string>(player?.equipment, ([slotId, itemId]) => {
      const normalizedItemId = typeof itemId === 'string' ? itemId.trim() : '';

      if (!slotId.trim() || !normalizedItemId) {
        return null;
      }

      return [slotId.trim(), normalizedItemId];
    })
  };
}

function normalizeGameRuntimeState(global: Partial<GameRuntimeState> | null | undefined): GameRuntimeState {
  const gold = typeof global?.gold === 'number' ? global.gold : Number(global?.gold);
  const desireCrystals = typeof global?.desireCrystals === 'number'
    ? global.desireCrystals
    : Number(global?.desireCrystals);

  return {
    gold: Number.isFinite(gold) ? Math.max(0, Math.floor(gold)) : initialGoldAmount,
    desireCrystals: Number.isFinite(desireCrystals)
      ? Math.max(0, Math.floor(desireCrystals))
      : initialDesireCrystalAmount
  };
}

function normalizeBooleanFlags(flags: Record<string, unknown>): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(flags)
      .filter(([flagId]) => flagId.trim())
      .map(([flagId, value]) => [flagId.trim(), Boolean(value)])
  );
}

function isFinitePosition(position: WorldPosition): boolean {
  return Number.isFinite(position.x) && Number.isFinite(position.y);
}

export function createGameSaveData(options: CreateGameSaveDataOptions): GameSaveData {
  const global = normalizeGameRuntimeState(options.global ?? getGameRuntimeState());
  const player = normalizePlayerRuntimeState(options.player ?? getPlayerRuntimeState());
  const mapSessionMapId = options.mapSession.mapId || options.mapId;

  return {
    version: 1,
    savedAt: options.savedAt ?? new Date().toISOString(),
    global,
    player,
    location: {
      mapId: options.mapId,
      position: {
        x: options.position.x,
        y: options.position.y
      }
    },
    mapSession: {
      mapId: mapSessionMapId,
      flags: normalizeBooleanFlags(options.mapSession.flags)
    }
  };
}

export function parseGameSaveData(rawSaveData: unknown): GameSaveData | null {
  const saveData = rawSaveData as Partial<GameSaveData> | null;

  if (!saveData || saveData.version !== 1) {
    return null;
  }

  if (!saveData.location?.mapId) {
    return null;
  }

  if (!saveData.location.position || !isFinitePosition(saveData.location.position)) {
    return null;
  }

  if (!saveData.player) {
    return null;
  }

  if (!getPlayerCharacterDefinition(saveData.player.appearanceId)) {
    return null;
  }

  if (typeof saveData.player.portraitKey !== 'string' || !saveData.player.portraitKey.trim()) {
    return null;
  }

  return createGameSaveData({
    mapId: saveData.location.mapId,
    position: saveData.location.position,
    mapSession: {
      mapId: saveData.mapSession?.mapId ?? saveData.location.mapId,
      flags: saveData.mapSession?.flags ?? {}
    },
    savedAt: typeof saveData.savedAt === 'string' ? saveData.savedAt : new Date().toISOString(),
    global: saveData.global ?? { gold: initialGoldAmount, desireCrystals: initialDesireCrystalAmount },
    player: saveData.player
  });
}

export function applyGameSaveData(saveData: GameSaveData): boolean {
  const parsedSaveData = parseGameSaveData(saveData);

  if (!parsedSaveData) {
    return false;
  }

  const playerPatch: PlayerRuntimePatch = {
    appearanceId: parsedSaveData.player.appearanceId,
    portraitKey: parsedSaveData.player.portraitKey,
    status: parsedSaveData.player.status,
    restraints: parsedSaveData.player.restraints,
    inventory: parsedSaveData.player.inventory,
    equipment: parsedSaveData.player.equipment
  };
  const gamePatch: GameRuntimePatch = {
    gold: parsedSaveData.global.gold,
    desireCrystals: parsedSaveData.global.desireCrystals
  };

  applyPlayerRuntimePatch(playerPatch);
  applyGameRuntimePatch(gamePatch);
  return true;
}
