export function getForegroundLayerIndices(layers, playerDepth) {
  return layers.flatMap((layer, layerIndex) => (
    layer.depth > playerDepth ? [layerIndex] : []
  ));
}

export function shouldRenderForegroundTileOverlay({ tileGid, isBlocked }) {
  return tileGid > 0 && !isBlocked;
}
