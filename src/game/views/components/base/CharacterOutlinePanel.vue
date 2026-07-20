<template>
  <section class="character-outline-panel" aria-label="世界人物与组织目录">
    <header class="character-outline-toolbar">
      <label class="character-outline-search">
        <span>搜索人物/组织</span>
        <input v-model="query" type="search" placeholder="姓名、介绍、地点或出现条目" />
      </label>
      <label class="character-outline-kind-filter">
        <span>类型筛选</span>
        <select v-model="characterKind">
          <option value="">全部</option>
          <option value="person">人物</option>
          <option value="organization">组织</option>
        </select>
      </label>
      <span class="character-outline-count">{{ filteredCharacters.length }} / {{ activeWorld?.characterCount ?? 0 }}</span>
    </header>

    <div class="character-outline-browser">
      <GameScrollArea class="character-outline-world-scroll">
        <nav class="character-outline-worlds" aria-label="世界列表">
          <button
            v-for="world in catalog.worlds"
            :key="world.id"
            class="character-outline-world"
            :class="{ 'character-outline-world-active': activeWorldId === world.id }"
            type="button"
            @click="activeWorldId = world.id"
          >
            <span>{{ world.label }}</span>
            <small>{{ world.characterCount }}</small>
          </button>
        </nav>
      </GameScrollArea>

      <GameScrollArea class="character-outline-list" role="list" aria-label="人物列表">
        <button
          v-for="character in filteredCharacters"
          :key="character.id"
          class="character-outline-entry"
          :class="{ 'character-outline-entry-active': activeCharacterId === character.id }"
          type="button"
          @click="activeCharacterId = character.id"
        >
          <span class="character-outline-avatar" aria-hidden="true">{{ character.name.slice(0, 1) }}</span>
          <span>
            <strong>{{ character.name }}</strong>
            <small>{{ character.kind === 'organization' ? '组织' : `${character.appearances.length} 个相关条目` }}</small>
          </span>
        </button>
        <p v-if="filteredCharacters.length === 0" class="character-outline-empty">
          {{ query || characterKind ? '没有匹配的人物或组织。' : '这个世界还没有收录人物或组织。' }}
        </p>
      </GameScrollArea>

      <GameScrollArea ref="detailScrollArea" class="character-outline-detail">
        <article v-if="activeCharacter" class="character-outline-detail-content" aria-live="polite">
          <span class="character-outline-kicker">{{ activeWorld?.label }} · {{ activeCharacter.kind === 'organization' ? '组织记录' : '人物记录' }}</span>
          <h2>{{ activeCharacter.name }}</h2>
          <p class="character-outline-intro">{{ characterIntroduction }}</p>

          <section v-if="activeCharacter.relatedNotes.length" class="character-outline-section">
            <h3>相关内容</h3>
            <ul>
              <li v-for="note in activeCharacter.relatedNotes" :key="note">{{ note }}</li>
            </ul>
          </section>

          <section v-if="activeCharacter.locations.length || activeCharacter.tags.length" class="character-outline-section">
            <h3>资料标签</h3>
            <div class="character-outline-tags">
              <span v-for="location in activeCharacter.locations" :key="`location:${location}`">地点 · {{ location }}</span>
              <span v-for="tag in activeCharacter.tags" :key="`tag:${tag}`">{{ tag }}</span>
            </div>
          </section>

          <section class="character-outline-section">
            <h3>出现条目 <small>{{ activeCharacter.appearances.length }}</small></h3>
            <ol class="character-outline-appearances">
              <li v-for="appearance in activeCharacter.appearances" :key="appearance.key">
                <header>
                  <strong>{{ appearance.title }}</strong>
                  <span v-if="appearance.status">{{ appearance.status }}</span>
                </header>
                <p v-if="appearance.summary">{{ appearance.summary }}</p>
                <div v-if="appearance.storyTags.length || appearance.gameplay.length" class="character-outline-tags">
                  <span v-for="tag in appearance.storyTags" :key="`${appearance.key}:story:${tag}`">故事 · {{ tag }}</span>
                  <span v-for="gameplay in appearance.gameplay" :key="`${appearance.key}:gameplay:${gameplay}`">玩法 · {{ gameplay }}</span>
                </div>
              </li>
            </ol>
          </section>
        </article>
        <p v-else class="character-outline-empty character-outline-empty-detail">从左侧选择一项查看人物或组织资料。</p>
      </GameScrollArea>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { filterStoryCharacters } from '../../../data/story_outline/storyCharacterOutline';
import GameScrollArea from './GameScrollArea.vue';

const props = defineProps({
  catalog: { type: Object, required: true }
});

