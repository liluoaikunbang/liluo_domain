<template>
  <GameStageLayout>
    <template #left>
      <GameSidePanel
        v-if="!hidePlayerPortrait"
        side="left"
        aria-label="主角立绘区域"
        :title="playerPortraitStatusText"
        :speaker-state="playerSpeakerState"
      >
        <GamePortraitPanel
          :portrait-src="playerPortraitSrc"
          :portrait-layers="playerPortraitLayers"
          :portrait-back-layers="playerPortraitBackLayers"
          :portrait-motion-mode="playerPortraitMotionMode"
          :status-icons="playerStatusIcons"
        />
      </GameSidePanel>
    </template>

    <template #center>
      <slot name="center"></slot>
    </template>

    <template #right>
      <slot name="right"></slot>
    </template>

    <template #overlay>
      <slot name="overlay"></slot>
    </template>
  </GameStageLayout>
</template>

<script setup>
import GamePortraitPanel from './GamePortraitPanel.vue';
import GameSidePanel from './GameSidePanel.vue';
import GameStageLayout from './GameStageLayout.vue';

defineProps({
  playerPortraitStatusText: {
    type: String,
    required: true
  },
  playerPortraitSrc: {
    type: String,
    required: true
  },
  playerPortraitLayers: {
    type: Array,
    default: () => []
  },
  playerPortraitBackLayers: {
    type: Array,
    default: () => []
  },
  playerStatusIcons: {
    type: Array,
    default: () => []
  },
  playerPortraitMotionMode: {
    type: String,
    default: 'idle'
  },
  hidePlayerPortrait: {
    type: Boolean,
    default: false
  },
  playerSpeakerState: {
    type: String,
    default: 'neutral'
  }
});
</script>
