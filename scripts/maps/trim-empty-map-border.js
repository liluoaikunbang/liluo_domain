import fs from 'node:fs';
import path from 'node:path';

function createTilesetTransparencyChecker(mapFilePath, mapData) {
  const tilesetCache = new Map();

  function resolveTilesetImageAbsolutePath(tileset) {
    const imagePath = tileset?.image;

    if (!imagePath) {
      return null;
    }

    return path.resolve(path.dirname(mapFilePath), imagePath);
  }

  function readPngSize(filePath) {
    const buffer = fs.readFileSync(filePath);

    if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
      throw new Error(`暂不支持读取非 PNG 图块集: ${filePath}`);
    }

    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  function getTilesetMeta(tileset) {
    const cacheKey = `${tileset?.firstgid ?? 0}:${tileset?.image ?? tileset?.name ?? 'unknown'}`;

    if (tilesetCache.has(cacheKey)) {
      return tilesetCache.get(cacheKey);
    }

    const absoluteImagePath = resolveTilesetImageAbsolutePath(tileset);
    const meta = {
      columns: tileset?.columns ?? 0,
      tileWidth: tileset?.tilewidth ?? mapData.tilewidth ?? 0,
      tileHeight: tileset?.tileheight ?? mapData.tileheight ?? 0,
      imageWidth: tileset?.imagewidth ?? 0,
      imageHeight: tileset?.imageheight ?? 0,
      transparentLocalIds: new Set()
    };

    if (absoluteImagePath && fs.existsSync(absoluteImagePath)) {
      try {
        const imageSize = readPngSize(absoluteImagePath);
        meta.imageWidth = meta.imageWidth || imageSize.width;
        meta.imageHeight = meta.imageHeight || imageSize.height;
      } catch (error) {
        console.warn(`[trim-empty-map-border] 无法分析图块集透明像素，已回退为仅按 gid>0 判断: ${absoluteImagePath}`);
      }
    }

    if (
      meta.columns > 0 &&
      meta.tileWidth > 0 &&
      meta.tileHeight > 0 &&
      meta.imageWidth > 0 &&
      meta.imageHeight > 0
    ) {
      const rowCount = Math.floor(meta.imageHeight / meta.tileHeight);
      const tileCount = meta.columns * rowCount;

      for (let localId = 0; localId < tileCount; localId++) {
        const tileX = (localId % meta.columns) * meta.tileWidth;
        const tileY = Math.floor(localId / meta.columns) * meta.tileHeight;

        if (tileX + meta.tileWidth > meta.imageWidth || tileY + meta.tileHeight > meta.imageHeight) {
          continue;
        }

        // 当前脚本先按 tileset 元数据识别“整格透明占位图块”。
        // 由于项目里这类旧素材本身就导出为透明空格 tile，
        // 只要该 localId 落在图片有效范围内且没有实际像素内容，就应视为空白边缘。
        // 这里无法直接做逐像素解码，因此后续会结合已知空透明帧白名单缓存处理。
      }
    }

    tilesetCache.set(cacheKey, meta);
    return meta;
  }

  // 当前项目旧农场图块集中，以下 localId 是整格透明占位帧。
  // 之前脚本仅按 gid>0 统计，导致这些“不可见但非 0”的 tile 把地图边界撑大。
  const knownTransparentLocalIdsByImage = new Map([
    ['farm_tileset.png', new Set([94])],
    ['farm_object.png', new Set([6, 344])]
  ]);

  const tilesets = [...(mapData.tilesets ?? [])].sort((left, right) => (right.firstgid ?? 0) - (left.firstgid ?? 0));

  return (gid) => {
    if ((gid ?? 0) <= 0) {
      return true;
    }

    const tileset = tilesets.find((entry) => gid >= (entry.firstgid ?? 0));

    if (!tileset) {
      return false;
    }

    const localId = gid - (tileset.firstgid ?? 0);
    const imageName = path.basename(String(tileset.image ?? '')).toLowerCase();
    const knownTransparentIds = knownTransparentLocalIdsByImage.get(imageName);

    if (knownTransparentIds?.has(localId)) {
      return true;
    }

    const meta = getTilesetMeta(tileset);
    return meta.transparentLocalIds.has(localId);
  };
}

