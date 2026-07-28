import cityDesireMap from './maps/munika/city_desire/map.json';
import cityDesireEvents from './maps/munika/city_desire/events.json';
import cityDesireDialogues from './maps/munika/city_desire/dialogues.json';
import cityJingjiangSchoolMap from './maps/modern/city_Jingjiang_school/map.json';
import cityJingjiangSchoolEvents from './maps/modern/city_Jingjiang_school/events.json';
import cityJingjiangSchoolDialogues from './maps/modern/city_Jingjiang_school/dialogues.json';
import liluoEstateMap from './maps/munika/liluo_estate/map.json';
import liluoEstateEvents from './maps/munika/liluo_estate/events.json';
import liluoEstateDialogues, { liluoEstateDialogueAssetBundle } from './maps/munika/liluo_estate/dialogues';
import liluoHouseLivingRoomMap from './maps/munika/liluo_house_living_room/map.json';
import liluoHouseLivingRoomEvents from './maps/munika/liluo_house_living_room/events.json';
import liluoHouseLivingRoomDialogues, {
  liluoHouseLivingRoomDialogueAssetBundle
} from './maps/munika/liluo_house_living_room/dialogues';
import liluoRoomMap from './maps/munika/liluo_room/map.json';
import liluoRoomEvents from './maps/munika/liluo_room/events.json';
import liluoRoomDialogues, { liluoRoomDialogueAssetBundle } from './maps/munika/liluo_room/dialogues';
import mumuRoomMap from './maps/munika/mumu_room/map.json';
import { mergeAssetBundles, type GameAssetBundle } from './assets';
import mumuRoomEvents from './maps/munika/mumu_room/events.json';
import { type GameAnimationBundle } from './animations';
import { cityDesireAssetBundle } from './maps/munika/city_desire/assets';
import { cityDesireMeta } from './maps/munika/city_desire/meta';
import { cityJingjiangSchoolAssetBundle } from './maps/modern/city_Jingjiang_school/assets';
import { cityJingjiangSchoolMeta } from './maps/modern/city_Jingjiang_school/meta';
import { getMapBreadcrumb, type GameMapBreadcrumb } from './maps/breadcrumbs';
import { liluoEstateAssetBundle } from './maps/munika/liluo_estate/assets';
import { liluoEstateAnimationBundle } from './maps/munika/liluo_estate/animations';
import { liluoEstateMeta } from './maps/munika/liluo_estate/meta';
import { liluoHouseLivingRoomAssetBundle } from './maps/munika/liluo_house_living_room/assets';
import { liluoHouseLivingRoomMeta } from './maps/munika/liluo_house_living_room/meta';
import { liluoRoomAssetBundle } from './maps/munika/liluo_room/assets';
import { liluoRoomMeta } from './maps/munika/liluo_room/meta';
import { mumuRoomAssetBundle } from './maps/munika/mumu_room/assets';
import { mumuRoomMeta } from './maps/munika/mumu_room/meta';
import { mergeMapContentRegistry } from './mapContentRegistry';

export { mergeMapContentRegistry } from './mapContentRegistry';

export interface GameMapTilesetRenderConfig {
  textureKey: string;
  transparentTileLocalIds?: ReadonlyArray<number>;
  match?: {
    name?: string;
    imageIncludes?: ReadonlyArray<string>;
  };
}

export interface GameMapWorldRenderConfig {
  tilesets?: ReadonlyArray<GameMapTilesetRenderConfig>;
  npcReplacements?: ReadonlyArray<GameMapNpcReplacementConfig>;
}

export interface GameMapNpcReplacementConfig {
  layerName: string;
  sourceTextureKey?: string;
  appearanceId: string;
  direction: 'down' | 'left' | 'right' | 'up';
  state?: 'idle' | 'walk';
  depth?: number;
  scale?: number;
}

export interface GameMapViewportConfig {
  smallMapAdaptiveFit?: boolean;
  cameraMode?: 'follow-player' | 'static-centered';
}

export interface GameMapWorldHintConfig {
  id: string;
  layerName: string;
  icon: string;
  depth?: number;
  offsetX?: number;
  offsetY?: number;
  offsetPercentX?: number;
}

export interface GameMapRegistryEntry {
  id: string;
  name: string;
  description?: string;
  breadcrumb?: GameMapBreadcrumb;
  defaultSpawnId?: string;
  playerScale?: number;
  viewport?: GameMapViewportConfig;
  assets?: GameAssetBundle;
  animations?: GameAnimationBundle;
  worldRender?: GameMapWorldRenderConfig;
  worldHints?: ReadonlyArray<GameMapWorldHintConfig>;
  data: unknown;
}

