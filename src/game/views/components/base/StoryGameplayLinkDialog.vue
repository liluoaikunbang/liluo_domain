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

      <div class="gameplay-link-body">
        <GameScrollArea class="gameplay-link-list" role="list" aria-label="已关联玩法">
          <article v-for="entry in linkedEntries" :key="entry.id" class="gameplay-link-option" role="listitem">
            <div>
              <span class="gameplay-link-number">{{ entry.number }}</span>
              <span>
                <strong>{{ entry.title }}</strong>
                <small>{{ getCategoryTitle(entry.categoryId) }}</small>
              </span>
            </div>
            <p>{{ entry.summary }}</p>
            <button type="button" @click="$emit('view-gameplay', entry.id)">查看玩法</button>
          </article>
          <p v-if="linkedEntries.length === 0" class="gameplay-link-empty">暂无有效的关联玩法。</p>
        </GameScrollArea>
      </div>

      <footer class="gameplay-link-footer">
        <p>关联玩法由故事大纲数据统一配置。</p>
        <button type="button" @click="$emit('close')">关闭</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { resolveStoryGameplayLinks } from '../../../data/gameplay_outline/gameplayOutline';
import GameScrollArea from './GameScrollArea.vue';

const props = defineProps({
  node: { type: Object, required: true },
  catalog: { type: Object, required: true }
});

defineEmits(['close', 'view-gameplay']);

const dialogRef = ref(null);
const categoryById = computed(() => new Map(props.catalog.categories.map((category) => [category.id, category])));
const linkedEntries = computed(() => resolveStoryGameplayLinks(props.node, props.catalog));

onMounted(async () => {
  await nextTick();
  dialogRef.value?.focus();
});

function getCategoryTitle(gameplayCategoryId) {
  return categoryById.value.get(gameplayCategoryId)?.title ?? '未分类';
}
</script>

<style scoped>
.gameplay-link-overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 24px; background: rgba(5, 4, 9, 0.78); }
.gameplay-link-dialog { width: min(760px, 94vw); max-height: min(680px, 88vh); display: grid; grid-template-rows: auto minmax(0, 1fr) auto; border: 1px solid #75647f; color: #d7cddc; background: #14101c; box-shadow: 8px 8px 0 rgba(4, 3, 7, 0.75); }
.gameplay-link-header { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 16px 18px; border-bottom: 1px solid rgba(132, 111, 145, 0.38); }
.gameplay-link-header span { color: #9f91a8; font-size: 12px; }
.gameplay-link-header h2 { margin: 3px 0 0; color: #fff0cd; font-size: 19px; }
.gameplay-link-header button { border: 0; color: #c9bacf; background: transparent; font-size: 24px; cursor: pointer; }
.gameplay-link-body { min-height: 0; }
.gameplay-link-list { min-height: 0; padding: 7px 12px; }
.gameplay-link-option { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 14px; align-items: center; padding: 13px 9px; border-bottom: 1px solid rgba(132, 111, 145, 0.2); }
.gameplay-link-option > div { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 8px; align-items: center; }
.gameplay-link-option:hover { background: rgba(92, 64, 105, 0.28); }
.gameplay-link-option strong, .gameplay-link-option small { display: block; }
.gameplay-link-option small { color: #897c91; margin-top: 2px; }
.gameplay-link-option p { grid-column: 1 / -1; margin: 0; color: #a99daf; font-size: 12px; line-height: 1.6; }
.gameplay-link-option > button { border: 1px solid #5f5367; color: #bfb0c6; background: #1a1422; cursor: pointer; }
.gameplay-link-number { color: #d8b36d; }
.gameplay-link-empty { padding: 18px; color: #887b90; }
.gameplay-link-footer { display: flex; align-items: center; gap: 9px; padding: 12px 18px; border-top: 1px solid rgba(132, 111, 145, 0.38); }
.gameplay-link-footer p { flex: 1; margin: 0; color: #897c91; font-size: 12px; }
.gameplay-link-footer button { border: 1px solid #62546b; padding: 7px 14px; color: #cec1d4; background: #1a1422; cursor: pointer; }
.gameplay-link-footer .gameplay-link-save { border-color: #9b7b4f; color: #fff0ca; background: #4b3728; }
</style>
