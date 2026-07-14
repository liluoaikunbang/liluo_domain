import {
  defaultPlayerAppearanceId,
  type CharacterMovementStyle,
  type PlayerCharacterAppearanceId
} from './playerCharacter.ts';
import { normalizePlayerStatusList } from './playerStatus.ts';

export interface PlayerMovementPresentation {
  appearanceId: PlayerCharacterAppearanceId;
  movementStyle: CharacterMovementStyle;
  movementSpeedMultiplier: number;
  canMove: boolean;
  hopAmplitude: number;
  hopSpeed: number;
}

export interface PlayerVisionPresentation {
  blindMask: {
    enabled: boolean;
    radiusInTiles: number;
    edgeFadeInTiles: number;
    overlayAlpha: number;
  };
}

interface PlayerStatusMovementRule {
  statusId: string;
  speedReduction?: number;
  appearanceId?: PlayerCharacterAppearanceId;
  appearancePriority?: number;
  movementStyle?: CharacterMovementStyle;
  canMove?: boolean;
  hopAmplitude?: number;
  hopSpeed?: number;
}

const DEFAULT_PLAYER_MOVEMENT_PRESENTATION = {
  movementStyle: 'normal',
  movementSpeedMultiplier: 1,
  canMove: true,
  hopAmplitude: 0,
  hopSpeed: 0
} as const satisfies Omit<PlayerMovementPresentation, 'appearanceId'>;

const DEFAULT_PLAYER_VISION_PRESENTATION = {
  blindMask: {
    enabled: false,
    radiusInTiles: 2,
    edgeFadeInTiles: 1,
    overlayAlpha: 0.9
  }
} as const satisfies PlayerVisionPresentation;

const playerStatusMovementRules = [
  {
    statusId: 'no_shoes',
    speedReduction: 0.1
  },
  {
    statusId: 'barefoot',
    speedReduction: 0.05
  },
  {
    statusId: 'hands_bound',
    speedReduction: 0.05,
    appearanceId: 'bondage',
    appearancePriority: 20
  },
  {
    statusId: 'legs_bound',
    speedReduction: 0.5,
    appearanceId: 'legs_bound',
    appearancePriority: 30,
    movementStyle: 'hop',
    hopAmplitude: 18,
    hopSpeed: 0.02
  },
  {
    statusId: 'confined',
    appearanceId: 'full_body_bondage',
    appearancePriority: 40,
    movementStyle: 'normal',
    canMove: false
  }
] as const satisfies readonly PlayerStatusMovementRule[];

const playerStatusMovementRulesByStatusId = new Map(
  playerStatusMovementRules.map((rule) => [rule.statusId, rule])
);

function normalizeMovementSpeedMultiplier(multiplier: number): number {
  return Number(multiplier.toFixed(4));
}

function resolveHighestPriorityAppearanceRule(
  statusIds: ReadonlyArray<string>
): PlayerStatusMovementRule | null {
  return statusIds.reduce<PlayerStatusMovementRule | null>((selectedRule, statusId) => {
    const candidateRule = playerStatusMovementRulesByStatusId.get(statusId);

    if (!candidateRule?.appearanceId) {
      return selectedRule;
    }

    if (!selectedRule) {
      return candidateRule;
    }

    return (candidateRule.appearancePriority ?? 0) > (selectedRule.appearancePriority ?? 0)
      ? candidateRule
      : selectedRule;
  }, null);
}

function resolveStatusAppearanceId(
  statusIds: ReadonlyArray<string>,
  baseAppearanceId: PlayerCharacterAppearanceId
): PlayerCharacterAppearanceId {
  const hasHandsBound = statusIds.includes('hands_bound');
  const hasLegsBound = statusIds.includes('legs_bound');
  const hasConfined = statusIds.includes('confined');

  if (hasConfined) {
    return 'full_body_bondage';
  }

  if (hasHandsBound && hasLegsBound) {
    return 'bondage_legs_bound';
  }

  if (hasLegsBound) {
    return 'legs_bound';
  }

  if (hasHandsBound) {
    return 'bondage';
  }

  return baseAppearanceId;
}

export function resolvePlayerMovementPresentation(
  statusList: ReadonlyArray<string>,
  baseAppearanceId: PlayerCharacterAppearanceId = defaultPlayerAppearanceId
): PlayerMovementPresentation {
  const statusIds = normalizePlayerStatusList(statusList);
  const appearanceRule = resolveHighestPriorityAppearanceRule(statusIds);
  const appearanceId = resolveStatusAppearanceId(statusIds, baseAppearanceId);
  const totalSpeedReduction = statusIds.reduce((sum, statusId) => {
    const reduction = playerStatusMovementRulesByStatusId.get(statusId)?.speedReduction ?? 0;
    return sum + reduction;
  }, 0);

  const canMove = appearanceRule?.canMove ?? DEFAULT_PLAYER_MOVEMENT_PRESENTATION.canMove;

  return {
    appearanceId,
    movementStyle: appearanceRule?.movementStyle ?? DEFAULT_PLAYER_MOVEMENT_PRESENTATION.movementStyle,
    movementSpeedMultiplier: canMove
      ? normalizeMovementSpeedMultiplier(Math.max(
        0,
        DEFAULT_PLAYER_MOVEMENT_PRESENTATION.movementSpeedMultiplier - totalSpeedReduction
      ))
      : 0,
    canMove,
    hopAmplitude: appearanceRule?.hopAmplitude ?? DEFAULT_PLAYER_MOVEMENT_PRESENTATION.hopAmplitude,
    hopSpeed: appearanceRule?.hopSpeed ?? DEFAULT_PLAYER_MOVEMENT_PRESENTATION.hopSpeed
  };
}

export function resolvePlayerVisionPresentation(statusList: ReadonlyArray<string>): PlayerVisionPresentation {
  const statusIds = normalizePlayerStatusList(statusList);
  const isBlind = statusIds.includes('blind');

  return {
    blindMask: {
      ...DEFAULT_PLAYER_VISION_PRESENTATION.blindMask,
      enabled: isBlind
    }
  };
}
