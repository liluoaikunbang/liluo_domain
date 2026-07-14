import { reactive, readonly } from 'vue';
import {
  globalDialoguePortraits,
  type DialoguePortraitData
} from '../data/dialoguePortraits.ts';
import {
  defaultPlayerAppearanceId,
  getPlayerCharacterDefinition,
  type GameCharacterDefinition,
  type PlayerCharacterAppearanceId
} from '../data/playerCharacter.ts';
import {
  resolvePlayerMovementPresentation,
  resolvePlayerVisionPresentation,
  type PlayerVisionPresentation
} from '../data/playerMovementPresentationRules.ts';
import {
  defaultPlayerStatusLabel,
  normalizePlayerStatusList,
  resolvePlayerStatusLabels
} from '../data/playerStatus.ts';

export interface PlayerRuntimeState {
  appearanceId: PlayerCharacterAppearanceId;
  portraitKey: string;
  status: string[];
  restraints: string[];
  inventory: Record<string, number>;
  equipment: Record<string, string>;
}

export interface PlayerRuntimePatch {
  appearanceId?: string;
  portraitKey?: string;
  status?: ReadonlyArray<string>;
  restraints?: ReadonlyArray<string>;
  inventory?: Record<string, number>;
  equipment?: Record<string, string>;
}

export const defaultPlayerPortraitKey = globalDialoguePortraits.liLuoDefault.key;

function createDefaultPlayerRuntimeState(): PlayerRuntimeState {
  return {
    appearanceId: defaultPlayerAppearanceId,
    portraitKey: defaultPlayerPortraitKey,
    status: [],
    restraints: [],
    inventory: {},
    equipment: {}
  };
}

function normalizeStringList(list: ReadonlyArray<string>): string[] {
  return list.map((item) => item.trim()).filter(Boolean);
}

function normalizeInventory(inventory: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(inventory)
      .filter(([itemId, amount]) => itemId.trim() && Number.isFinite(amount) && amount > 0)
      .map(([itemId, amount]) => [itemId.trim(), Math.floor(amount)])
  );
}

function normalizeEquipment(equipment: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(equipment)
      .map(([slotId, itemId]) => [slotId.trim(), itemId.trim()])
      .filter(([slotId, itemId]) => slotId && itemId)
  );
}

const playerRuntimeState = reactive<PlayerRuntimeState>(createDefaultPlayerRuntimeState());

export function getPlayerRuntimeState(): Readonly<PlayerRuntimeState> {
  return readonly(playerRuntimeState) as Readonly<PlayerRuntimeState>;
}

export function getMutablePlayerRuntimeState(): PlayerRuntimeState {
  return playerRuntimeState;
}

export function getPlayerAppearanceId(): PlayerCharacterAppearanceId {
  return playerRuntimeState.appearanceId;
}

export function setPlayerAppearance(appearanceId: string): PlayerCharacterAppearanceId | null {
  const definition = getPlayerCharacterDefinition(appearanceId);

  if (!definition) {
    return null;
  }

  playerRuntimeState.appearanceId = definition.appearanceId as PlayerCharacterAppearanceId;
  return playerRuntimeState.appearanceId;
}

export function getPlayerPortraitKey(): string {
  return playerRuntimeState.portraitKey;
}

export function setPlayerPortrait(portraitKey: string): string | null {
  const portrait = Object.values(globalDialoguePortraits).find((candidate) => candidate.key === portraitKey);

  if (!portrait) {
    return null;
  }

  playerRuntimeState.portraitKey = portrait.key;
  return playerRuntimeState.portraitKey;
}

export function getPlayerStatusList(): string[] {
  return [...playerRuntimeState.status];
}

export function setPlayerStatus(statusList: ReadonlyArray<string>): string[] {
  playerRuntimeState.status = normalizePlayerStatusList(statusList);
  return [...playerRuntimeState.status];
}

export function getPlayerRestraintsList(): string[] {
  return [...playerRuntimeState.restraints];
}

export function setPlayerRestraints(restraintsList: ReadonlyArray<string>): string[] {
  playerRuntimeState.restraints = normalizeStringList(restraintsList);
  return [...playerRuntimeState.restraints];
}

export function setPlayerInventory(inventory: Record<string, number>): Record<string, number> {
  playerRuntimeState.inventory = normalizeInventory(inventory);
  return { ...playerRuntimeState.inventory };
}

export function setPlayerEquipment(equipment: Record<string, string>): Record<string, string> {
  playerRuntimeState.equipment = normalizeEquipment(equipment);
  return { ...playerRuntimeState.equipment };
}

export function applyPlayerRuntimePatch(patch: PlayerRuntimePatch): boolean {
  let didApply = false;

  if (typeof patch.appearanceId === 'string') {
    didApply = setPlayerAppearance(patch.appearanceId) !== null || didApply;
  }

  if (typeof patch.portraitKey === 'string') {
    didApply = setPlayerPortrait(patch.portraitKey) !== null || didApply;
  }

  if (patch.status) {
    setPlayerStatus(patch.status);
    didApply = true;
  }

  if (patch.restraints) {
    setPlayerRestraints(patch.restraints);
    didApply = true;
  }

  if (patch.inventory) {
    setPlayerInventory(patch.inventory);
    didApply = true;
  }

  if (patch.equipment) {
    setPlayerEquipment(patch.equipment);
    didApply = true;
  }

  return didApply;
}

export function resetPlayerRuntimeState(): PlayerRuntimeState {
  const defaults = createDefaultPlayerRuntimeState();
  playerRuntimeState.appearanceId = defaults.appearanceId;
  playerRuntimeState.portraitKey = defaults.portraitKey;
  playerRuntimeState.status = defaults.status;
  playerRuntimeState.restraints = defaults.restraints;
  playerRuntimeState.inventory = defaults.inventory;
  playerRuntimeState.equipment = defaults.equipment;
  return playerRuntimeState;
}

export function resolvePlayerRuntimePortrait(): DialoguePortraitData {
  return Object.values(globalDialoguePortraits).find(
    (portrait) => portrait.key === playerRuntimeState.portraitKey
  ) ?? globalDialoguePortraits.liLuoDefault;
}

export function resolvePlayerRuntimeStatusLabel(): string {
  const statusLabels = resolvePlayerStatusLabels(playerRuntimeState.status);

  if (statusLabels.length > 0) {
    return statusLabels.join(' / ');
  }

  return defaultPlayerStatusLabel;
}

export function resolvePlayerRuntimeCharacterDefinition(): GameCharacterDefinition {
  const movementPresentation = resolvePlayerMovementPresentation(
    playerRuntimeState.status,
    playerRuntimeState.appearanceId
  );
  const characterDefinition = getPlayerCharacterDefinition(movementPresentation.appearanceId)
    ?? getPlayerCharacterDefinition(defaultPlayerAppearanceId)!;

  return {
    ...characterDefinition,
    movementStyle: movementPresentation.movementStyle,
    movementSpeedMultiplier: movementPresentation.movementSpeedMultiplier,
    canMove: movementPresentation.canMove,
    hopAmplitude: movementPresentation.hopAmplitude,
    hopSpeed: movementPresentation.hopSpeed
  };
}

export function resolvePlayerRuntimeVisionPresentation(): PlayerVisionPresentation {
  return resolvePlayerVisionPresentation(playerRuntimeState.status);
}
