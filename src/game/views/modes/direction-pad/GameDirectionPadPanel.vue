<template>
  <GameSidePanel side="right" aria-label="方向键小游戏状态" title="场景状态">
    <div class="direction-pad-panel">
      <GameScrollArea class="direction-pad-panel__content">
        <section class="direction-pad-panel__section">
          <p class="direction-pad-panel__kicker">进度</p>
          <p class="direction-pad-panel__status" :class="`direction-pad-panel__status--${payload.state.status}`">
            {{ statusText }}
          </p>
          <p class="direction-pad-panel__text">
            {{ payload.currentNoteIndex }} / {{ payload.definition.targetSequence.length }}
          </p>
        </section>

        <section class="direction-pad-panel__section">
          <p class="direction-pad-panel__kicker">错误比例</p>
          <p class="direction-pad-panel__ratio">{{ errorRateText }}</p>
          <p class="direction-pad-panel__text">
            错误 {{ payload.errorCount }} 次
          </p>
        </section>

        <section class="direction-pad-panel__section">
          <p class="direction-pad-panel__kicker">输入方式</p>
          <p class="direction-pad-panel__text">点击左侧方向键，或使用键盘方向键 / WASD。</p>
        </section>
      </GameScrollArea>

      <div class="direction-pad-panel__actions">
        <button class="direction-pad-panel__action" type="button" @click="$emit('restart')">
          重新开始
        </button>
        <button class="direction-pad-panel__action" type="button" @click="$emit('leave')">
          离开
        </button>
      </div>
    </div>
  </GameSidePanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DirectionPadGamePayload } from '../../../core/directionPadGame';
import GameScrollArea from '../../components/base/GameScrollArea.vue';
import GameSidePanel from '../../shell/GameSidePanel.vue';

const props = defineProps<{
  payload: DirectionPadGamePayload;
}>();

defineEmits<{
  restart: [];
  leave: [];
}>();

const statusText = computed(() => {
  if (props.payload.state.status === 'countdown') {
    return '准备中';
  }

  if (props.payload.state.status === 'success') {
    return '完成';
  }

  return '进行中';
});

const errorRateText = computed(() => `${Math.round(props.payload.errorRate * 100)}%`);
</script>

<style scoped>
.direction-pad-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.direction-pad-panel__content {
  flex: 1;
  min-height: 0;
  padding: 10px 12px 0;
  box-sizing: border-box;
}

.direction-pad-panel__section {
  padding: 0 0 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.direction-pad-panel__section:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}

.direction-pad-panel__kicker {
  margin: 0 0 10px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.3;
  font-weight: 500;
}

.direction-pad-panel__text {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  line-height: 1.6;
}

.direction-pad-panel__ratio {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 24px;
  line-height: 1.15;
  font-weight: 700;
}

.direction-pad-panel__status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  margin: 0 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(87, 66, 101, 0.78);
  font-size: 13px;
  line-height: 1.35;
}

.direction-pad-panel__status--success {
  background: rgba(58, 124, 101, 0.82);
}

.direction-pad-panel__status--countdown {
  background: rgba(128, 91, 50, 0.82);
}

.direction-pad-panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 0 0 auto;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  box-sizing: border-box;
  background: rgba(45, 20, 53, 0.88);
}

.direction-pad-panel__action {
  width: 100%;
  min-height: 32px;
  padding: 7px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(173, 75, 154, 0.86);
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  cursor: pointer;
}

.direction-pad-panel__action:hover,
.direction-pad-panel__action:focus-visible {
  outline: none;
  border-color: rgba(255, 255, 255, 0.46);
  background: rgba(198, 92, 178, 0.95);
}
</style>
