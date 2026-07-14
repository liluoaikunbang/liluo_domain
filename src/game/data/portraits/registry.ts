import {
  liluoDialoguePortraits,
  liluoPortraitLayerOptions,
  liluoPortraitPresets,
  resolveLiluoPortraitBackLayers
} from './liluo.ts';
import type { DialoguePortraitLayerData } from './types.ts';

export const portraitRegistry = {
  liluo: {
    characterId: 'liluo',
    portraits: liluoDialoguePortraits,
    presets: liluoPortraitPresets,
    layerOptions: liluoPortraitLayerOptions,
    resolveBackLayers: resolveLiluoPortraitBackLayers
  }
} as const;

export const playerPortraitLayerOptions = portraitRegistry.liluo.layerOptions;

export function resolvePlayerPortraitBackLayers(
  layers: ReadonlyArray<DialoguePortraitLayerData>
): DialoguePortraitLayerData[] {
  return portraitRegistry.liluo.resolveBackLayers(layers);
}

export const globalPlayerDialoguePortraits = portraitRegistry.liluo.portraits;
