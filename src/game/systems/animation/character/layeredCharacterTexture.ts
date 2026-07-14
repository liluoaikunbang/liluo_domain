import type * as Phaser from 'phaser';

export interface CharacterFrameLayerDefinition {
  sourceTextureKeyPrefix: string;
  mode: 'overlay' | 'clear-base-side-pixels-within-layer-height';
  offsetY?: number;
}

export interface CharacterLayeredFrameDefinition {
  outputTextureKey: string;
  baseTextureKey: string;
  frameName: string;
  layers: CharacterFrameLayerDefinition[];
}

type PixelBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type TextureAnchor = {
  x: number;
  y: number;
};

export interface CharacterTextureDisplayOriginOptions {
  textureAnchor: TextureAnchor | null;
  fallbackOrigin: TextureAnchor;
  configuredDisplayOriginY?: number;
  frameHeight: number;
}

export interface AnchoredCharacterFramePlacementOptions {
  displayOrigin: TextureAnchor;
  scale: number;
  target: TextureAnchor;
}

type ReadableImageData = Pick<ImageData, 'data' | 'width' | 'height'>;

const layeredCharacterTextureAnchors = new Map<string, TextureAnchor>();
const layeredCharacterTexturePreviewCanvases = new Map<
  string,
  Pick<HTMLCanvasElement, 'toDataURL'>
>();
const layeredCharacterTexturePreviewUrls = new Map<string, string>();

export function registerLayeredCharacterTexturePreview(
  textureKey: string,
  canvas: Pick<HTMLCanvasElement, 'toDataURL'>
): void {
  layeredCharacterTexturePreviewCanvases.set(textureKey, canvas);
  layeredCharacterTexturePreviewUrls.delete(textureKey);
}

export function getLayeredCharacterTexturePreviewUrl(textureKey: string): string | null {
  const cachedUrl = layeredCharacterTexturePreviewUrls.get(textureKey);

  if (cachedUrl) {
    return cachedUrl;
  }

  const canvas = layeredCharacterTexturePreviewCanvases.get(textureKey);

  if (!canvas) {
    return null;
  }

  const previewUrl = canvas.toDataURL('image/png');
  layeredCharacterTexturePreviewUrls.set(textureKey, previewUrl);
  return previewUrl;
}

function getSourceImage(scene: Phaser.Scene, textureKey: string): CanvasImageSource | null {
  if (!scene.textures.exists(textureKey)) {
    return null;
  }

  return scene.textures.get(textureKey).getSourceImage() as CanvasImageSource;
}

function getImageSize(image: CanvasImageSource): { width: number; height: number } {
  return {
    width: Number((image as { width?: number }).width ?? 0),
    height: Number((image as { height?: number }).height ?? 0)
  };
}

function findAlphaBounds(imageData: ReadableImageData): PixelBounds | null {
  const { data, width, height } = imageData;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha === 0) {
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + 1);
      bottom = Math.max(bottom, y + 1);
    }
  }

  if (right < 0 || bottom < 0) {
    return null;
  }

  return { left, top, right, bottom };
}

function findBottomFootY(imageData: ReadableImageData): number | null {
  const { data, width, height } = imageData;

  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha > 0) {
        return y + 1;
      }
    }
  }

  return null;
}

function findAlphaBandCenterX(
  imageData: ReadableImageData,
  top: number,
  bottom: number
): number | null {
  const { data, width } = imageData;
  let left = width;
  let right = -1;

  for (let y = top; y < bottom; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha === 0) {
        continue;
      }

      left = Math.min(left, x);
      right = Math.max(right, x + 1);
    }
  }

  if (right < 0) {
    return null;
  }

  return (left + right) / 2;
}

export function findCharacterBodyAnchor(imageData: ReadableImageData): TextureAnchor | null {
  const bounds = findAlphaBounds(imageData);

  if (!bounds) {
    return null;
  }

  const bodyHeight = bounds.bottom - bounds.top;
  const bodyBandTop = Math.max(bounds.top, Math.floor(bounds.top + bodyHeight * 0.3));
  const bodyBandBottom = Math.min(bounds.bottom, Math.ceil(bounds.top + bodyHeight * 0.68));
  const bodyCenterX = findAlphaBandCenterX(imageData, bodyBandTop, bodyBandBottom);
  const fallbackCenterX = (bounds.left + bounds.right) / 2;
  const footY = findBottomFootY(imageData);

  if (footY === null) {
    return null;
  }

  return {
    x: bodyCenterX ?? fallbackCenterX,
    y: footY
  };
}

export function getLayeredCharacterTextureAnchor(textureKey: string): TextureAnchor | null {
  return layeredCharacterTextureAnchors.get(textureKey) ?? null;
}

