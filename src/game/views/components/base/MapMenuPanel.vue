<template>
  <section class="map-menu-panel" aria-label="地图栏">
    <section class="menu-card map-card" aria-label="当前地图概览">
      <nav class="map-breadcrumb" aria-label="地图层级">
        <span
          v-for="(item, index) in breadcrumbItems"
          :key="`${item}-${index}`"
          class="map-breadcrumb-item"
        >
          <span class="map-breadcrumb-text">{{ item }}</span>
          <span v-if="index < breadcrumbItems.length - 1" class="map-breadcrumb-separator" aria-hidden="true">/</span>
        </span>
      </nav>

      <article
        ref="mapOverviewPanelRef"
        class="map-overview-panel"
        :data-menu-nav="true"
        data-menu-group="map-overview"
        data-menu-key="current-map-overview"
        tabindex="0"
        :aria-label="overviewLabel"
      >
        <div
          v-if="renderedMap?.url"
          class="map-overview-stage"
        >
          <div class="map-overview-image-frame" :style="mapFrameStyle">
            <img
              class="map-overview-image"
              :src="renderedMap.url"
              :alt="`${resolvedMapName} 全地图`"
              draggable="false"
            />

            <span
              v-if="markerStyle"
              class="map-player-marker"
              :style="markerStyle"
              aria-hidden="true"
            ></span>

            <span
              v-if="blindMaskStyle"
              class="map-blind-mask"
              :style="blindMaskStyle"
              aria-hidden="true"
            ></span>
          </div>
        </div>

        <div v-else class="map-overview-empty">
          <span class="menu-card-label">{{ emptyStateLabel }}</span>
          <strong class="menu-card-title">{{ emptyStateTitle }}</strong>
          <p class="menu-card-text">{{ emptyStateText }}</p>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  getTilesetForTileGid,
  isKnownTransparentTileGid,
  normalizeRuntimeMapData,
  shouldHideRuntimeTileLayer
} from '../../../systems/map/runtimeMapNormalizer';

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const ROTATED_HEXAGONAL_120_FLAG = 0x10000000;
const TILE_GID_MASK = ~(
  FLIPPED_HORIZONTALLY_FLAG |
  FLIPPED_VERTICALLY_FLAG |
  FLIPPED_DIAGONALLY_FLAG |
  ROTATED_HEXAGONAL_120_FLAG
) >>> 0;

const imageCache = new Map();
const SKIPPED_MENU_MAP_LAYER_NAME_PARTS = ['event', 'collision', 'debug', 'path'];
const MENU_MAP_BLIND_MASK_ALPHA = 0.86;

const props = defineProps({
  mapEntry: {
    type: Object,
    default: null
  },
  currentMapName: {
    type: String,
    default: ''
  },
  currentPosition: {
    type: Object,
    default: null
  },
  visionPresentation: {
    type: Object,
    default: null
  }
});

const renderedMap = ref(null);
const renderState = ref('idle');
const mapOverviewPanelRef = ref(null);
const mapFrameSize = ref({
  width: 0,
  height: 0
});
let renderRequestId = 0;
let mapOverviewResizeObserver = null;

const breadcrumbItems = computed(() => {
  const breadcrumb = props.mapEntry?.breadcrumb;

  if (Array.isArray(breadcrumb) && breadcrumb.length > 0) {
    return breadcrumb;
  }

  return [resolvedMapName.value];
});

const resolvedMapName = computed(() => props.currentMapName || props.mapEntry?.name || '未知地点');

const overviewLabel = computed(() => {
  const location = props.currentPosition
    ? `当前位置 X ${Math.round(props.currentPosition.x)} / Y ${Math.round(props.currentPosition.y)}`
    : '当前位置尚未同步';

  return `${breadcrumbItems.value.join(' / ')}，${location}`;
});

const markerStyle = computed(() => {
  const map = renderedMap.value;
  const position = props.currentPosition;

  if (!map || !position || map.pixelWidth <= 0 || map.pixelHeight <= 0) {
    return null;
  }

  const markerX = (position.x - map.offsetX) / map.pixelWidth * 100;
  const markerY = (position.y - map.offsetY) / map.pixelHeight * 100;

  return {
    '--map-player-x': `${Math.max(0, Math.min(100, markerX))}%`,
    '--map-player-y': `${Math.max(0, Math.min(100, markerY))}%`
  };
});

