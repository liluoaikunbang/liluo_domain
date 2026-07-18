<template>
  <div class="gameplay-link-overlay" role="presentation" @click.self="$emit('close')">
    <section
      ref="dialogRef"
      class="gameplay-link-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameplay-link-title"
      tabindex="-1"
      @keydown.esc.stop.prevent="$emit('close')"
    >
      <header class="gameplay-link-header">
        <div>
          <span>故事节点</span>
          <h2 id="gameplay-link-title">{{ node.title }} · 关联玩法</h2>
        </div>
        <button type="button" aria-label="关闭关联玩法" @click="$emit('close')">×</button>
      </header>

      <div class="gameplay-link-tools">
        <label>
          <span>搜索玩法</span>
          <input v-model="query" type="search" placeholder="输入玩法名称或说明" />
        </label>
        <label>
          <span>玩法分类</span>
          <select v-model="categoryId">
            <option value="">全部分类</option>
            <option v-for="category in catalog.categories" :key="category.id" :value="category.id">
              {{ category.title }}
            </option>
          </select>
        </label>
        <strong>已选择 {{ selectedIds.length }} 项</strong>
      </div>

      <div class="gameplay-link-body">
        <div class="gameplay-link-selected" aria-label="已关联玩法">
          <span v-if="selectedEntries.length === 0">尚未选择玩法。</span>
          <button
            v-for="entry in selectedEntries"
            :key="entry.id"
            type="button"
            :aria-label="`取消关联${entry.title}`"
            @click="toggleEntry(entry.id)"
          >
            {{ entry.title }} ×
          </button>
        </div>

        <GameScrollArea class="gameplay-link-list" role="list" aria-label="可关联玩法">
          <div v-for="entry in filteredEntries" :key="entry.id" class="gameplay-link-option">
            <label>
              <input
                type="checkbox"
                :checked="selectedIdSet.has(entry.id)"
                @change="toggleEntry(entry.id)"
              />
              <span class="gameplay-link-number">{{ entry.number }}</span>
              <span>
                <strong>{{ entry.title }}</strong>
                <small>{{ getCategoryTitle(entry.categoryId) }}</small>
              </span>
            </label>
            <button type="button" @click.prevent="$emit('view-gameplay', entry.id)">查看</button>
          </div>
          <p v-if="filteredEntries.length === 0" class="gameplay-link-empty">没有匹配的玩法。</p>
        </GameScrollArea>
      </div>

      <footer class="gameplay-link-footer">
        <p>关联只修改当前页面状态；导出故事 JSON 后再保存到源码。</p>
        <button type="button" @click="$emit('close')">取消</button>
        <button class="gameplay-link-save" type="button" @click="$emit('save', selectedIds)">保存关联</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { findGameplayEntries } from '../../../data/gameplay_outline/gameplayOutline';
import GameScrollArea from './GameScrollArea.vue';

const props = defineProps({
  node: { type: Object, required: true },
  catalog: { type: Object, required: true }
});

defineEmits(['close', 'save', 'view-gameplay']);

const dialogRef = ref(null);
const query = ref('');
const categoryId = ref('');
const selectedIds = ref([...new Set(Array.isArray(props.node.gameplayRefs) ? props.node.gameplayRefs : [])]);
const selectedIdSet = computed(() => new Set(selectedIds.value));
const entryById = computed(() => new Map(props.catalog.entries.map((entry) => [entry.id, entry])));
const categoryById = computed(() => new Map(props.catalog.categories.map((category) => [category.id, category])));
const selectedEntries = computed(() => selectedIds.value.map((id) => entryById.value.get(id)).filter(Boolean));
const filteredEntries = computed(() => findGameplayEntries(props.catalog, {
  categoryId: categoryId.value,
  query: query.value
}));

onMounted(async () => {
  await nextTick();
  dialogRef.value?.focus();
});

function toggleEntry(gameplayId) {
  selectedIds.value = selectedIdSet.value.has(gameplayId)
    ? selectedIds.value.filter((id) => id !== gameplayId)
    : [...selectedIds.value, gameplayId];
}

function getCategoryTitle(gameplayCategoryId) {
  return categoryById.value.get(gameplayCategoryId)?.title ?? '未分类';
}
</script>

<style scoped>
.gameplay-link-overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 24px; background: rgba(5, 4, 9, 0.78); }
.gameplay-link-dialog { width: min(900px, 94vw); height: min(720px, 88vh); display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; border: 1px solid #75647f; color: #d7cddc; background: #14101c; box-shadow: 8px 8px 0 rgba(4, 3, 7, 0.75); }
.gameplay-link-header { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 16px 18px; border-bottom: 1px solid rgba(132, 111, 145, 0.38); }
.gameplay-link-header span { color: #9f91a8; font-size: 12px; }
.gameplay-link-header h2 { margin: 3px 0 0; color: #fff0cd; font-size: 19px; }
.gameplay-link-header button { border: 0; color: #c9bacf; background: transparent; font-size: 24px; cursor: pointer; }
.gameplay-link-tools { display: grid; grid-template-columns: minmax(200px, 1fr) minmax(160px, 0.6fr) auto; gap: 12px; align-items: end; padding: 12px 18px; border-bottom: 1px solid rgba(132, 111, 145, 0.3); }
.gameplay-link-tools label { display: grid; gap: 4px; color: #9f91a8; font-size: 12px; }
.gameplay-link-tools input, .gameplay-link-tools select { min-height: 34px; border: 1px solid #61516c; padding: 6px 8px; color: #f4e9d8; background: #0f0c15; font: inherit; }
.gameplay-link-tools strong { padding-bottom: 8px; color: #d8b36d; font-size: 13px; }
.gameplay-link-body { min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); }
.gameplay-link-selected { min-height: 45px; display: flex; flex-wrap: wrap; gap: 7px; align-items: center; padding: 9px 18px; border-bottom: 1px solid rgba(132, 111, 145, 0.25); color: #817587; }
.gameplay-link-selected button { border: 1px solid #6f5978; padding: 4px 7px; color: #ead7aa; background: rgba(85, 57, 97, 0.45); cursor: pointer; }
.gameplay-link-list { min-height: 0; padding: 7px 12px; }
.gameplay-link-option { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 9px; border-bottom: 1px solid rgba(132, 111, 145, 0.2); }
.gameplay-link-option label { display: grid; grid-template-columns: 22px 34px minmax(0, 1fr); gap: 8px; align-items: center; cursor: pointer; }
.gameplay-link-option:hover { background: rgba(92, 64, 105, 0.28); }
.gameplay-link-option strong, .gameplay-link-option small { display: block; }
.gameplay-link-option small { color: #897c91; margin-top: 2px; }
.gameplay-link-option > button { border: 1px solid #5f5367; color: #bfb0c6; background: #1a1422; cursor: pointer; }
.gameplay-link-number { color: #d8b36d; }
.gameplay-link-empty { padding: 18px; color: #887b90; }
.gameplay-link-footer { display: flex; align-items: center; gap: 9px; padding: 12px 18px; border-top: 1px solid rgba(132, 111, 145, 0.38); }
.gameplay-link-footer p { flex: 1; margin: 0; color: #897c91; font-size: 12px; }
.gameplay-link-footer button { border: 1px solid #62546b; padding: 7px 14px; color: #cec1d4; background: #1a1422; cursor: pointer; }
.gameplay-link-footer .gameplay-link-save { border-color: #9b7b4f; color: #fff0ca; background: #4b3728; }
</style>
