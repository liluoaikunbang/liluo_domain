<template>
  <GameShell
    :player-portrait-status-text="playerPortraitStatusText"
    :player-portrait-src="playerPortraitSrc"
    :hide-player-portrait="hidePlayerPortrait"
    :player-status-icons="playerStatusIcons"
  >
    <template #center>
      <GameInteractiveFictionView
        :payload="payload"
        :background-src="backgroundSrc"
        @choose="$emit('choose', $event)"
      />
    </template>

    <template #right>
      <GameInteractiveFictionPanel
        :payload="payload"
        @restart="$emit('restart')"
        @leave="$emit('leave')"
      />
    </template>

    <template #overlay>
      <slot name="overlay"></slot>
    </template>
  </GameShell>
</template>

<script setup>
import GameShell from '../../shell/GameShell.vue';
import GameInteractiveFictionPanel from './GameInteractiveFictionPanel.vue';
import GameInteractiveFictionView from './GameInteractiveFictionView.vue';

defineProps({
  playerPortraitStatusText: {
    type: String,
    required: true
  },
  playerPortraitSrc: {
    type: String,
    required: true
  },
  playerStatusIcons: {
    type: Array,
    default: () => []
  },
  hidePlayerPortrait: {
    type: Boolean,
    default: false
  },
  payload: {
    type: Object,
    required: true
  },
  backgroundSrc: {
    type: String,
    default: ''
  }
});

defineEmits(['choose', 'restart', 'leave']);
</script>