const blindMaskStyle = computed(() => {
  const map = renderedMap.value;
  const position = props.currentPosition;
  const blindMask = props.visionPresentation?.blindMask;
  const frameWidth = mapFrameSize.value.width;
  const frameHeight = mapFrameSize.value.height;

  if (
    !map ||
    !position ||
    !blindMask?.enabled ||
    map.pixelWidth <= 0 ||
    map.pixelHeight <= 0 ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    return null;
  }

  const centerX = (position.x - map.offsetX) / map.pixelWidth * 100;
  const centerY = (position.y - map.offsetY) / map.pixelHeight * 100;
  const scaleX = frameWidth / map.pixelWidth;
  const scaleY = frameHeight / map.pixelHeight;
  const tileSize = map.tileSize || 16;
  const radius = Math.max(1, blindMask.radiusInTiles * tileSize * Math.min(scaleX, scaleY));
  const fadeWidth = Math.max(1, blindMask.edgeFadeInTiles * tileSize * Math.min(scaleX, scaleY));

  return {
    '--map-blind-center-x': `${Math.max(0, Math.min(100, centerX))}%`,
    '--map-blind-center-y': `${Math.max(0, Math.min(100, centerY))}%`,
    '--map-blind-radius': `${radius}px`,
    '--map-blind-fade-radius': `${radius + fadeWidth}px`,
    '--map-blind-overlay': MENU_MAP_BLIND_MASK_ALPHA
  };
});

const mapFrameStyle = computed(() => {
  const map = renderedMap.value;
  const width = mapFrameSize.value.width;
  const height = mapFrameSize.value.height;

  if (!map) {
    return {};
  }

  return {
    '--map-overview-aspect-ratio': `${map.pixelWidth} / ${map.pixelHeight}`,
    width: width > 0 ? `${width}px` : '100%',
    height: height > 0 ? `${height}px` : '100%'
  };
});

const emptyStateLabel = computed(() => {
  if (renderState.value === 'loading') {
    return '地图绘制中';
  }

  if (renderState.value === 'failed') {
    return '地图资源';
  }

  return '地图数据';
});

const emptyStateTitle = computed(() => {
  if (renderState.value === 'loading') {
    return '正在展开全地图';
  }

  if (renderState.value === 'failed') {
    return '当前地图暂时无法绘制成图片';
  }

  return '当前地图暂时无法生成概览';
});

const emptyStateText = computed(() => {
  if (renderState.value === 'loading') {
    return '正在读取地图图块与素材，完成后会显示真实的全地图图片。';
  }

  if (renderState.value === 'failed') {
    return '地图数据已经接入，但缺少可用图块素材或绘制时遇到异常。请查看控制台中的具体资源路径。';
  }

  return '地图栏已接入，等待有效地图数据同步后会显示全图与角色位置。';
});

function getCleanTileGid(rawGid) {
  return (Number(rawGid) >>> 0) & TILE_GID_MASK;
}

function getRenderableTileLayers(mapData) {
  return (mapData.layers ?? []).filter((layer) => {
    const layerName = String(layer?.name ?? '').toLowerCase();
    const isSkippedMenuLayer = SKIPPED_MENU_MAP_LAYER_NAME_PARTS.some((namePart) => layerName.includes(namePart));

    return layer?.type === 'tilelayer' &&
      layer.visible !== false &&
      !shouldHideRuntimeTileLayer(layer) &&
      !isSkippedMenuLayer;
  });
}

function resolveAssetUrl(assetBundle, assetKey) {
  if (!assetBundle || !assetKey) {
    return null;
  }

  const asset = assetBundle.manifest?.find((entry) => entry.key === assetKey);
  return asset?.url ?? null;
}

