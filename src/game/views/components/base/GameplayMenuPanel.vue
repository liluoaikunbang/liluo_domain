<template>
  <section class="gameplay-panel" aria-label="玩法总表">
    <header class="gameplay-toolbar">
      <label class="gameplay-search">
        <span>搜索玩法</span>
        <input v-model="query" type="search" placeholder="名称、说明、细分玩法或设计参考" />
      </label>
      <label class="gameplay-mode-filter">
        <span>地图适配</span>
        <select v-model="presentationMode">
          <option value="">全部适配</option>
          <option v-for="(label, key) in catalog.presentationModes" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </label>
      <span class="gameplay-result-count">{{ filteredEntries.length }} / {{ catalog.entries.length }}</span>
      <button class="gameplay-export-button" type="button" @click="exportGameplayJson">导出JSON</button>
    </header>

    <div class="gameplay-browser">
      <GameScrollArea class="gameplay-category-scroll">
      <nav class="gameplay-categories" aria-label="玩法分类">
        <button
          class="gameplay-category"
          :class="{ 'gameplay-category-active': !activeCategoryId }"
          type="button"
          @click="selectCategory('')"
        >
          全部玩法
        </button>
        <button
          v-for="category in catalog.categories"
          :key="category.id"
          class="gameplay-category"
          :class="{ 'gameplay-category-active': activeCategoryId === category.id }"
          type="button"
          @click="selectCategory(category.id)"
        >
          <span>{{ category.title }}</span>
          <small>{{ countEntries(category.id) }}</small>
        </button>
      </nav>
      </GameScrollArea>

      <GameScrollArea class="gameplay-entry-list" role="list" aria-label="玩法列表">
          <button
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="gameplay-entry"
            :class="{ 'gameplay-entry-active': activeGameplayId === entry.id }"
            type="button"
            @click="activeGameplayId = entry.id"
          >
            <span class="gameplay-entry-number">{{ entry.number }}</span>
            <span>
              <strong>
                <template v-for="(segment, index) in getHighlightedSegments(entry.title)" :key="index">
                  <mark v-if="segment.match" class="gameplay-search-match">{{ segment.text }}</mark>
                  <template v-else>{{ segment.text }}</template>
                </template>
              </strong>
              <small>{{ getCategoryTitle(entry.categoryId) }}</small>
            </span>
          </button>
          <p v-if="filteredEntries.length === 0" class="gameplay-empty">没有匹配的玩法。</p>
      </GameScrollArea>

      <GameScrollArea ref="gameplayDetailScrollArea" class="gameplay-detail">
        <article class="gameplay-detail-content" aria-live="polite">
        <template v-if="activeEntry">
          <span class="gameplay-detail-kicker">玩法 {{ activeEntry.number }} · {{ getCategoryTitle(activeEntry.categoryId) }}</span>
          <h2>
            <template v-for="(segment, index) in getHighlightedSegments(activeEntry.title)" :key="index">
              <mark v-if="segment.match" class="gameplay-search-match">{{ segment.text }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </h2>
          <div v-if="activeEntry.presentationModes.length" class="gameplay-mode-tags" aria-label="适配方式">
            <span v-for="mode in activeEntry.presentationModes" :key="mode">{{ catalog.presentationModes[mode] }}</span>
          </div>
          <dl v-if="activeEntry.designReferences.length" class="gameplay-design-references">
            <dt>设计参考</dt>
            <dd>
              <template v-for="(segment, index) in getHighlightedSegments(activeEntry.designReferences.join('、'))" :key="index">
                <mark v-if="segment.match" class="gameplay-search-match">{{ segment.text }}</mark>
                <template v-else>{{ segment.text }}</template>
              </template>
            </dd>
          </dl>
          <p>
            <template v-for="(segment, index) in getHighlightedSegments(activeEntry.summary)" :key="index">
              <mark v-if="segment.match" class="gameplay-search-match">{{ segment.text }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </p>
          <section v-if="activeEntry.variants.length" class="gameplay-variants">
            <h3>细分玩法</h3>
            <ol class="gameplay-variant-list">
              <li v-for="variant in activeEntry.variants" :key="variant.id">
                <strong>
                  <template v-for="(segment, index) in getHighlightedSegments(variant.title)" :key="index">
                    <mark v-if="segment.match" class="gameplay-search-match">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </strong>
                <span v-if="variant.description">
                  <template v-for="(segment, index) in getHighlightedSegments(variant.description)" :key="index">
                    <mark v-if="segment.match" class="gameplay-search-match">{{ segment.text }}</mark>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </span>
              </li>
            </ol>
          </section>
        </template>
        <p v-else class="gameplay-empty">从左侧选择一项查看详情。</p>
        </article>
      </GameScrollArea>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { createGameplayExportPayload, findGameplayEntries } from '../../../data/gameplay_outline/gameplayOutline';
import GameScrollArea from './GameScrollArea.vue';
import { downloadJsonPayload } from './jsonDownload';

const props = defineProps({
  catalog: { type: Object, required: true },
  selectedGameplayId: { type: String, default: '' }
});

const query = ref('');
const presentationMode = ref('');
const activeCategoryId = ref('');
const activeGameplayId = ref(props.selectedGameplayId || props.catalog.entries[0]?.id || '');
const gameplayDetailScrollArea = ref(null);

const filteredEntries = computed(() => findGameplayEntries(props.catalog, {
  categoryId: activeCategoryId.value,
  presentationMode: presentationMode.value,
  query: query.value
}));
const entryById = computed(() => new Map(props.catalog.entries.map((entry) => [entry.id, entry])));
const categoryById = computed(() => new Map(props.catalog.categories.map((category) => [category.id, category])));
const activeEntry = computed(() => entryById.value.get(activeGameplayId.value));

watch(() => props.selectedGameplayId, (gameplayId) => {
  if (!gameplayId) return;
  activeGameplayId.value = gameplayId;
  activeCategoryId.value = entryById.value.get(gameplayId)?.categoryId ?? '';
});

watch([activeCategoryId, query, presentationMode], () => {
  if (!filteredEntries.value.some((entry) => entry.id === activeGameplayId.value)) {
    activeGameplayId.value = filteredEntries.value[0]?.id ?? '';
  }
});

watch(activeGameplayId, () => {
  gameplayDetailScrollArea.value?.scrollToTop();
}, { flush: 'post' });

function countEntries(categoryId) {
  return props.catalog.entries.filter((entry) => entry.categoryId === categoryId).length;
}

function selectCategory(categoryId) {
  activeCategoryId.value = categoryId;
  if (!filteredEntries.value.some((entry) => entry.id === activeGameplayId.value)) {
    activeGameplayId.value = filteredEntries.value[0]?.id ?? '';
  }
}

function getCategoryTitle(categoryId) {
  return categoryById.value.get(categoryId)?.title ?? '未分类';
}

function getHighlightedSegments(value) {
  const text = String(value ?? '');
  const searchText = query.value.trim();
  if (!searchText) return [{ text, match: false }];

  const normalizedText = text.toLocaleLowerCase('zh-CN');
  const normalizedSearchText = searchText.toLocaleLowerCase('zh-CN');
  const segments = [];
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(normalizedSearchText);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) segments.push({ text: text.slice(cursor, matchIndex), match: false });
    const matchEnd = matchIndex + searchText.length;
    segments.push({ text: text.slice(matchIndex, matchEnd), match: true });
    cursor = matchEnd;
    matchIndex = normalizedText.indexOf(normalizedSearchText, cursor);
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments.length ? segments : [{ text, match: false }];
}

function exportGameplayJson() {
  const payload = createGameplayExportPayload(props.catalog);
  downloadJsonPayload(payload, 'liluo-gameplay-outline.json');
}
</script>

<style scoped>
.gameplay-panel {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border: 1px solid rgba(129, 111, 152, 0.42);
  background: rgba(15, 12, 23, 0.94);
}
.gameplay-toolbar { display: flex; align-items: end; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(129, 111, 152, 0.36); }
.gameplay-search, .gameplay-mode-filter { display: grid; gap: 5px; color: #bdb2ca; font-size: 12px; }
.gameplay-search { flex: 1; }
.gameplay-search input, .gameplay-mode-filter select { min-height: 34px; border: 1px solid #5e506d; color: #f5ebda; background: #17121f; padding: 6px 9px; font: inherit; }
.gameplay-result-count { color: #d8b36d; padding-bottom: 8px; }
.gameplay-export-button { min-height: 34px; border: 1px solid #715c79; color: #ead7a8; background: rgba(74, 52, 86, 0.5); padding: 6px 11px; font: inherit; cursor: pointer; }
.gameplay-export-button:hover, .gameplay-export-button:focus-visible { color: #fff4d8; background: rgba(113, 79, 135, 0.48); outline: 1px solid #d8b36d; outline-offset: 2px; }
.gameplay-browser { min-height: 0; display: grid; grid-template-columns: minmax(170px, 0.72fr) minmax(220px, 1fr) minmax(300px, 1.6fr); }
.gameplay-category-scroll, .gameplay-entry-list, .gameplay-detail { min-height: 0; }
.gameplay-category-scroll { border-right: 1px solid rgba(129, 111, 152, 0.32); }
.gameplay-categories { padding: 8px; }
.gameplay-category, .gameplay-entry { width: 100%; border: 0; color: #c8bdcf; background: transparent; text-align: left; font: inherit; cursor: pointer; }
.gameplay-category { display: flex; justify-content: space-between; gap: 8px; padding: 8px; }
.gameplay-category small { color: #877b91; }
.gameplay-category:hover, .gameplay-category:focus-visible, .gameplay-category-active { color: #fff1cf; background: rgba(113, 79, 135, 0.34); outline: none; }
.gameplay-entry-list { border-right: 1px solid rgba(129, 111, 152, 0.32); }
.gameplay-entry { display: grid; grid-template-columns: 32px 1fr; gap: 8px; padding: 10px 12px; border-bottom: 1px solid rgba(129, 111, 152, 0.2); }
.gameplay-entry strong, .gameplay-entry small { display: block; }
.gameplay-entry small { margin-top: 3px; color: #82768d; }
.gameplay-entry-number { color: #d8b36d; font-variant-numeric: tabular-nums; }
.gameplay-entry:hover, .gameplay-entry:focus-visible, .gameplay-entry-active { color: #fff4d8; background: rgba(94, 68, 113, 0.35); outline: none; }
.gameplay-detail { color: #d5cbd9; }
.gameplay-detail-content { padding: 22px; }
.gameplay-detail h2 { margin: 5px 0 12px; color: #fff3d5; font-size: 21px; }
.gameplay-detail h3 { color: #e4c785; font-size: 15px; }
.gameplay-detail-kicker { color: #a89bb2; font-size: 12px; }
.gameplay-mode-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.gameplay-mode-tags span { padding: 3px 7px; border: 1px solid #715c79; color: #dbc58d; background: rgba(74, 52, 86, 0.4); }
.gameplay-design-references { display: grid; grid-template-columns: auto 1fr; gap: 8px; margin: 0 0 14px; }
.gameplay-design-references dt { color: #9f91a8; }
.gameplay-design-references dd { margin: 0; color: #ddc88f; }
.gameplay-search-match { padding: 0 2px; color: #21170b; background: #e8c66f; box-shadow: 0 0 0 1px rgba(255, 239, 183, 0.28); }
.gameplay-variant-list { display: grid; gap: 8px; padding-left: 22px; line-height: 1.55; }
.gameplay-variant-list strong { margin-right: 6px; color: #eadbb8; }
.gameplay-empty { padding: 18px; color: #897e91; }
@media (max-width: 900px) { .gameplay-toolbar { flex-wrap: wrap; } .gameplay-search { flex-basis: 100%; } .gameplay-browser { grid-template-columns: 150px minmax(190px, 0.9fr) 1.3fr; } }
</style>