const query = ref('');
const characterKind = ref('');
const activeWorldId = ref(props.catalog.worlds[0]?.id ?? '');
const activeCharacterId = ref('');
const detailScrollArea = ref(null);
const activeWorld = computed(() => props.catalog.worlds.find((world) => world.id === activeWorldId.value));
const filteredCharacters = computed(() => {
  const characters = activeWorld.value?.characters ?? [];
  return filterStoryCharacters(characters, {
    kind: characterKind.value,
    query: query.value
  });
});
const activeCharacter = computed(() => (
  filteredCharacters.value.find((character) => character.id === activeCharacterId.value)
  ?? filteredCharacters.value[0]
  ?? null
));
const characterIntroduction = computed(() => {
  const character = activeCharacter.value;
  if (!character) return '';
  const firstDetailedAppearance = character.appearances.find((appearance) => appearance.summary);
  return firstDetailedAppearance
    ? `目前资料首先记录于《${firstDetailedAppearance.title}》：${firstDetailedAppearance.summary}`
    : `目前已汇总 ${character.appearances.length} 个与${character.name}相关的故事条目。`;
});

watch(activeWorldId, () => {
  query.value = '';
  characterKind.value = '';
  activeCharacterId.value = activeWorld.value?.characters[0]?.id ?? '';
});

watch(filteredCharacters, (characters) => {
  if (!characters.some((character) => character.id === activeCharacterId.value)) {
    activeCharacterId.value = characters[0]?.id ?? '';
  }
}, { immediate: true });

watch(activeCharacterId, () => {
  detailScrollArea.value?.scrollToTop();
}, { flush: 'post' });

</script>

<style scoped>
.character-outline-panel { min-height: 0; height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr); border: 1px solid rgba(129, 111, 152, 0.42); background: rgba(15, 12, 23, 0.94); }
.character-outline-toolbar { display: flex; align-items: end; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(129, 111, 152, 0.36); }
.character-outline-search, .character-outline-kind-filter { display: grid; gap: 5px; color: #bdb2ca; font-size: 12px; }
.character-outline-search { flex: 1; }
.character-outline-search input, .character-outline-kind-filter select { min-height: 34px; border: 1px solid #5e506d; color: #f5ebda; background: #17121f; padding: 6px 9px; font: inherit; }
.character-outline-search input:focus-visible, .character-outline-kind-filter select:focus-visible { border-color: #d8b36d; outline: 1px solid #d8b36d; outline-offset: 2px; }
.character-outline-count { color: #d8b36d; padding-bottom: 8px; }
.character-outline-browser { min-height: 0; display: grid; grid-template-columns: minmax(170px, .75fr) minmax(210px, .95fr) minmax(320px, 1.6fr); }
.character-outline-world-scroll, .character-outline-list, .character-outline-detail { min-height: 0; }
.character-outline-world-scroll, .character-outline-list { border-right: 1px solid rgba(129, 111, 152, 0.32); }
.character-outline-worlds { padding: 8px; }
.character-outline-world, .character-outline-entry { width: 100%; border: 0; color: #c8bdcf; background: transparent; text-align: left; font: inherit; cursor: pointer; }
.character-outline-world { display: flex; justify-content: space-between; gap: 8px; padding: 9px 8px; }
.character-outline-world small, .character-outline-entry small { color: #877b91; }
.character-outline-world:hover, .character-outline-world:focus-visible, .character-outline-world-active,
.character-outline-entry:hover, .character-outline-entry:focus-visible, .character-outline-entry-active { color: #fff1cf; background: rgba(113, 79, 135, 0.34); outline: none; }
.character-outline-entry { display: grid; grid-template-columns: 38px 1fr; align-items: center; gap: 9px; padding: 10px 12px; border-bottom: 1px solid rgba(129, 111, 152, 0.2); }
.character-outline-entry strong, .character-outline-entry small { display: block; }
.character-outline-entry small { margin-top: 3px; }
.character-outline-avatar { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #715c79; color: #ead7a8; background: #24182d; }
.character-outline-detail { color: #d5cbd9; }
.character-outline-detail-content { padding: 22px; }
.character-outline-kicker { color: #a89bb2; font-size: 12px; }
.character-outline-detail h2 { margin: 5px 0 10px; color: #fff3d5; font-size: 23px; }
.character-outline-intro { margin: 0; line-height: 1.7; color: #d9cedd; }
.character-outline-section { margin-top: 20px; }
.character-outline-section h3 { margin: 0 0 9px; color: #e4c785; font-size: 15px; }
.character-outline-section h3 small { color: #9f91a8; font-weight: normal; }
.character-outline-section ul { display: grid; gap: 6px; margin: 0; padding-left: 20px; line-height: 1.55; }
.character-outline-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.character-outline-tags span { padding: 3px 7px; border: 1px solid #715c79; color: #dbc58d; background: rgba(74, 52, 86, 0.4); font-size: 12px; }
.character-outline-appearances { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.character-outline-appearances li { padding: 11px 12px; border-left: 2px solid #715c79; background: rgba(38, 27, 47, 0.55); }
.character-outline-appearances header { display: flex; justify-content: space-between; gap: 12px; color: #eadbb8; }
.character-outline-appearances header span { color: #9f91a8; font-size: 12px; }
.character-outline-appearances p { margin: 7px 0 9px; line-height: 1.55; }
.character-outline-empty { padding: 18px; color: #897e91; }
.character-outline-empty-detail { margin: 0; }
@media (max-width: 900px) { .character-outline-browser { grid-template-columns: 145px minmax(180px, .9fr) 1.3fr; } .character-outline-detail-content { padding: 16px; } }
</style>
