import * as Phaser from 'phaser';
import {
  playerCharacterDefinition,
  resolveCharacterWalkAnimationTimeScale,
  resolveCharacterWalkSpeedPerSecond,
  type GameCharacterDefinition,
  type CharacterFacingDirection
} from '../../data/playerCharacter';
import type { createCollisionRuntime } from '../map/collision';
import { findTilePath } from '../map/pathfinding';
import {
  clearPlayerPathPreview,
  renderPlayerPathPreview
} from './playerPathPreviewRenderer';
import type { PlayerVisionPresentation } from '../../data/playerMovementPresentationRules';
import {
  clampWorldPointToVisionRadius,
  getTilePositionFromWorldPoint,
  isTileWithinVisionRadius,
  type AutoPathVisionLimit
} from './autoPathVision';

type TilePosition = {
  tileX: number;
  tileY: number;
};

type AutoMoveTarget = TilePosition & {
  x: number;
  y: number;
};

type PlayerMovementState = {
  isMoving: boolean;
  direction: CharacterFacingDirection;
};

type CollisionRuntime = ReturnType<typeof createCollisionRuntime>;

const AUTO_PATH_CANCEL_KEY_CODES = new Set<number>([
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.DOWN
]);

export function createPlayerController(options: {
  scene: Phaser.Scene;
  player: Phaser.GameObjects.Sprite;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  collisionRuntime: CollisionRuntime;
  tileSize: number;
  mapWidth: number;
  mapHeight: number;
  moveSpeed: number;
  manualEventTileKeys: ReadonlySet<string>;
  autoPathGraphics?: Phaser.GameObjects.Graphics | null;
  initialDirection?: CharacterFacingDirection;
  isInputBlocked?: () => boolean;
  getCharacterDefinition?: () => GameCharacterDefinition;
  getVisionPresentation?: () => PlayerVisionPresentation;
}) {
  const {
    scene,
    player,
    cursors,
    collisionRuntime,
    tileSize,
    mapWidth,
    mapHeight,
    moveSpeed,
    manualEventTileKeys,
    autoPathGraphics,
    isInputBlocked
  } = options;
  const getCharacterDefinition = options.getCharacterDefinition ?? (() => playerCharacterDefinition);
  const getVisionPresentation = options.getVisionPresentation;
  const initialDirection = options.initialDirection ?? getCharacterDefinition().defaultDirection;

  let currentDirection: CharacterFacingDirection = initialDirection;
  let autoPath: TilePosition[] = [];
  let autoMoveTarget: AutoMoveTarget | null = null;
  let lastMovementState: PlayerMovementState = {
    isMoving: false,
    direction: initialDirection
  };

  const refreshAutoPathGraphics = (): void => {
    renderPlayerPathPreview(autoPathGraphics, {
      playerPosition: {
        x: player.x,
        y: player.y
      },
      autoPath,
      getTileCenterWorldPosition: (tileX, tileY) =>
        collisionRuntime.getTileCenterWorldPosition(tileX, tileY)
    });
  };

  const clearAutoPath = (): void => {
    autoPath = [];
    autoMoveTarget = null;
    clearPlayerPathPreview(autoPathGraphics);
  };

  const handleDirectionalKeyDown = (event: KeyboardEvent): void => {
    if (isInputBlocked?.() || !AUTO_PATH_CANCEL_KEY_CODES.has(event.keyCode)) {
      return;
    }

    clearAutoPath();
  };

  scene.input.keyboard?.on('keydown', handleDirectionalKeyDown);

  const moveTowards = (current: number, target: number, maxDelta: number): number => {
    const delta = target - current;

    if (Math.abs(delta) <= maxDelta) {
      return target;
    }

    return current + Math.sign(delta) * maxDelta;
  };

  const getEffectiveMoveSpeed = (
    direction: CharacterFacingDirection = currentDirection,
    delta: number = 1000 / 60
  ): number => {
    const characterDefinition = getCharacterDefinition();

    if (!characterDefinition.canMove) {
      return 0;
    }

    const baseMoveSpeed = characterDefinition.defaultMoveSpeed;
    const movementSpeedMultiplier = characterDefinition.movementSpeedMultiplier;

    const walkSpeedPerSecond = resolveCharacterWalkSpeedPerSecond(
      characterDefinition,
      direction,
      tileSize
    );
    const resolvedMoveSpeed = walkSpeedPerSecond !== null
      ? walkSpeedPerSecond * delta / 1000
      : Number.isFinite(baseMoveSpeed) && baseMoveSpeed > 0
      ? baseMoveSpeed
      : moveSpeed;

    if (!Number.isFinite(movementSpeedMultiplier) || movementSpeedMultiplier < 0) {
      return resolvedMoveSpeed;
    }

    return resolvedMoveSpeed * movementSpeedMultiplier;
  };

  const getPlayerTilePosition = (): TilePosition => {
    return {
      tileX: Math.floor(player.x / tileSize),
      tileY: Math.floor(player.y / tileSize)
    };
  };

  const getAutoPathVisionLimit = (): AutoPathVisionLimit => {
    const blindMask = getVisionPresentation?.().blindMask;

    if (!blindMask?.enabled) {
      return { enabled: false, radiusInTiles: Number.POSITIVE_INFINITY };
    }

    return {
      enabled: true,
      radiusInTiles: blindMask.radiusInTiles
    };
  };

  const isManualMovementInputActive = (): boolean => {
    return Boolean(
      cursors.left.isDown ||
      cursors.right.isDown ||
      cursors.up.isDown ||
      cursors.down.isDown
    );
  };

  const updateCharacterAnimation = (
    isMoving: boolean,
    direction: CharacterFacingDirection
  ): void => {
    currentDirection = direction;

    const characterDefinition = getCharacterDefinition();

    if (!scene.textures.exists(characterDefinition.textureKey)) {
      return;
    }

    player.anims.timeScale = isMoving
      ? resolveCharacterWalkAnimationTimeScale(characterDefinition)
      : 1;

    const currentAnimKey = player.anims.currentAnim?.key || '';
    const targetAnimKey = characterDefinition.getAnimationKey(
      isMoving ? 'walk' : 'idle',
      direction
    );

    if (currentAnimKey !== targetAnimKey) {
      player.anims.play(targetAnimKey, true);
    }
  };

  const updateManualMovement = (delta: number): PlayerMovementState => {
    let newX = player.x;
    let newY = player.y;
    let isMoving = false;
    let direction = currentDirection;
    let horizontalDirection = 0;
    let verticalDirection = 0;

    if (cursors.left.isDown) {
      horizontalDirection = -1;
      direction = 'left';
      isMoving = true;
    } else if (cursors.right.isDown) {
      horizontalDirection = 1;
      direction = 'right';
      isMoving = true;
    }

    if (cursors.up.isDown) {
      verticalDirection = -1;
      direction = 'up';
      isMoving = true;
    } else if (cursors.down.isDown) {
      verticalDirection = 1;
      direction = 'down';
      isMoving = true;
    }

    const effectiveMoveSpeed = getEffectiveMoveSpeed(direction, delta);

    if (effectiveMoveSpeed <= 0) {
      return { isMoving: false, direction };
    }

    newX += horizontalDirection * effectiveMoveSpeed;
    newY += verticalDirection * effectiveMoveSpeed;

    if ((newX !== player.x || newY !== player.y) && !collisionRuntime.checkCollision(newX, newY)) {
      player.x = newX;
      player.y = newY;
    }

    return { isMoving, direction };
  };

  const updateAutoMovement = (delta: number): PlayerMovementState => {
    const effectiveMoveSpeed = getEffectiveMoveSpeed(currentDirection, delta);

    if (effectiveMoveSpeed <= 0) {
      clearAutoPath();
      return { isMoving: false, direction: currentDirection };
    }

    if (!autoMoveTarget && autoPath.length > 0) {
      const nextTile = autoPath[0];
      const worldPosition = collisionRuntime.getTileCenterWorldPosition(nextTile.tileX, nextTile.tileY);

      autoMoveTarget = {
        tileX: nextTile.tileX,
        tileY: nextTile.tileY,
        x: worldPosition.x,
        y: worldPosition.y
      };
    }

    if (!autoMoveTarget) {
      return { isMoving: false, direction: currentDirection };
    }

    const target = autoMoveTarget;
    const deltaX = target.x - player.x;
    const deltaY = target.y - player.y;

    if (Math.abs(deltaX) <= 0.5 && Math.abs(deltaY) <= 0.5) {
      player.setPosition(target.x, target.y);
      autoPath.shift();
      autoMoveTarget = null;
      return {
        isMoving: autoPath.length > 0,
        direction: currentDirection
      };
    }

    let nextX = player.x;
    let nextY = player.y;
    let direction = currentDirection;

    if (Math.abs(deltaX) > 0.5) {
      direction = deltaX > 0 ? 'right' : 'left';
      nextX = moveTowards(player.x, target.x, getEffectiveMoveSpeed(direction, delta));
    } else if (Math.abs(deltaY) > 0.5) {
      direction = deltaY > 0 ? 'down' : 'up';
      nextY = moveTowards(player.y, target.y, getEffectiveMoveSpeed(direction, delta));
    }

    if (collisionRuntime.checkCollision(nextX, nextY)) {
      clearAutoPath();
      return { isMoving: false, direction: currentDirection };
    }

    player.setPosition(nextX, nextY);

    if (Math.abs(target.x - player.x) <= 0.5 && Math.abs(target.y - player.y) <= 0.5) {
      player.setPosition(target.x, target.y);
      autoPath.shift();
      autoMoveTarget = null;
    }

    return { isMoving: true, direction };
  };

  const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (isInputBlocked?.() || pointer.button !== 0 || !getCharacterDefinition().canMove) {
      return;
    }

    const worldPoint = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
    const startWorldPosition = { x: player.x, y: player.y };
    const visionLimit = getAutoPathVisionLimit();
    const visibleTargetWorldPoint = clampWorldPointToVisionRadius({
      startWorldPosition,
      targetWorldPosition: worldPoint,
      tileSize,
      visionLimit
    });
    const { tileX: targetTileX, tileY: targetTileY } = getTilePositionFromWorldPoint(
      visibleTargetWorldPoint,
      tileSize
    );
    const { tileX: startTileX, tileY: startTileY } = getPlayerTilePosition();
    const path = findTilePath(startTileX, startTileY, targetTileX, targetTileY, {
      mapWidth,
      mapHeight,
      collisionRuntime,
      eventTileKeys: manualEventTileKeys,
      isTileAllowed: (tileX, tileY) =>
        isTileWithinVisionRadius({
          tilePosition: { tileX, tileY },
          startWorldPosition,
          tileSize,
          visionLimit
        })
    });

    if (path.length === 0) {
      clearAutoPath();
      return;
    }

    autoPath = path;
    autoMoveTarget = null;
    refreshAutoPathGraphics();
  };

  const update = (delta: number = 1000 / 60): void => {
    if (isInputBlocked?.()) {
      lastMovementState = {
        isMoving: false,
        direction: currentDirection
      };
      updateCharacterAnimation(false, currentDirection);
      refreshAutoPathGraphics();
      return;
    }

    let isMoving = false;
    let direction = currentDirection;

    if (isManualMovementInputActive()) {
      clearAutoPath();
      const manualMovementState = updateManualMovement(delta);
      isMoving = manualMovementState.isMoving;
      direction = manualMovementState.direction;
    } else {
      const autoMovementState = updateAutoMovement(delta);
      isMoving = autoMovementState.isMoving;
      direction = autoMovementState.direction;
    }

    lastMovementState = {
      isMoving,
      direction
    };
    updateCharacterAnimation(isMoving, direction);
    refreshAutoPathGraphics();
  };

  return {
    update,
    handlePointerDown,
    clearAutoPath,
    destroy: () => {
      scene.input.keyboard?.off('keydown', handleDirectionalKeyDown);
    },
    refreshAnimation: (isMoving = false) => {
      lastMovementState = {
        isMoving,
        direction: currentDirection
      };
      updateCharacterAnimation(isMoving, currentDirection);
    },
    getPlayerTilePosition,
    getCurrentDirection: (): CharacterFacingDirection => currentDirection,
    getMovementState: (): PlayerMovementState => ({ ...lastMovementState })
  };
}
