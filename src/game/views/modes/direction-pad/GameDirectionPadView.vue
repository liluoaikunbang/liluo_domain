<template>
  <section
    class="direction-pad-view"
    tabindex="0"
    aria-label="方向键小游戏场景"
  >
    <img
      v-if="payload.definition.backgroundSrc"
      class="direction-pad-view__background-image"
      :src="payload.definition.backgroundSrc"
      :alt="`${payload.definition.title}背景图`"
    />
    <div v-else class="direction-pad-view__backdrop" aria-hidden="true"></div>

    <div class="direction-pad-view__playfield">
      <div
        v-if="isRhythmMode"
        class="direction-pad-view__rhythm-prompt"
      >
        <div
          class="direction-pad-view__hit-line"
          :style="{ left: `${hitLinePercent}%` }"
          aria-hidden="true"
        ></div>
        <ol class="direction-pad-view__rhythm-sequence" aria-label="滚动方向判定序列">
          <li
            v-for="(direction, index) in payload.definition.targetSequence"
            :key="`${payload.state.startedAtMs ?? 0}-${direction}-${index}`"
            class="direction-pad-view__rhythm-note"
            :class="getSequenceItemClass(index)"
            :style="getRhythmNoteStyle(index)"
          >
            {{ directionLabels[direction].icon }}
          </li>
        </ol>
      </div>

      <div v-else class="direction-pad-view__prompt">
        <ol class="direction-pad-view__sequence" aria-label="目标方向序列">
          <li
            v-for="(direction, index) in payload.definition.targetSequence"
            :key="`${direction}-${index}`"
            class="direction-pad-view__sequence-item"
            :class="getSequenceItemClass(index)"
          >
            {{ directionLabels[direction].icon }}
          </li>
        </ol>
      </div>
    </div>

    <div
      v-if="isCountdown"
      class="direction-pad-view__countdown-overlay"
      role="status"
      aria-live="assertive"
      aria-label="方向键小游戏倒计时"
      @click.stop
      @pointerdown.stop
    >
      <span class="direction-pad-view__countdown-number">{{ countdownText }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { DirectionPadGamePayload, DirectionPadInput } from '../../../core/directionPadGame';

const props = defineProps<{
  payload: DirectionPadGamePayload;
}>();

const emit = defineEmits<{
  press: [direction: DirectionPadInput, pressedAtMs?: number];
  expire: [checkedAtMs: number];
  countdownComplete: [checkedAtMs: number];
}>();

const directionLabels: Record<DirectionPadInput, { icon: string; label: string }> = {
  up: { icon: '↑', label: '上' },
  right: { icon: '→', label: '右' },
  down: { icon: '↓', label: '下' },
  left: { icon: '←', label: '左' }
};

const keyDirectionMap: Record<string, DirectionPadInput | undefined> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left'
};

const isRhythmMode = computed(() => props.payload.definition.mode === 'rhythm' && Boolean(props.payload.definition.rhythm));
const isCountdown = computed(() => props.payload.state.status === 'countdown');
const rhythmSettings = computed(() => props.payload.definition.rhythm);
const hitLinePercent = computed(() => rhythmSettings.value?.hitLinePercent ?? 68);
const travelMs = computed(() => rhythmSettings.value?.travelMs ?? 2600);
const hitTravelRatio = computed(() => (hitLinePercent.value + 12) / 124);
const nowMs = ref(Date.now());
let animationFrameId = 0;

const getSequenceItemClass = (index: number) => {
  if (isRhythmMode.value) {
    const resolvedNotes = props.payload.state.resolvedNotes ?? [];
    const note = resolvedNotes[index] ?? (index === resolvedNotes.length ? props.payload.state.activeNote : undefined);

    if (note) {
      return note.result === 'hit'
        ? 'direction-pad-view__sequence-item--done'
        : 'direction-pad-view__sequence-item--missed';
    }

    if (index === props.payload.currentNoteIndex && props.payload.state.status === 'playing') {
      return 'direction-pad-view__sequence-item--current';
    }

    return '';
  }

  if (index < props.payload.state.inputSequence.length) {
    const input = props.payload.state.inputSequence[index];
    const expected = props.payload.definition.targetSequence[index];
    return input === expected
      ? 'direction-pad-view__sequence-item--done'
      : 'direction-pad-view__sequence-item--missed';
  }

  if (index === props.payload.state.inputSequence.length && props.payload.state.status === 'playing') {
    return 'direction-pad-view__sequence-item--current';
  }

  return '';
};

