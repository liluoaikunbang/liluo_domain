import { storyOutlineSource } from './storyOutlineSource.js';

const organizationNames = new Set(['缄枷会', '盐坞帮', '夜栈']);

export function buildStoryCharacterOutline(source) {
  const nodes = Array.isArray(source?.nodes) ? source.nodes : [];
  const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
  const worlds = resolveWorlds(source, nodeByKey);
  const worldById = new Map(worlds.map((world) => [world.id, world]));

  nodes.forEach((node) => {
    const characterNames = Array.isArray(node.characters) ? node.characters : [];
    const world = worldById.get(node.world);

    if (!world || characterNames.length === 0) {
      return;
    }

    characterNames.forEach((name) => {
      let character = world.characters.find((entry) => entry.name === name);

      if (!character) {
        character = {
          id: `${world.id}:${name}`,
          name,
          kind: organizationNames.has(name) ? 'organization' : 'person',
          appearances: [],
          locations: [],
          tags: [],
          relatedNotes: []
        };
        world.characters.push(character);
      }

      character.appearances.push({
        key: node.key,
        title: node.title,
        status: node.status ?? '',
        summary: node.summary ?? '',
        storyTags: uniqueStrings(node.storyTags),
        gameplay: uniqueStrings(node.specialGameplay)
      });
      appendUnique(character.locations, node.locations);
      appendUnique(character.tags, node.plotTags);
      appendUnique(character.tags, node.bondageTags);
      appendUnique(character.relatedNotes, node.foreshadowing);
    });
  });

  worlds.forEach((world) => {
    world.characterCount = world.characters.length;
    world.appearanceCount = world.characters.reduce(
      (total, character) => total + character.appearances.length,
      0
    );
  });

  return {
    worlds,
    characterCount: worlds.reduce((total, world) => total + world.characterCount, 0)
  };
}

export function filterStoryCharacters(characters, options = {}) {
  const kind = options.kind ?? '';
  const searchText = String(options.query ?? '').trim().toLocaleLowerCase('zh-CN');

  return (Array.isArray(characters) ? characters : []).filter((character) => {
    if (kind && character.kind !== kind) return false;
    if (!searchText) return true;

    return [
      character.name,
      ...(character.locations ?? []),
      ...(character.tags ?? []),
      ...(character.relatedNotes ?? []),
      ...(character.appearances ?? []).flatMap((appearance) => [appearance.title, appearance.summary])
    ].join(' ').toLocaleLowerCase('zh-CN').includes(searchText);
  });
}

function resolveWorlds(source, nodeByKey) {
  return (Array.isArray(source?.rootKeys) ? source.rootKeys : [])
    .map((rootKey) => nodeByKey.get(rootKey))
    .filter(Boolean)
    .map((rootNode) => ({
      id: rootNode.world,
      key: rootNode.key,
      label: rootNode.title,
      summary: rootNode.summary ?? '',
      characters: [],
      characterCount: 0,
      appearanceCount: 0
    }));
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function appendUnique(target, values) {
  uniqueStrings(values).forEach((value) => {
    if (!target.includes(value)) {
      target.push(value);
    }
  });
}

export const storyCharacterOutline = buildStoryCharacterOutline(storyOutlineSource);
