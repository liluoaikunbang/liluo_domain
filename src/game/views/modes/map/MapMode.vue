<template>
  <GameShell
    :player-portrait-status-text="playerPortraitStatusText"
    :player-portrait-src="playerPortraitSrc"
    :player-portrait-layers="playerPortraitLayers"
    :player-portrait-back-layers="playerPortraitBackLayers"
    :player-portrait-motion-mode="playerPortraitMotionMode"
    :hide-player-portrait="hidePlayerPortrait"
    :player-status-icons="playerStatusIcons"
    :player-speaker-state="playerSpeakerState"
  >
    <template #center>
      <div id="phaser-game-container"></div>
      <div
        v-if="shouldShowLoadingProgress"
        class="game-map-loading"
        role="status"
        aria-live="polite"
        :aria-label="loadingAriaLabel"
      >
        <div class="game-map-loading__panel">
          <div class="game-map-loading__header">
            <span class="game-map-loading__title">地图载入中</span>
            <span class="game-map-loading__percent">{{ loadingPercent }}%</span>
          </div>
          <div class="game-map-loading__bar" aria-hidden="true">
            <div class="game-map-loading__bar-fill" :style="loadingBarStyle"></div>
          </div>
          <p class="game-map-loading__label">{{ loadingProgress.label }}</p>
        </div>
      </div>
      <GameRuntimeErrorBar :errors="runtimeErrors" />
      <div
        v-if="activeSceneImageSrc"
        class="game-scene-image-overlay"
        :class="{ 'game-scene-image-overlay--previewing': isSceneImagePreviewing }"
        aria-label="事件场景背景图"
      >
        <img
          class="game-scene-image-overlay__image"
          :src="activeSceneImageSrc"
          :alt="activeSceneImageAlt"
        />
      </div>
      <div
        v-if="activeCutscene"
        class="game-dialogue-cutscene"
        :class="`game-dialogue-cutscene--${activeCutscene.phase}`"
        :style="cutsceneStyle"
        aria-live="polite"
      >
        <p class="game-dialogue-cutscene__text">{{ activeCutscene.text }}</p>
      </div>
      <GameNotificationBar :notifications="notifications" />
    </template>

    <template #right>
      <GameSidePanel
        v-if="showDialog && !activeCutscene"
        side="right"
        aria-label="对话对象立绘区域"
        :title="`当前位置：${currentMapName}`"
        :speaker-state="npcSpeakerState"
      >
        <GamePortraitPanel
          :portrait-src="activeDialogue.npcPortrait?.src ?? ''"
          :portrait-alt="activeDialogue.npcPortrait?.alt ?? npcPortraitAlt"
          empty-text="当前对话暂无对应立绘"
        />
      </GameSidePanel>
      <GameInfoPanel
        v-else-if="!activeCutscene"
        :current-map-name="currentMapName"
        :current-map-description="currentMapDescription"
        :primary-action="primaryAction"
        :map-actions="mapActions"
        :menu-disabled="menuDisabled"
        @trigger-primary-action="$emit('trigger-primary-action')"
        @trigger-map-action="$emit('trigger-map-action', $event)"
        @open-menu="$emit('open-menu')"
        @open-portrait-layers="$emit('open-portrait-layers')"
      />
    </template>

    <template #overlay>
      <slot name="overlay"></slot>
    </template>
  </GameShell>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { LOADING_PROGRESS_DETAILS_DELAY_MS } from '../../../core/loadingProgress';
import GameNotificationBar from '../../components/base/GameNotificationBar.vue';
import GameRuntimeErrorBar from '../../components/base/GameRuntimeErrorBar.vue';
import GamePortraitPanel from '../../shell/GamePortraitPanel.vue';
import GameShell from '../../shell/GameShell.vue';
import GameSidePanel from '../../shell/GameSidePanel.vue';
import GameInfoPanel from './GameInfoPanel.vue';

