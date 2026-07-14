import { eventRunner, type EventData, type EventTileMarkerData, type EventZoneData } from '../../core/EventRunner';
import { getTileKey } from './pathfinding';
import { getNonEmptyTilePositionsForLayer } from './runtimeMapNormalizer';

function resolveCandidateZonesForEvent(event: EventData, mapId: string): EventZoneData[] {
  const candidateZones = event.zones?.length ? event.zones : event.zone ? [event.zone] : [];
  return candidateZones.filter((zone) => zone.mapId === mapId);
}

function resolveCandidateTileMarkersForEvent(event: EventData, mapId: string): EventTileMarkerData[] {
  const candidateTileMarkers = event.tileMarkers?.length
    ? event.tileMarkers
    : event.tileMarker
      ? [event.tileMarker]
      : [];

  return candidateTileMarkers.filter((tileMarker) => tileMarker.mapId === mapId);
}

export interface ManualEventRegistry {
  manualEventTileKeys: ReadonlySet<string>;
  getEventsAtTile: (tileX: number, tileY: number) => EventData[];
}

function createEventRegistry(
  events: EventData[],
  mapId: string,
  mapData: any
): {
  eventTileKeys: ReadonlySet<string>;
  getEventsAtTile: (tileX: number, tileY: number) => EventData[];
} {
  const eventMap = new Map<string, EventData[]>();

  const registerEventAtTile = (event: EventData, tileX: number, tileY: number): void => {
    const tileKey = getTileKey(tileX, tileY);
    const registeredEvents = eventMap.get(tileKey) ?? [];

    if (registeredEvents.some((registeredEvent) => registeredEvent.eventId === event.eventId)) {
      return;
    }

    eventMap.set(tileKey, [...registeredEvents, event]);
  };

  events.forEach((event) => {
    resolveCandidateZonesForEvent(event, mapId).forEach((zone) => {
      registerEventAtTile(event, zone.tileX, zone.tileY);
    });

    resolveCandidateTileMarkersForEvent(event, mapId).forEach((tileMarker) => {
      getNonEmptyTilePositionsForLayer(mapData, tileMarker.layerName).forEach(({ tileX, tileY }) => {
        registerEventAtTile(event, tileX, tileY);
      });
    });
  });

  return {
    eventTileKeys: new Set(eventMap.keys()),
    getEventsAtTile: (tileX: number, tileY: number) => eventMap.get(getTileKey(tileX, tileY)) ?? []
  };
}

export function createManualEventRegistry(mapId: string, mapData: any): ManualEventRegistry {
  const registry = createEventRegistry(eventRunner.getManualEventsForMap(mapId), mapId, mapData);

  return {
    manualEventTileKeys: registry.eventTileKeys,
    getEventsAtTile: registry.getEventsAtTile
  };
}