import {
  resolveDefaultPlayerPortraitLayerSet,
  resolvePlayerPortraitBackLayersForLayers,
  resolvePlayerPortraitLayerOptions,
  type DialoguePortraitLayerSource
} from './layerRules.ts';
import type {
  DialoguePortraitData,
  DialoguePortraitLayerData,
  PortraitLayerOption,
  PortraitPreset
} from './types.ts';

const liLuoDefaultPortraitUrl = new URL('../../../assets/game/standee/LiLuo.png', import.meta.url).href;
const liLuoSleepPortraitUrl = new URL('../../../assets/game/standee/Liluo_sleep.png', import.meta.url).href;
const liLuoSleepTiePortraitUrl = new URL('../../../assets/game/standee/Liluo_sleep_tie.png', import.meta.url).href;

const isViteRuntime = Boolean(import.meta.env);
const defaultPlayerPortraitPartialModules = isViteRuntime
  ? import.meta.glob([
      '../../../assets/game/standee/partial/*素体-上身*.png',
      '../../../assets/game/standee/partial/*素体-下身*.png',
      '../../../assets/game/standee/partial/*素体-脚部-站立*.png',
      '../../../assets/game/standee/partial/*表情-基准表情*.png',
      '../../../assets/game/standee/partial/*通用-头部*.png'
    ], {
      eager: true,
      import: 'default',
      query: '?url'
    }) as Record<string, string>
  : {};
const playerPortraitPartialModules = isViteRuntime
  ? import.meta.glob('../../../assets/game/standee/partial/*.png', {
      eager: true,
      import: 'default',
      query: '?url'
    }) as Record<string, string>
  : {};

const defaultPlayerPortraitLayerSources: DialoguePortraitLayerSource[] = Object.entries(defaultPlayerPortraitPartialModules)
  .map(([path, src]) => ({ path, src }));
const playerPortraitLayerSources: DialoguePortraitLayerSource[] = Object.entries(playerPortraitPartialModules)
  .map(([path, src]) => ({ path, src }));
const defaultPlayerPortraitLayerSet = resolveDefaultPlayerPortraitLayerSet(defaultPlayerPortraitLayerSources);

export const liluoPortraitLayerOptions = resolvePlayerPortraitLayerOptions(playerPortraitLayerSources);

function findPortraitLayerByKeywords(keywords: ReadonlyArray<string>): PortraitLayerOption | null {
  return liluoPortraitLayerOptions.find((layer) => {
    const layerKeywordSet = new Set(layer.keywords);
    return keywords.every((keyword) => layerKeywordSet.has(keyword));
  }) ?? null;
}

const liLuoJapaneseBindingLayers = [
  findPortraitLayerByKeywords(['\u7d20\u4f53', '\u4e0b\u8eab', '\u5e76\u817f']),
  findPortraitLayerByKeywords(['\u7d20\u4f53', '\u811a\u90e8', '\u7ad9\u7acb']),
  findPortraitLayerByKeywords(['\u7d20\u4f53', '\u4e0a\u8eab', '\u80cc\u624b']),
  findPortraitLayerByKeywords(['\u901a\u7528', '\u4e0b\u8eab', '\u88d9\u88c5']),
  findPortraitLayerByKeywords(['\u901a\u7528', '\u5934\u90e8', '\u5934\u6a21']),
  findPortraitLayerByKeywords(['\u901a\u7528', '\u5934\u90e8', '\u8868\u60c5', '\u57fa\u51c6\u8868\u60c5']),
  findPortraitLayerByKeywords(['\u901a\u7528', '\u5934\u90e8', '\u9ad8\u9a6c\u5c3e']),
  findPortraitLayerByKeywords(['\u6346\u7ed1', '\u4e0a\u8eab', '\u65e5\u5f0f', '\u767dT'])
].filter((layer): layer is PortraitLayerOption => Boolean(layer));

export function resolveLiluoPortraitBackLayers(
  layers: ReadonlyArray<DialoguePortraitLayerData>
): DialoguePortraitLayerData[] {
  return resolvePlayerPortraitBackLayersForLayers(playerPortraitLayerSources, layers);
}

export const liluoPortraitPresets = {
  default: {
    id: 'liluo_default',
    portraitKey: 'portrait_liluo_default',
    characterId: 'liluo',
    layerKeys: defaultPlayerPortraitLayerSet.layers.map((layer) => layer.key)
  }
} satisfies Record<string, PortraitPreset>;

export const liluoDialoguePortraits = {
  liLuoDefault: {
    key: 'portrait_liluo_default',
    src: liLuoDefaultPortraitUrl,
    alt: '璃落立绘',
    statusText: '主角：璃落',
    layers: defaultPlayerPortraitLayerSet.layers,
    backLayers: defaultPlayerPortraitLayerSet.backLayers
  },
  liLuoSleep: {
    key: 'portrait_liluo_sleep',
    src: liLuoSleepPortraitUrl,
    alt: '璃落睡眠立绘',
    statusText: '主角：璃落（床上休息）'
  },
  liLuoSleepTie: {
    key: 'portrait_liluo_sleep_tie',
    src: liLuoSleepTiePortraitUrl,
    alt: '璃落拘束睡眠立绘',
    statusText: '主角：璃落（拘束睡眠休息）'
  },
  liLuoJapaneseBinding: {
    key: 'portrait_liluo_japanese_binding',
    alt: '璃落日式捆绑立绘',
    statusText: '主角：璃落（日式捆绑）',
    layers: liLuoJapaneseBindingLayers,
    backLayers: resolveLiluoPortraitBackLayers(liLuoJapaneseBindingLayers)
  }
} satisfies Record<string, DialoguePortraitData>;