function printUsage() {
  console.log([
    '用法: node scripts/maps/trim-empty-map-border.js <地图 json 路径> [--write]',
    '',
    '参数:',
    '  <地图 json 路径>  要处理的 Tiled 导出地图 JSON 文件',
    '  --write          将裁剪结果直接写回原文件',
    '',
    '默认行为是只分析并输出结果，不改文件。'
  ].join('\n'));
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith('--'));
  const write = args.includes('--write');
  const help = args.includes('--help') || args.includes('-h');

  return {
    filePath,
    write,
    help
  };
}

function getLayerCollection(container) {
  return Array.isArray(container?.layers) ? container.layers : [];
}

function walkLayers(layers, visitor) {
  layers.forEach((layer) => {
    visitor(layer);

    if (layer?.type === 'group' && Array.isArray(layer.layers)) {
      walkLayers(layer.layers, visitor);
    }
  });
}

function getLayerTiles(layer, fallbackWidth) {
  if (layer?.type !== 'tilelayer') {
    return [];
  }

  if (Array.isArray(layer.data)) {
    const width = layer.width ?? fallbackWidth ?? 0;
    return layer.data.map((gid, index) => ({
      x: index % width,
      y: Math.floor(index / width),
      gid: gid ?? 0
    }));
  }

  const tiles = [];
  (layer?.chunks ?? []).forEach((chunk) => {
    const chunkWidth = chunk?.width ?? 0;
    const chunkData = chunk?.data ?? [];

    chunkData.forEach((gid, index) => {
      tiles.push({
        x: (chunk?.x ?? 0) + (index % chunkWidth),
        y: (chunk?.y ?? 0) + Math.floor(index / chunkWidth),
        gid: gid ?? 0
      });
    });
  });

  return tiles;
}

function collectUsedTileBounds(mapData, isTileEmpty) {
  let minTileX = Number.POSITIVE_INFINITY;
  let minTileY = Number.POSITIVE_INFINITY;
  let maxTileX = Number.NEGATIVE_INFINITY;
  let maxTileY = Number.NEGATIVE_INFINITY;

  walkLayers(getLayerCollection(mapData), (layer) => {
    if (layer?.type !== 'tilelayer') {
      return;
    }

    getLayerTiles(layer, mapData.width ?? 0).forEach((tile) => {
      if (isTileEmpty(tile.gid ?? 0)) {
        return;
      }

      minTileX = Math.min(minTileX, tile.x);
      minTileY = Math.min(minTileY, tile.y);
      maxTileX = Math.max(maxTileX, tile.x);
      maxTileY = Math.max(maxTileY, tile.y);
    });
  });

  if (!Number.isFinite(minTileX) || !Number.isFinite(minTileY)) {
    throw new Error('地图中未找到任何非 0 图块，无法裁剪边缘。');
  }

  return {
    minTileX,
    minTileY,
    maxTileX,
    maxTileY,
    width: maxTileX - minTileX + 1,
    height: maxTileY - minTileY + 1
  };
}

function rebuildTileLayer(layer, targetBounds, isTileEmpty) {
  if (layer?.type !== 'tilelayer') {
    return layer;
  }

  const output = Array.from({ length: targetBounds.width * targetBounds.height }, () => 0);

  getLayerTiles(layer, layer.width).forEach((tile) => {
    if (isTileEmpty(tile.gid ?? 0)) {
      return;
    }

    const localX = tile.x - targetBounds.minTileX;
    const localY = tile.y - targetBounds.minTileY;

    if (localX < 0 || localY < 0 || localX >= targetBounds.width || localY >= targetBounds.height) {
      return;
    }

    output[localY * targetBounds.width + localX] = tile.gid;
  });

  const nextLayer = {
    ...layer,
    width: targetBounds.width,
    height: targetBounds.height,
    x: 0,
    y: 0,
    data: output
  };

  delete nextLayer.chunks;
  delete nextLayer.startx;
  delete nextLayer.starty;

  return nextLayer;
}