const getRhythmNoteStyle = (index: number) => {
  const rhythm = rhythmSettings.value;

  if (!rhythm) {
    return {};
  }

  const startedAtMs = props.payload.state.startedAtMs ?? nowMs.value;
  const noteHitAtMs = startedAtMs + rhythm.leadInMs + index * rhythm.noteSpacingMs;
  const noteEnterAtMs = noteHitAtMs - travelMs.value * hitTravelRatio.value;
  const progress = (nowMs.value - noteEnterAtMs) / travelMs.value;
  const leftPercent = -12 + progress * 124;

  return {
    left: `${leftPercent}%`
  };
};

const countdownText = computed(() => {
  const countdownEndsAtMs = props.payload.state.countdownEndsAtMs ?? nowMs.value;
  const remainingMs = Math.max(0, countdownEndsAtMs - nowMs.value);
  return String(Math.max(1, Math.ceil(remainingMs / 1000)));
});

const updateRhythmClock = () => {
  nowMs.value = Date.now();

  if (isCountdown.value && (props.payload.state.countdownEndsAtMs ?? nowMs.value) <= nowMs.value) {
    emit('countdownComplete', nowMs.value);
  }

  if (shouldExpireCurrentRhythmNote(nowMs.value)) {
    emit('expire', nowMs.value);
  }

  animationFrameId = window.requestAnimationFrame(updateRhythmClock);
};

const shouldExpireCurrentRhythmNote = (checkedAtMs: number) => {
  const rhythm = rhythmSettings.value;

  if (!rhythm || !isRhythmMode.value || props.payload.state.status !== 'playing') {
    return false;
  }

  const noteIndex = props.payload.currentNoteIndex;
  const expected = props.payload.definition.targetSequence[noteIndex];

  if (!expected) {
    return false;
  }

  const startedAtMs = props.payload.state.startedAtMs ?? checkedAtMs;
  const expectedHitAtMs = startedAtMs + rhythm.leadInMs + noteIndex * rhythm.noteSpacingMs;

  if (props.payload.state.activeNote) {
    return checkedAtMs >= expectedHitAtMs;
  }

  return checkedAtMs - expectedHitAtMs > rhythm.hitWindowMs;
};

const startRhythmClock = () => {
  if (animationFrameId || (!isCountdown.value && (!isRhythmMode.value || props.payload.state.status !== 'playing'))) {
    return;
  }

  updateRhythmClock();
};

const stopRhythmClock = () => {
  if (!animationFrameId) {
    return;
  }

  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
};

const handleKeyDown = (event: KeyboardEvent) => {
  const direction = keyDirectionMap[event.key];

  if (!direction || event.repeat || props.payload.state.status !== 'playing') {
    return;
  }

  event.preventDefault();
  emit('press', direction, Date.now());
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  startRhythmClock();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  stopRhythmClock();
});

watch(
  () => [isRhythmMode.value, props.payload.state.status, props.payload.state.startedAtMs, props.payload.state.countdownEndsAtMs],
  () => {
    if (isCountdown.value || (isRhythmMode.value && props.payload.state.status === 'playing')) {
      startRhythmClock();
      return;
    }

    stopRhythmClock();
  }
);
</script>

<style scoped>
.direction-pad-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  outline: none;
  background: #17111f;
}

.direction-pad-view:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(255, 224, 156, 0.78);
}

.direction-pad-view__backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, #31223a 0%, #17111f 100%);
  background-size: 18px 18px, 18px 18px, auto;
  image-rendering: pixelated;
}

