import * as Phaser from 'phaser';
import { getMapRegistryEntry, type GameMapWorldHintConfig } from '../../../data/registry';
import { getNonEmptyTilePositionsForLayer } from '../runtimeMapNormalizer';

type HintPlacement = {
  x: number;
  y: number;
};

const DEFAULT_HINT_DEPTH = 120;
const DEFAULT_HINT_OFFSET_Y = -30;

function getHintPlacement(mapData: any, hint: GameMapWorldHintConfig, tileSize: number): HintPlacement | null {
  const tilePositions = getNonEmptyTilePositionsForLayer(mapData, hint.layerName);

  if (tilePositions.length === 0) {
    return null;
  }

  const minTileX = Math.min(...tilePositions.map((position) => position.tileX));
  const maxTileX = Math.max(...tilePositions.map((position) => position.tileX));
  const minTileY = Math.min(...tilePositions.map((position) => position.tileY));

  return {
    x:
      ((minTileX + maxTileX + 1) / 2 + (hint.offsetPercentX ?? 0) / 100) * tileSize
      + (hint.offsetX ?? 0),
    y: minTileY * tileSize + (hint.offsetY ?? DEFAULT_HINT_OFFSET_Y)
  };
}

function drawHintCloud(scene: Phaser.Scene, icon: string): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const shadow = scene.add.graphics();
  const bubble = scene.add.graphics();

  shadow.fillStyle(0x2d2433, 0.32);
  shadow.fillRoundedRect(-15, -9, 30, 19, 5);
  shadow.fillTriangle(-4, 9, 4, 9, 0, 14);

  bubble.lineStyle(2, 0x6b4a33, 1);
  bubble.fillStyle(0xfff6d6, 1);
  bubble.fillRoundedRect(-16, -11, 32, 21, 5);
  bubble.strokeRoundedRect(-16, -11, 32, 21, 5);

  bubble.lineStyle(2, 0x6b4a33, 1);
  bubble.fillStyle(0xfff6d6, 1);
  bubble.fillTriangle(-5, 9, 5, 9, 0, 15);
  bubble.lineBetween(-5, 9, 0, 15);
  bubble.lineBetween(5, 9, 0, 15);

  bubble.fillStyle(0xfffff2, 1);
  bubble.fillRect(-13, -8, 26, 2);

  const iconText = scene.add
    .text(0, -1, icon, {
      fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", sans-serif',
      fontSize: '15px',
      color: '#28384f',
      align: 'center',
      resolution: 2
    })
    .setOrigin(0.5);

  container.add([shadow, bubble, iconText]);
  return container;
}

export function renderWorldHints(scene: Phaser.Scene, mapData: any, mapId: string): void {
  const hints = getMapRegistryEntry(mapId)?.worldHints ?? [];
  const tileSize = mapData.tilewidth ?? mapData.tileheight ?? 32;

  hints.forEach((hint) => {
    const placement = getHintPlacement(mapData, hint, tileSize);

    if (!placement) {
      console.warn(`[WorldHintRenderer] 未找到提示 ${hint.id} 对应的图层 ${hint.layerName}。`);
      return;
    }

    const cloud = drawHintCloud(scene, hint.icon);
    cloud.setPosition(placement.x, placement.y);
    cloud.setDepth(hint.depth ?? DEFAULT_HINT_DEPTH);

    scene.tweens.add({
      targets: cloud,
      y: placement.y - 2,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  });
}
