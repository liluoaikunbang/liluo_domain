<template>
  <GameSidePanel
    side="right"
    aria-label="介绍和按钮区域"
    :title="`当前位置：${currentMapName}`"
  >
    <div class="info-placeholder info-card">
      <GameMapActionPanel
        v-if="hasActions"
        :primary-action="primaryAction"
        :map-actions="mapActions"
        @trigger-primary-action="emit('trigger-primary-action')"
        @trigger-map-action="emit('trigger-map-action', $event)"
      />

      <div class="info-section info-section-bottom">
        <p class="info-text">{{ currentMapDescription }}</p>

        <div class="info-toolbar info-toolbar-bottom">
          <button
            class="menu-entry-button"
            type="button"
            :disabled="menuDisabled"
            :aria-disabled="menuDisabled"
            @click="emit('open-portrait-layers')"
          >
            立绘
          </button>
          <button
            class="menu-entry-button"
            type="button"
            :disabled="menuDisabled"
            :aria-disabled="menuDisabled"
            @click="emit('open-menu')"
          >
            菜单
          </button>
        </div>
      </div>
    </div>
  </GameSidePanel>
</template>

<script setup>
import { computed } from 'vue';
import GameSidePanel from '../../shell/GameSidePanel.vue';
import GameMapActionPanel from './GameMapActionPanel.vue';

const props = defineProps({
  currentMapName: {
    type: String,
    required: true
  },
  currentMapDescription: {
    type: String,
    required: true
  },
  primaryAction: {
    type: Object,
    default: null
  },
  mapActions: {
    type: Array,
    default: () => []
  },
  menuDisabled: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['trigger-primary-action', 'trigger-map-action', 'open-menu', 'open-portrait-layers']);

const hasActions = computed(() => Boolean(props.primaryAction) || props.mapActions.length > 0);
</script>

<style scoped>
.info-panel {
  height: 100%;
  display: flex;
  min-width: 0;
}

.info-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  padding: clamp(12px, 1.4vw, 20px);
  box-sizing: border-box;
  border: 1px solid rgba(232, 151, 224, 0.26);
  background: rgba(21, 8, 26, 0.92);
}

.info-card {
  box-shadow: inset 0 0 0 1px rgba(255, 177, 239, 0.08);
}

.info-section {
  border: 1px solid rgba(236, 156, 227, 0.2);
  background: rgba(255, 193, 245, 0.06);
  padding: 12px 14px;
}

.info-section-bottom {
  margin-top: auto;
}

.info-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(13px, 1vw, 16px);
  line-height: 1.7;
}

.info-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.info-toolbar-bottom {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(232, 150, 226, 0.14);
}

.menu-entry-button {
  min-width: 88px;
  min-height: 34px;
  padding: 6px 16px;
  border: 1px solid rgba(244, 202, 237, 0.28);
  background: rgba(117, 62, 131, 0.88);
  color: #fff7fc;
  font-size: 13px;
  letter-spacing: 0.16em;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    opacity 0.2s ease;
}

.menu-entry-button:hover,
.menu-entry-button:focus-visible {
  border-color: rgba(255, 234, 248, 0.46);
  background: rgba(141, 79, 156, 0.96);
  transform: translateY(-1px);
  outline: none;
}

.menu-entry-button:disabled {
  border-color: rgba(223, 187, 220, 0.16);
  background: rgba(109, 73, 117, 0.48);
  color: rgba(255, 239, 249, 0.52);
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 900px) {
  .info-toolbar {
    width: 100%;
  }

  .info-placeholder {
    gap: 8px;
    padding: 10px;
  }
}
</style>
