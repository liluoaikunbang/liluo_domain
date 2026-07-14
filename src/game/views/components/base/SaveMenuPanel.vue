<template>
            <section class="save-menu-panel" aria-label="存档">
              <article class="menu-card menu-card-primary save-current-card">
                <div class="save-current-info">
                  <span class="save-current-sprite" :style="currentPlayerPreviewStyle" aria-hidden="true"></span>
                  <span class="save-current-map">
                    <strong class="menu-card-title save-current-title">{{ currentMapName || '未知地点' }}</strong>
                    <span class="menu-card-text save-current-location">{{ currentLocationText }}</span>
                  </span>
                  <span class="menu-card-text save-current-status" :title="currentPlayerStatusText">
                    {{ currentPlayerStatusText }}
                  </span>
                  <span class="menu-card-text save-current-resource">{{ formatResourceText('金币', goldAmount) }}</span>
                  <span class="menu-card-text save-current-resource">{{ formatResourceText('绮欲结晶', desireCrystalAmount) }}</span>
                </div>
                <button
                  class="save-menu-action save-menu-action-primary"
                  type="button"
                  :data-menu-nav="true"
                  data-menu-group="save-primary-action"
                  @click="$emit('save-game', undefined)"
                >
                  新增一个存档条目
                </button>
              </article>

              <SaveSlotList
                :saves="saves"
                mode="save"
                aria-label="已有存档"
                empty-text="尚未留下可读取的存档。"
                @save-game="$emit('save-overwrite', $event)"
                @delete-save="$emit('delete-save', $event)"
              />

              <div class="save-menu-footer">
                <button
                  class="save-menu-action"
                  type="button"
                  :data-menu-nav="true"
                  data-menu-group="save-footer-actions"
                  @click="$emit('export-saves')"
                >
                  导出全部存档 JSON
                </button>
                <button
                  class="save-menu-action save-menu-action-danger"
                  type="button"
                  :disabled="saves.length === 0"
                  :data-menu-nav="true"
                  data-menu-group="save-footer-actions"
                  @click="$emit('delete-all-saves')"
                >
                  清空全部浏览器存档
                </button>
              </div>
            </section>
</template>

<script setup>
import SaveSlotList from './SaveSlotList.vue';
import { formatResourceText } from './gameMenuHelpers';

defineProps({
  saves: {
    type: Array,
    default: () => []
  },
  currentPlayerPreviewStyle: {
    type: Object,
    default: () => ({})
  },
  currentMapName: {
    type: String,
    default: ''
  },
  currentLocationText: {
    type: String,
    default: ''
  },
  currentPlayerStatusText: {
    type: String,
    default: ''
  },
  goldAmount: {
    type: Number,
    default: 0
  },
  desireCrystalAmount: {
    type: Number,
    default: 0
  }
});

defineEmits(['save-game', 'save-overwrite', 'delete-save', 'export-saves', 'delete-all-saves']);
</script>
