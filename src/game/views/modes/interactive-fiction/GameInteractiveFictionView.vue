<template>
  <div class="interactive-fiction" aria-label="互动小说副本">
    <img
      v-if="backgroundSrc"
      class="interactive-fiction__background"
      :src="backgroundSrc"
      :alt="`${payload.scenario.title}背景图`"
    />

    <GameScrollArea
      :key="payload.state.nodeId"
      ref="storyScrollArea"
      class="interactive-fiction__story"
      aria-live="polite"
    >
      <h2 class="interactive-fiction__title">{{ payload.node.title ?? payload.scenario.title }}</h2>
      <div class="interactive-fiction__paragraphs">
        <p v-for="paragraph in payload.node.paragraphs" :key="paragraph">
          {{ paragraph }}
        </p>
      </div>

      <div
        v-if="payload.node.choices?.length"
        class="interactive-fiction__choices"
        aria-label="剧情分支选项"
      >
        <button
          v-for="choice in payload.node.choices"
          :key="choice.id"
          class="interactive-fiction__choice"
          type="button"
          @click="handleChoiceClick($event, choice.id)"
        >
          {{ choice.label }}
        </button>
      </div>
      <p v-else class="interactive-fiction__ending">当前分支已结束。</p>
    </GameScrollArea>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import GameScrollArea from '../../components/base/GameScrollArea.vue';
import type { InteractiveFictionPayload } from '../../../core/interactiveFiction';

const props = defineProps<{
  payload: InteractiveFictionPayload;
  backgroundSrc: string;
}>();

const emit = defineEmits<{
  choose: [choiceId: string];
}>();

const storyScrollArea = ref<InstanceType<typeof GameScrollArea> | null>(null);

function resetStoryScroll(): void {
  storyScrollArea.value?.scrollToTop();
}

function handleChoiceClick(event: MouseEvent, choiceId: string): void {
  (event.currentTarget as HTMLButtonElement | null)?.blur();
  emit('choose', choiceId);
}

watch(
  () => props.payload.state.nodeId,
  async () => {
    await nextTick();
    resetStoryScroll();
    window.requestAnimationFrame(resetStoryScroll);
  }
);
</script>

<style scoped>
.interactive-fiction {
  position: absolute;
  inset: 0;
  z-index: 9;
  overflow: hidden;
  background: #09070d;
}

.interactive-fiction__background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  opacity: 0.82;
}

.interactive-fiction::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(8, 7, 10, 0.08), rgba(8, 7, 10, 0.28));
  pointer-events: none;
}

.interactive-fiction__story {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  padding: 24px 26px;
  border: 0;
  border-radius: 0;
  background: rgba(11, 8, 14, 0.34);
  box-shadow: none;
  backdrop-filter: blur(3px);
}

.interactive-fiction__title {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 500;
}

.interactive-fiction__paragraphs {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  line-height: 1.72;
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.82);
}

.interactive-fiction__paragraphs p {
  margin: 0 0 10px;
}

.interactive-fiction__paragraphs p:last-child {
  margin-bottom: 0;
}

.interactive-fiction__choices {
  display: grid;
  gap: 10px;
  margin-top: auto;
  padding-top: 18px;
}

.interactive-fiction__choice {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(173, 75, 154, 0.86);
  font-size: 13px;
  line-height: 1.35;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
}

.interactive-fiction__choice:hover,
.interactive-fiction__choice:focus-visible {
  outline: none;
  border-color: rgba(255, 255, 255, 0.46);
  background: rgba(198, 92, 178, 0.95);
}

.interactive-fiction__ending {
  color: rgba(255, 255, 255, 0.68);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .interactive-fiction__story {
    padding: 16px;
  }

  .interactive-fiction__paragraphs {
    font-size: 14px;
  }
}
</style>
