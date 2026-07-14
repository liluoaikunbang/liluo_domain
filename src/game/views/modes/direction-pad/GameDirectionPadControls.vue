<template>
  <GameSidePanel side="left" aria-label="方向键小游戏操作" :title="payload.definition.title">
    <div class="direction-pad-controls">
      <div class="direction-pad-controls__intro">
        <p class="direction-pad-controls__eyebrow">D-PAD</p>
        <h2 class="direction-pad-controls__title">{{ payload.definition.title }}</h2>
        <p class="direction-pad-controls__subtitle">
          {{ payload.definition.subtitle || '方向键小游戏' }}
        </p>
        <p class="direction-pad-controls__description">{{ payload.definition.description }}</p>
      </div>

      <div class="direction-pad-controls__pad" aria-label="方向按钮">
        <button
          v-for="button in directionButtons"
          :key="button.direction"
          class="direction-pad-controls__button"
          :class="[
            `direction-pad-controls__button--${button.direction}`,
            { 'direction-pad-controls__button--next': payload.nextInput === button.direction }
          ]"
          type="button"
          :aria-label="directionLabels[button.direction].label"
          :disabled="payload.state.status !== 'playing'"
          @click="$emit('press', button.direction, Date.now())"
        >
          <span>{{ directionLabels[button.direction].icon }}</span>
        </button>
      </div>
    </div>
  </GameSidePanel>
</template>

<script setup lang="ts">
import type { DirectionPadGamePayload, DirectionPadInput } from '../../../core/directionPadGame';
import GameSidePanel from '../../shell/GameSidePanel.vue';

defineProps<{
  payload: DirectionPadGamePayload;
}>();

defineEmits<{
  press: [direction: DirectionPadInput, pressedAtMs?: number];
}>();

const directionLabels: Record<DirectionPadInput, { icon: string; label: string }> = {
  up: { icon: '↑', label: '上' },
  right: { icon: '→', label: '右' },
  down: { icon: '↓', label: '下' },
  left: { icon: '←', label: '左' }
};

const directionButtons: ReadonlyArray<{ direction: DirectionPadInput }> = [
  { direction: 'up' },
  { direction: 'left' },
  { direction: 'down' },
  { direction: 'right' }
];
</script>

<style scoped>
.direction-pad-controls {
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: 18px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
}

.direction-pad-controls__intro {
  display: grid;
  gap: 8px;
}

.direction-pad-controls__eyebrow {
  margin: 0;
  color: rgba(255, 224, 156, 0.92);
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0;
}

.direction-pad-controls__title {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.66);
}

.direction-pad-controls__subtitle,
.direction-pad-controls__description {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  line-height: 1.55;
}

.direction-pad-controls__subtitle {
  color: rgba(255, 224, 156, 0.86);
}

.direction-pad-controls__pad {
  justify-self: center;
  align-self: center;
  display: grid;
  grid-template-columns: repeat(3, 56px);
  grid-template-rows: repeat(3, 56px);
  gap: 8px;
}

.direction-pad-controls__button {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  background:
    linear-gradient(180deg, rgba(116, 83, 128, 0.92), rgba(67, 45, 82, 0.92));
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.28);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.direction-pad-controls__button--next {
  border-color: rgba(255, 224, 156, 0.92);
  background:
    linear-gradient(180deg, rgba(177, 126, 73, 0.94), rgba(120, 77, 62, 0.94));
}

.direction-pad-controls__button:hover:not(:disabled),
.direction-pad-controls__button:focus-visible {
  outline: none;
  border-color: rgba(255, 255, 255, 0.56);
  transform: translateY(-1px);
}

.direction-pad-controls__button:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.28);
}

.direction-pad-controls__button:disabled {
  opacity: 0.58;
  cursor: default;
}

.direction-pad-controls__button--up {
  grid-column: 2;
  grid-row: 1;
}

.direction-pad-controls__button--left {
  grid-column: 1;
  grid-row: 2;
}

.direction-pad-controls__button--down {
  grid-column: 2;
  grid-row: 3;
}

.direction-pad-controls__button--right {
  grid-column: 3;
  grid-row: 2;
}

@media (max-width: 900px) {
  .direction-pad-controls {
    padding: 10px;
  }

  .direction-pad-controls__title {
    font-size: 18px;
  }

  .direction-pad-controls__description {
    display: none;
  }

  .direction-pad-controls__pad {
    grid-template-columns: repeat(3, 44px);
    grid-template-rows: repeat(3, 44px);
    gap: 6px;
  }

  .direction-pad-controls__button {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
}
</style>
