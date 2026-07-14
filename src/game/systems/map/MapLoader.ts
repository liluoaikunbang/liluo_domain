import type { EventMapTransitionSpawnMarkerData } from '../../core/EventRunner';
import { getMapRegistryEntry, INITIAL_MAP_ID } from '../../data/registry';

export interface WorldSceneInitRequest {
  mapId?: string;
  spawnId?: string;
  spawnMarker?: EventMapTransitionSpawnMarkerData;
  playerPosition?: {
    x: number;
    y: number;
  };
  playerScale?: number;
  mapData?: unknown;
  fadeInDuration?: number;
}

export interface WorldSceneInitData {
  mapId: string;
  spawnId?: string;
  spawnMarker?: EventMapTransitionSpawnMarkerData;
  playerPosition?: {
    x: number;
    y: number;
  };
  playerScale?: number;
  mapData: unknown;
  fadeInDuration?: number;
}

export function resolveWorldSceneInitData(request: WorldSceneInitRequest = {}): WorldSceneInitData {
  if (request.mapId && request.mapData) {
    return {
      mapId: request.mapId,
      spawnId: request.spawnId,
      spawnMarker: request.spawnMarker,
      playerPosition: request.playerPosition,
      playerScale: request.playerScale,
      mapData: request.mapData,
      fadeInDuration: request.fadeInDuration
    };
  }

  const requestedMapId = request.mapId ?? INITIAL_MAP_ID;
  const requestedEntry = getMapRegistryEntry(requestedMapId);
  const fallbackEntry = getMapRegistryEntry(INITIAL_MAP_ID);
  const resolvedEntry = requestedEntry ?? fallbackEntry;

  if (!resolvedEntry) {
    throw new Error(`[MapLoader] 未找到可用地图，requestedMapId=${requestedMapId}`);
  }

  return {
    mapId: resolvedEntry.id,
    spawnId: request.spawnId ?? resolvedEntry.defaultSpawnId,
    spawnMarker: request.spawnMarker,
    playerPosition: request.playerPosition,
    playerScale: resolvedEntry.playerScale,
    mapData: resolvedEntry.data,
    fadeInDuration: request.fadeInDuration
  };
}