export const mapRegistry: Record<string, GameMapRegistryEntry> = {
  [cityDesireMeta.id]: {
    id: cityDesireMeta.id,
    name: cityDesireMeta.name,
    description: cityDesireMeta.description,
    breadcrumb: getMapBreadcrumb(cityDesireMeta.id),
    defaultSpawnId: cityDesireMeta.defaultSpawnId,
    playerScale: cityDesireMeta.playerScale,
    viewport: cityDesireMeta.viewport,
    assets: cityDesireAssetBundle,
    worldRender: cityDesireMeta.worldRender,
    data: cityDesireMap
  },
  [cityJingjiangSchoolMeta.id]: {
    id: cityJingjiangSchoolMeta.id,
    name: cityJingjiangSchoolMeta.name,
    description: cityJingjiangSchoolMeta.description,
    breadcrumb: getMapBreadcrumb(cityJingjiangSchoolMeta.id),
    defaultSpawnId: cityJingjiangSchoolMeta.defaultSpawnId,
    playerScale: cityJingjiangSchoolMeta.playerScale,
    viewport: cityJingjiangSchoolMeta.viewport,
    assets: cityJingjiangSchoolAssetBundle,
    worldRender: cityJingjiangSchoolMeta.worldRender,
    data: cityJingjiangSchoolMap
  },
  [liluoEstateMeta.id]: {
    id: liluoEstateMeta.id,
    name: liluoEstateMeta.name,
    description: liluoEstateMeta.description,
    breadcrumb: getMapBreadcrumb(liluoEstateMeta.id),
    defaultSpawnId: liluoEstateMeta.defaultSpawnId,
    playerScale: liluoEstateMeta.playerScale,
    viewport: liluoEstateMeta.viewport,
    assets: mergeAssetBundles(liluoEstateAssetBundle, liluoEstateDialogueAssetBundle),
    animations: liluoEstateAnimationBundle,
    worldRender: liluoEstateMeta.worldRender,
    worldHints: liluoEstateMeta.worldHints,
    data: liluoEstateMap
  },
  [liluoHouseLivingRoomMeta.id]: {
    id: liluoHouseLivingRoomMeta.id,
    name: liluoHouseLivingRoomMeta.name,
    description: liluoHouseLivingRoomMeta.description,
    breadcrumb: getMapBreadcrumb(liluoHouseLivingRoomMeta.id),
    defaultSpawnId: liluoHouseLivingRoomMeta.defaultSpawnId,
    playerScale: liluoHouseLivingRoomMeta.playerScale,
    viewport: liluoHouseLivingRoomMeta.viewport,
    assets: mergeAssetBundles(liluoHouseLivingRoomAssetBundle, liluoHouseLivingRoomDialogueAssetBundle),
    worldRender: liluoHouseLivingRoomMeta.worldRender,
    data: liluoHouseLivingRoomMap
  },
  [liluoRoomMeta.id]: {
    id: liluoRoomMeta.id,
    name: liluoRoomMeta.name,
    description: liluoRoomMeta.description,
    breadcrumb: getMapBreadcrumb(liluoRoomMeta.id),
    defaultSpawnId: liluoRoomMeta.defaultSpawnId,
    playerScale: liluoRoomMeta.playerScale,
    viewport: liluoRoomMeta.viewport,
    assets: mergeAssetBundles(liluoRoomAssetBundle, liluoRoomDialogueAssetBundle),
    worldRender: liluoRoomMeta.worldRender,
    data: liluoRoomMap
  },
  [mumuRoomMeta.id]: {
    id: mumuRoomMeta.id,
    name: mumuRoomMeta.name,
    description: mumuRoomMeta.description,
    breadcrumb: getMapBreadcrumb(mumuRoomMeta.id),
    defaultSpawnId: mumuRoomMeta.defaultSpawnId,
    playerScale: mumuRoomMeta.playerScale,
    viewport: mumuRoomMeta.viewport,
    assets: mumuRoomAssetBundle,
    worldRender: mumuRoomMeta.worldRender,
    data: mumuRoomMap
  }
};

export const eventRegistry = mergeMapContentRegistry('event', [
  { mapId: cityDesireMeta.id, entries: cityDesireEvents as Record<string, unknown> },
  { mapId: cityJingjiangSchoolMeta.id, entries: cityJingjiangSchoolEvents as Record<string, unknown> },
  { mapId: liluoEstateMeta.id, entries: liluoEstateEvents as Record<string, unknown> },
  { mapId: liluoHouseLivingRoomMeta.id, entries: liluoHouseLivingRoomEvents as Record<string, unknown> },
  { mapId: liluoRoomMeta.id, entries: liluoRoomEvents as Record<string, unknown> },
  { mapId: mumuRoomMeta.id, entries: mumuRoomEvents as Record<string, unknown> }
]);

export const dialogueRegistry = mergeMapContentRegistry('dialogue', [
  { mapId: cityDesireMeta.id, entries: cityDesireDialogues as Record<string, unknown> },
  { mapId: cityJingjiangSchoolMeta.id, entries: cityJingjiangSchoolDialogues as Record<string, unknown> },
  { mapId: liluoEstateMeta.id, entries: liluoEstateDialogues as Record<string, unknown> },
  { mapId: liluoHouseLivingRoomMeta.id, entries: liluoHouseLivingRoomDialogues as Record<string, unknown> },
  { mapId: liluoRoomMeta.id, entries: liluoRoomDialogues as Record<string, unknown> }
]);

export const INITIAL_MAP_ID = liluoEstateMeta.id;

export function getMapRegistryEntry(mapId: string): GameMapRegistryEntry | null {
  return mapRegistry[mapId] ?? null;
}