const props = defineProps({
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
  playerPortraitMotionMode: {
    type: String,
    default: 'idle'
  },
  hidePlayerPortrait: {
    type: Boolean,
    default: false
  },
  playerStatusIcons: {
    type: Array,
    default: () => []
  },
  activeSceneImageSrc: {
    type: String,
    default: ''
  },
  activeSceneImageAlt: {
    type: String,
    default: ''
  },
  isSceneImagePreviewing: {
    type: Boolean,
    required: true
  },
  activeCutscene: {
    type: Object,
    default: null
  },
  cutsceneStyle: {
    type: Object,
    required: true
  },
  notifications: {
    type: Array,
    required: true
  },
  runtimeErrors: {
    type: Array,
    default: () => []
  },
  loadingProgress: {
    type: Object,
    default: () => ({
      label: '',
      progress: 0,
      isLoading: false
    })
  },
  showDialog: {
    type: Boolean,
    required: true
  },
  activeDialogue: {
    type: Object,
    required: true
  },
  npcPortraitAlt: {
    type: String,
    required: true
  },
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

defineEmits(['trigger-primary-action', 'trigger-map-action', 'open-menu', 'open-portrait-layers']);

const hasReachedLoadingProgressDelay = ref(false);
let loadingProgressDelayTimer = null;

function clearLoadingProgressDelayTimer() {
  if (loadingProgressDelayTimer === null) {
    return;
  }

  window.clearTimeout(loadingProgressDelayTimer);
  loadingProgressDelayTimer = null;
}

watch(
  () => props.loadingProgress.isLoading,
  (isLoading) => {
    clearLoadingProgressDelayTimer();
    hasReachedLoadingProgressDelay.value = false;

    if (!isLoading) {
      return;
    }

    loadingProgressDelayTimer = window.setTimeout(() => {
      hasReachedLoadingProgressDelay.value = Boolean(props.loadingProgress.isLoading);
      loadingProgressDelayTimer = null;
    }, LOADING_PROGRESS_DETAILS_DELAY_MS);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearLoadingProgressDelayTimer();
});

const shouldShowLoadingProgress = computed(() => {
  return Boolean(props.loadingProgress.isLoading) && hasReachedLoadingProgressDelay.value;
});

const hasDialoguePartner = computed(() => {
  return props.showDialog
    && !props.activeCutscene
    && Boolean(props.activeDialogue.speaker)
    && Boolean(props.activeDialogue.npcPortrait?.src);
});

const playerSpeakerState = computed(() => {
  if (!hasDialoguePartner.value) {
    return 'neutral';
  }

  return props.activeDialogue.speakerSide === 'left' ? 'active' : 'muted';
});

const npcSpeakerState = computed(() => {
  if (!hasDialoguePartner.value) {
    return 'neutral';
  }

  return props.activeDialogue.speakerSide === 'right' ? 'active' : 'muted';
});

const loadingPercent = computed(() => {
  const progress = Number(props.loadingProgress.progress ?? 0);

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.round(Math.min(1, Math.max(0, progress)) * 100);
});

const loadingBarStyle = computed(() => ({
  width: `${loadingPercent.value}%`
}));

const loadingAriaLabel = computed(() => {
  const label = props.loadingProgress.label || '正在载入地图';

  return `${label}，${loadingPercent.value}%`;
});
</script>

<style scoped>
#phaser-game-container {
  width: 100%;
  height: 100%;
  background: #000000;
  overflow: hidden;
}

.game-map-loading {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at center, rgba(72, 40, 88, 0.44), transparent 62%),
    rgba(9, 5, 14, 0.72);
  pointer-events: none;
}

.game-map-loading__panel {
  width: min(360px, 82%);
  padding: 16px 18px 14px;
  border: 2px solid rgba(244, 189, 255, 0.82);
  background: rgba(34, 16, 39, 0.94);
  box-shadow:
    0 0 0 2px rgba(62, 27, 72, 0.85),
    0 12px 28px rgba(0, 0, 0, 0.42);
}

.game-map-loading__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #fff3ff;
  font-size: 14px;
  line-height: 1;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.72);
}

.game-map-loading__title {
  letter-spacing: 0.08em;
}

.game-map-loading__percent {
  color: #ffd66e;
  font-variant-numeric: tabular-nums;
}

.game-map-loading__bar {
  height: 14px;
  padding: 2px;
  border: 2px solid rgba(255, 238, 190, 0.86);
  background: #160b1d;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.65);
}

.game-map-loading__bar-fill {
  width: 0;
  height: 100%;
  background: #ffd66e;
  image-rendering: pixelated;
  transition: width 0.12s steps(6, end);
}

.game-map-loading__label {
  margin: 10px 0 0;
  min-height: 1.4em;
  color: rgba(255, 239, 255, 0.84);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.72);
}

.game-scene-image-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 6, 16, 0.34);
  pointer-events: none;
  transition: background-color 0.18s ease;
}

.game-scene-image-overlay--previewing {
  background: rgba(10, 6, 16, 0.08);
}

.game-scene-image-overlay__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  image-rendering: pixelated;
}

.game-dialogue-cutscene {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  opacity: 1;
  pointer-events: none;
  animation: game-cutscene-fade-in var(--cutscene-fade-in-ms, 450ms) ease both;
}

.game-dialogue-cutscene--leaving {
  animation: game-cutscene-fade-out var(--cutscene-fade-out-ms, 450ms) ease both;
}

.game-dialogue-cutscene__text {
  margin: 0;
  padding: 0 24px;
  color: #ffffff;
  font-size: 18px;
  line-height: 1.6;
  text-align: center;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.75);
}

@keyframes game-cutscene-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes game-cutscene-fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@media (max-width: 900px) {
  .game-dialogue-cutscene__text {
    font-size: 15px;
  }
}
</style>
