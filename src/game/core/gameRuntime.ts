import { reactive, readonly } from 'vue';

export interface GameRuntimeState {
  gold: number;
  desireCrystals: number;
}

export interface GameRuntimePatch {
  gold?: number;
  desireCrystals?: number;
}

export const initialGoldAmount = 100;
export const initialDesireCrystalAmount = 0;

function createDefaultGameRuntimeState(): GameRuntimeState {
  return {
    gold: initialGoldAmount,
    desireCrystals: initialDesireCrystalAmount
  };
}

function normalizeResourceAmount(amount: number, fallbackAmount: number): number {
  if (!Number.isFinite(amount)) {
    return fallbackAmount;
  }

  return Math.max(0, Math.floor(amount));
}

function normalizeGoldAmount(gold: number): number {
  return normalizeResourceAmount(gold, initialGoldAmount);
}

function normalizeDesireCrystalAmount(desireCrystals: number): number {
  return normalizeResourceAmount(desireCrystals, initialDesireCrystalAmount);
}

const gameRuntimeState = reactive<GameRuntimeState>(createDefaultGameRuntimeState());

export function getGameRuntimeState(): Readonly<GameRuntimeState> {
  return readonly(gameRuntimeState) as Readonly<GameRuntimeState>;
}

export function getMutableGameRuntimeState(): GameRuntimeState {
  return gameRuntimeState;
}

export function setGoldAmount(gold: number): number {
  gameRuntimeState.gold = normalizeGoldAmount(gold);
  return gameRuntimeState.gold;
}

export function setDesireCrystalAmount(desireCrystals: number): number {
  gameRuntimeState.desireCrystals = normalizeDesireCrystalAmount(desireCrystals);
  return gameRuntimeState.desireCrystals;
}

export function applyGameRuntimePatch(patch: GameRuntimePatch): boolean {
  if (typeof patch.gold !== 'number' && typeof patch.desireCrystals !== 'number') {
    return false;
  }

  if (typeof patch.gold === 'number') {
    setGoldAmount(patch.gold);
  }

  if (typeof patch.desireCrystals === 'number') {
    setDesireCrystalAmount(patch.desireCrystals);
  }

  return true;
}

export function resetGameRuntimeState(): GameRuntimeState {
  const defaults = createDefaultGameRuntimeState();
  gameRuntimeState.gold = defaults.gold;
  gameRuntimeState.desireCrystals = defaults.desireCrystals;
  return gameRuntimeState;
}
