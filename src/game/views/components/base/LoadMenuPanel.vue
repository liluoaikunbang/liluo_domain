<template>
            <section class="save-menu-panel" aria-label="读档">
              <SaveSlotList
                :saves="saves"
                mode="load"
                aria-label="可读存档"
                empty-text="还没有可以读取的本机暂存。"
                @load-game="$emit('load-game', $event)"
              />

              <div class="save-menu-footer">
                <button
                  class="save-menu-action"
                  type="button"
                  :data-menu-nav="true"
                  data-menu-group="load-footer-actions"
                  @click="triggerImportFile"
                >
                  从本地 JSON 导入
                </button>
                <input
                  ref="importInputRef"
                  class="save-menu-file-input"
                  type="file"
                  accept="application/json,.json"
                  @change="$emit('import-file-change', $event)"
                >
              </div>
            </section>
</template>

<script setup>
import { ref } from 'vue';
import SaveSlotList from './SaveSlotList.vue';

defineProps({
  saves: {
    type: Array,
    default: () => []
  }
});

defineEmits(['load-game', 'import-file-change']);

const importInputRef = ref(null);

const triggerImportFile = () => {
  importInputRef.value?.click();
};
</script>