function loadImage(url) {
  if (!url) {
    return Promise.resolve(null);
  }

  if (imageCache.has(url)) {
    return imageCache.get(url);
  }

  const imagePromise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.error(`[MapMenuPanel] 地图栏图片加载失败：${url}`);
      resolve(null);
    };
    image.src = url;
  });

  imageCache.set(url, imagePromise);
  return imagePromise;
}

function getTilesetColumns(tileset, image) {
  const configuredColumns = Number(tileset?.columns) || 0;

  if (configuredColumns > 0) {
    return configuredColumns;
  }

  const tileWidth = Number(tileset?.tilewidth) || 16;
  const margin = Number(tileset?.margin) || 0;
  const spacing = Number(tileset?.spacing) || 0;
  return Math.max(1, Math.floor((image.width - margin * 2 + spacing) / (tileWidth + spacing)));
}

function drawTile(ctx, image, tileset, rawGid, cleanGid, tileX, tileY, destinationWidth, destinationHeight) {
  const localTileId = cleanGid - tileset.firstgid;
  const tileWidth = Number(tileset.tilewidth) || destinationWidth;
  const tileHeight = Number(tileset.tileheight) || destinationHeight;
  const margin = Number(tileset.margin) || 0;
  const spacing = Number(tileset.spacing) || 0;
  const columns = getTilesetColumns(tileset, image);
  const sourceX = margin + (localTileId % columns) * (tileWidth + spacing);
  const sourceY = margin + Math.floor(localTileId / columns) * (tileHeight + spacing);
  const destinationX = tileX * destinationWidth;
  const destinationY = tileY * destinationHeight;
  const flipX = Boolean((Number(rawGid) >>> 0) & FLIPPED_HORIZONTALLY_FLAG);
  const flipY = Boolean((Number(rawGid) >>> 0) & FLIPPED_VERTICALLY_FLAG);

  ctx.save();
  ctx.translate(destinationX + (flipX ? destinationWidth : 0), destinationY + (flipY ? destinationHeight : 0));
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    tileWidth,
    tileHeight,
    0,
    0,
    destinationWidth,
    destinationHeight
  );
  ctx.restore();
}

function updateMapFrameSize() {
  const panel = mapOverviewPanelRef.value;
  const map = renderedMap.value;

  if (!panel || !map || map.pixelWidth <= 0 || map.pixelHeight <= 0) {
    mapFrameSize.value = {
      width: 0,
      height: 0
    };
    return;
  }

  const panelRect = panel.getBoundingClientRect();
  const panelWidth = Math.max(0, panelRect.width);
  const panelHeight = Math.max(0, panelRect.height);

  if (panelWidth <= 0 || panelHeight <= 0) {
    mapFrameSize.value = {
      width: 0,
      height: 0
    };
    return;
  }

  const mapAspect = map.pixelWidth / map.pixelHeight;
  const panelAspect = panelWidth / panelHeight;
  const nextSize = panelAspect > mapAspect
    ? {
      width: panelHeight * mapAspect,
      height: panelHeight
    }
    : {
      width: panelWidth,
      height: panelWidth / mapAspect
    };

  mapFrameSize.value = {
    width: Math.max(1, Math.floor(nextSize.width)),
    height: Math.max(1, Math.floor(nextSize.height))
  };
}