export function resolveCharacterTextureDisplayOrigin(
  options: CharacterTextureDisplayOriginOptions
): TextureAnchor {
  if (!options.textureAnchor) {
    return options.fallbackOrigin;
  }

  const configuredDisplayOriginY = options.configuredDisplayOriginY
    ?? options.fallbackOrigin.y;
  const groundOffsetY = options.frameHeight - configuredDisplayOriginY;

  return {
    x: options.textureAnchor.x,
    y: options.textureAnchor.y - groundOffsetY
  };
}

export function resolveAnchoredCharacterFramePlacement(
  options: AnchoredCharacterFramePlacementOptions
): { left: number; top: number; scale: number } {
  return {
    left: options.target.x - options.displayOrigin.x * options.scale,
    top: options.target.y - options.displayOrigin.y * options.scale,
    scale: options.scale
  };
}

export function registerLayeredCharacterTextures(
  scene: Phaser.Scene,
  frameDefinitions: readonly CharacterLayeredFrameDefinition[]
): void {
  frameDefinitions.forEach((frameDefinition) => {
    if (scene.textures.exists(frameDefinition.outputTextureKey)) {
      const existingImage = getSourceImage(scene, frameDefinition.outputTextureKey) as
        | (CanvasImageSource & Partial<Pick<HTMLCanvasElement, 'toDataURL'>>)
        | null;

      if (existingImage?.toDataURL) {
        registerLayeredCharacterTexturePreview(frameDefinition.outputTextureKey, existingImage);
      }

      return;
    }

    const baseImage = getSourceImage(scene, frameDefinition.baseTextureKey);

    if (!baseImage) {
      console.error(`[CharacterTexture] 基础角色帧 ${frameDefinition.baseTextureKey} 尚未加载，无法生成动态图层纹理。`);
      return;
    }

    const baseSize = getImageSize(baseImage);

    if (baseSize.width <= 0 || baseSize.height <= 0) {
      console.error(`[CharacterTexture] 基础角色帧 ${frameDefinition.baseTextureKey} 尺寸异常，无法生成动态图层纹理。`);
      return;
    }

    const canvasTexture = scene.textures.createCanvas(
      frameDefinition.outputTextureKey,
      baseSize.width,
      baseSize.height
    );
    const canvas = canvasTexture.getSourceImage() as HTMLCanvasElement;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      console.error(`[CharacterTexture] 无法创建动态图层纹理 ${frameDefinition.outputTextureKey} 的 Canvas 上下文。`);
      scene.textures.remove(frameDefinition.outputTextureKey);
      return;
    }

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, baseSize.width, baseSize.height);
    context.drawImage(baseImage, 0, 0);

    frameDefinition.layers.forEach((layerDefinition) => {
      const layerTextureKey = `${layerDefinition.sourceTextureKeyPrefix}_${frameDefinition.frameName}`;
      const layerImage = getSourceImage(scene, layerTextureKey);

      if (!layerImage) {
        console.error(`[CharacterTexture] 图层帧 ${layerTextureKey} 尚未加载，已跳过该图层。`);
        return;
      }

      const layerSize = getImageSize(layerImage);

      if (layerSize.width !== baseSize.width || layerSize.height !== baseSize.height) {
        console.error(
          `[CharacterTexture] 图层帧 ${layerTextureKey} 尺寸与基础帧不一致，已跳过该图层。`
        );
        return;
      }

      const layerProbeCanvas = document.createElement('canvas');
      layerProbeCanvas.width = layerSize.width;
      layerProbeCanvas.height = layerSize.height;
      const layerProbeContext = layerProbeCanvas.getContext('2d', { willReadFrequently: true });

      if (!layerProbeContext) {
        console.error(`[CharacterTexture] 无法读取图层帧 ${layerTextureKey} 的有效像素。`);
        return;
      }

      layerProbeContext.imageSmoothingEnabled = false;
      layerProbeContext.drawImage(layerImage, 0, 0);
      const layerBounds = findAlphaBounds(
        layerProbeContext.getImageData(0, 0, layerSize.width, layerSize.height)
      );

      const offsetY = layerDefinition.offsetY ?? 0;

      if (layerBounds && layerDefinition.mode === 'clear-base-side-pixels-within-layer-height') {
        const clearTop = Math.max(0, layerBounds.top + offsetY);
        const clearBottom = Math.min(baseSize.height, layerBounds.bottom + offsetY);
        const layerHeight = clearBottom - clearTop;

        if (layerHeight <= 0) {
          return;
        }

        context.clearRect(0, clearTop, layerBounds.left, layerHeight);
        context.clearRect(
          layerBounds.right,
          clearTop,
          baseSize.width - layerBounds.right,
          layerHeight
        );
      }

      context.drawImage(layerImage, 0, offsetY);
    });

    canvasTexture.refresh();
    registerLayeredCharacterTexturePreview(frameDefinition.outputTextureKey, canvas);

    const anchor = findCharacterBodyAnchor(
      context.getImageData(0, 0, baseSize.width, baseSize.height)
    );

    if (anchor) {
      layeredCharacterTextureAnchors.set(frameDefinition.outputTextureKey, anchor);
    }
  });
}
