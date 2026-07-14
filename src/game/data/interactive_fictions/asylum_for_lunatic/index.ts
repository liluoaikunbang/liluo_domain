import scenarioJson from './scenario.json' with { type: 'json' };
import {
  asylumForLunaticInteractiveFictionAssetBundle,
  asylumForLunaticInteractiveFictionAssetUrls
} from './assets';
import { asylumForLunaticInteractiveFictionMeta } from './meta';
import type { InteractiveFictionScenarioData } from '../../../core/interactiveFiction';

export const asylumForLunaticInteractiveFictionScenario = scenarioJson as InteractiveFictionScenarioData;
export {
  asylumForLunaticInteractiveFictionAssetBundle,
  asylumForLunaticInteractiveFictionAssetUrls,
  asylumForLunaticInteractiveFictionMeta
};