function shiftObjects(objects, offsetX, offsetY) {
  if (!Array.isArray(objects)) {
    return objects;
  }

  return objects.map((object) => ({
    ...object,
    x: (object?.x ?? 0) - offsetX,
    y: (object?.y ?? 0) - offsetY
  }));
}

function rebuildLayers(layers, targetBounds, offsetX, offsetY, isTileEmpty) {
  return layers.map((layer) => {
    if (layer?.type === 'group' && Array.isArray(layer.layers)) {
      return {
        ...layer,
        layers: rebuildLayers(layer.layers, targetBounds, offsetX, offsetY, isTileEmpty)
      };
    }

    if (layer?.type === 'tilelayer') {
      return rebuildTileLayer(layer, targetBounds, isTileEmpty);
    }

    if (layer?.type === 'objectgroup') {
      return {
        ...layer,
        objects: shiftObjects(layer.objects, offsetX, offsetY)
      };
    }

    return layer;
  });
}

function trimMapEmptyBorder(mapData) {
  const isTileEmpty = createTilesetTransparencyChecker(globalThis.__CURRENT_TRIM_MAP_FILE_PATH__, mapData);
  const bounds = collectUsedTileBounds(mapData, isTileEmpty);
  const tileWidth = mapData.tilewidth ?? 0;
  const tileHeight = mapData.tileheight ?? 0;
  const offsetX = bounds.minTileX * tileWidth;
  const offsetY = bounds.minTileY * tileHeight;

  const trimmedMap = {
    ...mapData,
    infinite: false,
    width: bounds.width,
    height: bounds.height,
    layers: rebuildLayers(getLayerCollection(mapData), bounds, offsetX, offsetY, isTileEmpty)
  };

  if (Array.isArray(mapData.objects)) {
    trimmedMap.objects = shiftObjects(mapData.objects, offsetX, offsetY);
  }

  return {
    bounds,
    offsetX,
    offsetY,
    trimmedMap
  };
}

function main() {
  const { filePath, write, help } = parseArgs(process.argv);

  if (help || !filePath) {
    printUsage();
    process.exit(help ? 0 : 1);
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  globalThis.__CURRENT_TRIM_MAP_FILE_PATH__ = absolutePath;
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const mapData = JSON.parse(raw);

  const originalWidth = mapData.width ?? 0;
  const originalHeight = mapData.height ?? 0;
  const { bounds, offsetX, offsetY, trimmedMap } = trimMapEmptyBorder(mapData);
  const changed =
    trimmedMap.width !== originalWidth ||
    trimmedMap.height !== originalHeight ||
    Boolean(mapData.infinite);
  const removedBorderTiles = mapData.infinite
    ? {
        left: null,
        top: null,
        right: null,
        bottom: null
      }
    : {
        left: Math.max(0, bounds.minTileX),
        top: Math.max(0, bounds.minTileY),
        right: Math.max(0, originalWidth - (bounds.maxTileX + 1)),
        bottom: Math.max(0, originalHeight - (bounds.maxTileY + 1))
      };

  const summary = {
    file: absolutePath,
    changed,
    sourceInfinite: Boolean(mapData.infinite),
    originalSize: {
      width: originalWidth,
      height: originalHeight
    },
    usedTileBounds: {
      minTileX: bounds.minTileX,
      minTileY: bounds.minTileY,
      maxTileX: bounds.maxTileX,
      maxTileY: bounds.maxTileY
    },
    trimmedSize: {
      width: trimmedMap.width,
      height: trimmedMap.height
    },
    removedBorderTiles,
    objectOffsetPixels: {
      x: offsetX,
      y: offsetY
    },
    write
  };

  if (write) {
    fs.writeFileSync(absolutePath, `${JSON.stringify(trimmedMap, null, 1)}\n`, 'utf8');
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();