export type WorldBounds = { x: number; y: number; width: number; height: number };

export type MapViewportConfig = {
  smallMap: {
    fitStrategy: 'fit-short-side';
    allowZoomIn: boolean;
  };
  largeMap: {
    zoom: number;
  };
  cameraMode?: 'follow-player' | 'static-centered';
};

function getFullMapWorldBounds(mapWidth: number, mapHeight: number, tileSize: number): WorldBounds {
  return {
    x: 0,
    y: 0,
    width: mapWidth * tileSize,
    height: mapHeight * tileSize
  };
}

function getPreferredDisplayBounds(
  mapContentBounds: WorldBounds,
  mapWidth: number,
  mapHeight: number,
  tileSize: number
): WorldBounds {
  if (mapContentBounds.width > 0 && mapContentBounds.height > 0) {
    return mapContentBounds;
  }

  return getFullMapWorldBounds(mapWidth, mapHeight, tileSize);
}

function getCameraBoundsForDisplayBounds(
  displayBounds: WorldBounds,
  cameraWorldViewWidth: number,
  cameraWorldViewHeight: number
): WorldBounds {
  return {
    x: displayBounds.x,
    y: displayBounds.y,
    width: Math.max(displayBounds.width, cameraWorldViewWidth),
    height: Math.max(displayBounds.height, cameraWorldViewHeight)
  };
}

export function computeCameraLayout(options: {
  viewportWidth: number;
  viewportHeight: number;
  mapWidth: number;
  mapHeight: number;
  tileSize: number;
  mapContentBounds: WorldBounds;
  mapViewportConfig: MapViewportConfig;
}): {
  viewport: WorldBounds;
  zoom: number;
  bounds: WorldBounds;
  focusTarget: WorldBounds;
  shouldFollowPlayer: boolean;
} {
  const {
    viewportWidth,
    viewportHeight,
    mapWidth,
    mapHeight,
    tileSize,
    mapContentBounds,
    mapViewportConfig
  } = options;
  const preferredDisplayBounds = getPreferredDisplayBounds(mapContentBounds, mapWidth, mapHeight, tileSize);
  const focusTarget = {
    x: preferredDisplayBounds.x + preferredDisplayBounds.width / 2,
    y: preferredDisplayBounds.y + preferredDisplayBounds.height / 2,
    width: 0,
    height: 0
  };
  const zoomX = viewportWidth / preferredDisplayBounds.width;
  const zoomY = viewportHeight / preferredDisplayBounds.height;
  const fillFrameZoom = mapViewportConfig.smallMap.fitStrategy === 'fit-short-side'
    ? Math.max(zoomX, zoomY)
    : Math.min(zoomX, zoomY);
  const shouldZoomSmallMap = mapViewportConfig.smallMap.allowZoomIn && fillFrameZoom > 1;
  const targetZoom = shouldZoomSmallMap ? fillFrameZoom : mapViewportConfig.largeMap.zoom;
  const cameraWorldViewWidth = viewportWidth / targetZoom;
  const cameraWorldViewHeight = viewportHeight / targetZoom;
  const shouldCenterSmallMapViewportX = !shouldZoomSmallMap && preferredDisplayBounds.width <= cameraWorldViewWidth;
  const shouldCenterSmallMapViewportY = !shouldZoomSmallMap && preferredDisplayBounds.height <= cameraWorldViewHeight;
  const centeredViewportWidth = preferredDisplayBounds.width * targetZoom;
  const centeredViewportHeight = preferredDisplayBounds.height * targetZoom;

  return {
    viewport: {
      x: shouldCenterSmallMapViewportX ? (viewportWidth - centeredViewportWidth) / 2 : 0,
      y: shouldCenterSmallMapViewportY ? (viewportHeight - centeredViewportHeight) / 2 : 0,
      width: shouldCenterSmallMapViewportX ? centeredViewportWidth : viewportWidth,
      height: shouldCenterSmallMapViewportY ? centeredViewportHeight : viewportHeight
    },
    zoom: targetZoom,
    bounds: getCameraBoundsForDisplayBounds(preferredDisplayBounds, cameraWorldViewWidth, cameraWorldViewHeight),
    focusTarget,
    shouldFollowPlayer: mapViewportConfig.cameraMode !== 'static-centered'
  };
}
