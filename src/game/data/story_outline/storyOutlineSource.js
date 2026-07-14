import munikaSource from './sources/0-munika.json' with { type: 'json' };
import modernSource from './sources/1-modern.json' with { type: 'json' };
import apocalypseSource from './sources/2-apocalypse.json' with { type: 'json' };
import ancientSource from './sources/3-ancient.json' with { type: 'json' };
import fantasySource from './sources/4-fantasy.json' with { type: 'json' };
import scienceSource from './sources/5-science.json' with { type: 'json' };

export const storyOutlineSources = [
  munikaSource,
  modernSource,
  apocalypseSource,
  ancientSource,
  fantasySource,
  scienceSource
];

export const storyOutlineSource = mergeStoryOutlineSources(storyOutlineSources);

function mergeStoryOutlineSources(sources) {
  return sources.reduce(
    (mergedSource, source) => ({
      rootKeys: [
        ...mergedSource.rootKeys,
        ...(Array.isArray(source.rootKeys) ? source.rootKeys : [])
      ],
      nodes: [
        ...mergedSource.nodes,
        ...(Array.isArray(source.nodes) ? source.nodes : [])
      ]
    }),
    {
      rootKeys: [],
      nodes: []
    }
  );
}

