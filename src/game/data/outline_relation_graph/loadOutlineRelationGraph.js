import { storyOutlineSource } from '../story_outline/storyOutlineSource.js';
import { storyCharacterOutline } from '../story_outline/storyCharacterOutline.js';
import { plotOutline } from '../plot_outline/plotOutline.js';
import { gameplayOutline } from '../gameplay_outline/gameplayOutline.js';
import { buildOutlineRelationGraph } from './buildOutlineRelationGraph.js';
import { SEEDED_CONCEPTS } from './conceptRegistry.js';

import auditRegistry from '../../../../docs/知识检索校准/registry.json' with { type: 'json' };
import articleRegistry from '../../../../docs/写作资产/外部风格研究/article-registry.json' with { type: 'json' };
import styleTaxonomy from '../../../../project-navigation/style-taxonomy.json' with { type: 'json' };
import cardRules from '../../../../external-knowledge/card-rules.json' with { type: 'json' };

const ragCardModules = import.meta.glob('../../../../external-knowledge/cards/**/*.json', {
  eager: true,
  import: 'default'
});

let cachedGraph = null;
let cachedBuiltAt = '';

export function listBundledRagCards() {
  return Object.values(ragCardModules).filter(Boolean);
}

export function listBundledStyleArticles() {
  return Array.isArray(articleRegistry?.articles) ? articleRegistry.articles : [];
}

/**
 * Build (and memoize) the runtime graph projection from live project sources.
 */
export function getOutlineRelationGraph(options = {}) {
  const forceRebuild = Boolean(options.forceRebuild);
  if (cachedGraph && !forceRebuild) {
    return cachedGraph;
  }

  cachedGraph = buildOutlineRelationGraph({
    storySource: storyOutlineSource,
    plotCatalog: plotOutline,
    gameplayCatalog: gameplayOutline,
    characterOutline: storyCharacterOutline,
    ragCards: listBundledRagCards(),
    cardRules,
    styleArticles: listBundledStyleArticles(),
    styleTaxonomy,
    concepts: SEEDED_CONCEPTS,
    auditRegistry,
    builtAt: new Date().toISOString()
  });
  cachedBuiltAt = cachedGraph.builtAt;
  return cachedGraph;
}

export function getOutlineRelationGraphCacheInfo() {
  return {
    builtAt: cachedBuiltAt,
    hasCache: Boolean(cachedGraph),
    nodeCount: cachedGraph?.nodes?.length ?? 0,
    edgeCount: cachedGraph?.edges?.length ?? 0
  };
}

export function invalidateOutlineRelationGraphCache() {
  cachedGraph = null;
  cachedBuiltAt = '';
}