.direction-pad-view__background-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  image-rendering: pixelated;
}

.direction-pad-view__playfield {
  position: relative;
  z-index: 1;
  display: grid;
  align-items: end;
  justify-items: center;
  width: 100%;
  height: 100%;
  padding: 0 18px 18px;
  box-sizing: border-box;
}

.direction-pad-view__prompt {
  display: grid;
  justify-items: center;
  width: min(92%, 430px);
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  box-sizing: border-box;
  background: rgba(20, 12, 24, 0.42);
  backdrop-filter: blur(2px);
}

.direction-pad-view__sequence {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 34px;
  gap: 8px;
  max-width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
  overflow: hidden;
}

.direction-pad-view__sequence-item {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 2px solid rgba(255, 255, 255, 0.16);
  box-sizing: border-box;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(0, 0, 0, 0.2);
  font-size: 19px;
  line-height: 1;
}

.direction-pad-view__rhythm-prompt {
  position: relative;
  width: min(96%, 560px);
  height: 96px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    rgba(20, 12, 24, 0.48);
  background-size: 28px 100%, auto;
  backdrop-filter: blur(2px);
}

.direction-pad-view__hit-line {
  position: absolute;
  top: 10px;
  bottom: 10px;
  z-index: 2;
  width: 4px;
  border-radius: 2px;
  background: #ffe09c;
  box-shadow:
    0 0 0 1px rgba(80, 42, 20, 0.84),
    0 0 14px rgba(255, 224, 156, 0.72);
}

.direction-pad-view__rhythm-sequence {
  position: absolute;
  inset: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.direction-pad-view__rhythm-note {
  position: absolute;
  top: 50%;
  left: -12%;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
  color: rgba(255, 255, 255, 0.86);
  background: rgba(35, 20, 43, 0.86);
  font-size: 22px;
  line-height: 1;
  transform: translate(-50%, -50%);
  will-change: left;
}

.direction-pad-view__rhythm-note.direction-pad-view__sequence-item--current {
  box-shadow: 0 0 16px rgba(255, 224, 156, 0.36);
}

.direction-pad-view__sequence-item--current {
  border-color: rgba(255, 224, 156, 0.86);
  color: #ffffff;
  background: rgba(171, 116, 65, 0.62);
}

.direction-pad-view__sequence-item--done {
  border-color: rgba(118, 214, 171, 0.8);
  color: #ffffff;
  background: rgba(43, 112, 88, 0.62);
}

.direction-pad-view__sequence-item--missed {
  border-color: rgba(255, 141, 141, 0.84);
  color: #ffffff;
  background: rgba(150, 45, 58, 0.74);
}

.direction-pad-view__countdown-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background: rgba(12, 8, 18, 0.62);
  backdrop-filter: blur(2px);
  pointer-events: auto;
  user-select: none;
}

.direction-pad-view__countdown-number {
  display: grid;
  place-items: center;
  min-width: 112px;
  min-height: 112px;
  color: #ffffff;
  font-size: 76px;
  line-height: 1;
  font-weight: 800;
  text-shadow:
    0 4px 0 rgba(93, 45, 70, 0.9),
    0 0 18px rgba(255, 224, 156, 0.62);
}

@media (max-width: 900px) {
  .direction-pad-view__playfield {
    padding: 0 10px 10px;
  }

  .direction-pad-view__prompt {
    width: 96%;
    padding: 10px;
  }

  .direction-pad-view__sequence {
    grid-auto-columns: 30px;
    gap: 6px;
  }

  .direction-pad-view__sequence-item {
    width: 30px;
    height: 30px;
    font-size: 17px;
  }

  .direction-pad-view__rhythm-prompt {
    width: 96%;
    height: 82px;
  }

  .direction-pad-view__rhythm-note {
    width: 34px;
    height: 34px;
    font-size: 18px;
  }

  .direction-pad-view__countdown-number {
    min-width: 88px;
    min-height: 88px;
    font-size: 58px;
  }
}
</style>
