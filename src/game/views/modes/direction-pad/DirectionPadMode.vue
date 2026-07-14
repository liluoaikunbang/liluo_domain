<template>
  <GameStageLayout>
    <template #left>
      <GameDirectionPadControls
        :payload="payload"
        @press="(direction, pressedAtMs) => $emit('press', direction, pressedAtMs)"
      />
    </template>

    <template #center>
      <GameDirectionPadView
        :payload="payload"
        @press="(direction, pressedAtMs) => $emit('press', direction, pressedAtMs)"
        @expire="$emit('expire', $event)"
        @countdown-complete="$emit('countdownComplete', $event)"
      />
    </template>

    <template #right>
      <GameDirectionPadPanel
        :payload="payload"
        @restart="$emit('restart')"
        @leave="$emit('leave')"
      />
    </template>

    <template #overlay>
      <slot name="overlay"></slot>
    </template>
  </GameStageLayout>
</template>

<script setup lang="ts">
import type { DirectionPadGamePayload, DirectionPadInput } from '../../../core/directionPadGame';
import GameStageLayout from '../../shell/GameStageLayout.vue';
import GameDirectionPadControls from './GameDirectionPadControls.vue';
import GameDirectionPadPanel from './GameDirectionPadPanel.vue';
import GameDirectionPadView from './GameDirectionPadView.vue';

defineProps<{
  playerPortraitStatusText?: string;
  playerPortraitSrc?: string;
  payload: DirectionPadGamePayload;
}>();

defineEmits<{
  press: [direction: DirectionPadInput, pressedAtMs?: number];
  expire: [checkedAtMs: number];
  countdownComplete: [checkedAtMs: number];
  restart: [];
  leave: [];
}>();
</script>
