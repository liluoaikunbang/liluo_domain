import { mergeAssetBundles, type GameAssetBundle, findImageAssetUrl } from '../assets';
import {
  asylumForLunaticInteractiveFictionAssetBundle,
  asylumForLunaticInteractiveFictionAssetUrls,
  asylumForLunaticInteractiveFictionMeta,
  asylumForLunaticInteractiveFictionScenario
} from './asylum_for_lunatic';
import type { InteractiveFictionScenarioData } from '../../core/interactiveFiction';

export interface InteractiveFictionRegistryEntry {
  id: string;
  title: string;
  description?: string;
  scenario: InteractiveFictionScenarioData;
  assets?: GameAssetBundle;
  assetUrls?: Record<string, string>;
}

export const interactiveFictionRegistry: Record<string, InteractiveFictionRegistryEntry> = {
  [asylumForLunaticInteractiveFictionMeta.id]: {
    id: asylumForLunaticInteractiveFictionMeta.id,
    title: asylumForLunaticInteractiveFictionMeta.title,
    description: asylumForLunaticInteractiveFictionMeta.description,
    scenario: asylumForLunaticInteractiveFictionScenario,
    assets: asylumForLunaticInteractiveFictionAssetBundle,
    assetUrls: asylumForLunaticInteractiveFictionAssetUrls
  }
};

export const interactiveFictionAssetBundle = mergeAssetBundles(
  asylumForLunaticInteractiveFictionAssetBundle
);

export function getInteractiveFictionAssetUrl(scenarioId: string, assetKey: string): string {
  const entry = interactiveFictionRegistry[scenarioId];

  if (!entry || !assetKey) {
    return '';
  }

  return entry.assetUrls?.[assetKey] ?? findImageAssetUrl(entry.assets, assetKey) ?? '';
}