async function renderMapImage(mapEntry) {
  if (!mapEntry?.data) {
    return null;
  }

  const mapData = normalizeRuntimeMapData(mapEntry.id, mapEntry.data);
  const mapColumns = Math.max(1, Number(mapData.width) || 0);
  const mapRows = Math.max(1, Number(mapData.height) || 0);
  const tileWidth = Math.max(1, Number(mapData.tilewidth) || 16);
  const tileHeight = Math.max(1, Number(mapData.tileheight) || 16);
  const pixelWidth = mapColumns * tileWidth;
  const pixelHeight = mapRows * tileHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, pixelWidth, pixelHeight);

  const imageByTextureKey = new Map();
  const renderableLayers = getRenderableTileLayers(mapData);
  const drawnBounds = {
    minX: pixelWidth,
    minY: pixelHeight,
    maxX: 0,
    maxY: 0
  };

  for (const layer of renderableLayers) {
    const layerData = Array.isArray(layer.data) ? layer.data : [];
    const layerWidth = Number(layer.width) || mapColumns;

    for (let index = 0; index < layerData.length; index += 1) {
      const rawGid = Number(layerData[index]) || 0;
      const cleanGid = getCleanTileGid(rawGid);

      if (isKnownTransparentTileGid(mapData, cleanGid)) {
        continue;
      }

      const tileX = index % layerWidth;
      const tileY = Math.floor(index / layerWidth);

      if (tileX < 0 || tileY < 0 || tileX >= mapColumns || tileY >= mapRows) {
        continue;
      }

      const tileset = getTilesetForTileGid(mapData, cleanGid);

      if (!tileset) {
        continue;
      }

      const textureKey = String(tileset.textureKey ?? tileset.name ?? '');
      const assetUrl = resolveAssetUrl(mapEntry.assets, textureKey);

      if (!assetUrl) {
        console.error(`[MapMenuPanel] 地图栏找不到图块素材：${textureKey}`);
        continue;
      }

      if (!imageByTextureKey.has(textureKey)) {
        imageByTextureKey.set(textureKey, await loadImage(assetUrl));
      }

      const image = imageByTextureKey.get(textureKey);

      if (!image) {
        continue;
      }

      drawTile(ctx, image, tileset, rawGid, cleanGid, tileX, tileY, tileWidth, tileHeight);

      drawnBounds.minX = Math.min(drawnBounds.minX, tileX * tileWidth);
      drawnBounds.minY = Math.min(drawnBounds.minY, tileY * tileHeight);
      drawnBounds.maxX = Math.max(drawnBounds.maxX, (tileX + 1) * tileWidth);
      drawnBounds.maxY = Math.max(drawnBounds.maxY, (tileY + 1) * tileHeight);
    }
  }

  if (drawnBounds.maxX <= drawnBounds.minX || drawnBounds.maxY <= drawnBounds.minY) {
    return null;
  }

  const croppedWidth = drawnBounds.maxX - drawnBounds.minX;
  const croppedHeight = drawnBounds.maxY - drawnBounds.minY;
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;
  croppedCtx.imageSmoothingEnabled = false;
  croppedCtx.drawImage(
    canvas,
    drawnBounds.minX,
    drawnBounds.minY,
    croppedWidth,
    croppedHeight,
    0,
    0,
    croppedWidth,
    croppedHeight
  );

  return {
    url: croppedCanvas.toDataURL('image/png'),
    pixelWidth: croppedWidth,
    pixelHeight: croppedHeight,
    tileSize: Math.max(tileWidth, tileHeight),
    offsetX: drawnBounds.minX,
    offsetY: drawnBounds.minY
  };
}

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') {
    nextTick(updateMapFrameSize);
    return;
  }

  mapOverviewResizeObserver = new ResizeObserver(() => {
    updateMapFrameSize();
  });

  if (mapOverviewPanelRef.value) {
    mapOverviewResizeObserver.observe(mapOverviewPanelRef.value);
  }

  nextTick(updateMapFrameSize);
});

onBeforeUnmount(() => {
  mapOverviewResizeObserver?.disconnect();
  mapOverviewResizeObserver = null;
});

watch(
  () => props.mapEntry,
  async (mapEntry) => {
    const requestId = ++renderRequestId;
    renderedMap.value = null;

    if (!mapEntry?.data) {
      renderState.value = 'idle';
      return;
    }

    renderState.value = 'loading';

    try {
      const nextRenderedMap = await renderMapImage(mapEntry);

      if (requestId !== renderRequestId) {
        return;
      }

      renderedMap.value = nextRenderedMap;
      renderState.value = nextRenderedMap ? 'ready' : 'failed';
      nextTick(updateMapFrameSize);
    } catch (error) {
      if (requestId !== renderRequestId) {
        return;
      }

      console.error('[MapMenuPanel] 地图栏绘制失败：', error);
      renderedMap.value = null;
      mapFrameSize.value = {
        width: 0,
        height: 0
      };
      renderState.value = 'failed';
    }
  },
  { immediate: true }
);
</script>
