<template>
  <section class="outline-menu-panel" aria-label="大纲栏目">
    <nav class="outline-section-tabs" aria-label="大纲子栏目">
      <button
        v-for="section in sections"
        :key="section.key"
        class="outline-section-tab"
        :class="{ 'outline-section-tab-active': activeSection === section.key }"
        type="button"
        :aria-pressed="activeSection === section.key"
        @click="activeSection = section.key"
      >
        {{ section.label }}
      </button>
    </nav>

    <StoryMenuPanel
      v-if="activeSection === 'story'"
      :outline="editableOutline"
      :gameplay-catalog="gameplayOutline"
      @update:outline="editableOutline = $event"
      @view-gameplay="showGameplay"
    />
    <GameplayMenuPanel
      v-else
      :catalog="gameplayOutline"
      :selected-gameplay-id="selectedGameplayId"
    />
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { gameplayOutline } from '../../../data/gameplay_outline/gameplayOutline';
import GameplayMenuPanel from './GameplayMenuPanel.vue';
import StoryMenuPanel from './StoryMenuPanel.vue';

const props = defineProps({
  outline: {
    type: Array,
    default: () => []
  }
});

const sections = [
  { key: 'story', label: '故事' },
  { key: 'gameplay', label: '玩法' }
];
const activeSection = ref('story');
const selectedGameplayId = ref('');
const editableOutline = ref(cloneOutline(props.outline));

watch(
  () => props.outline,
  (outline) => {
    editableOutline.value = cloneOutline(outline);
  }
);

function showGameplay(gameplayId) {
  selectedGameplayId.value = gameplayId;
  activeSection.value = 'gameplay';
}

function cloneOutline(outline) {
  return JSON.parse(JSON.stringify(Array.isArray(outline) ? outline : []));
}
</script>

<style scoped>
.outline-menu-panel {
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
}

.outline-section-tabs {
  display: flex;
  width: fit-content;
  padding: 3px;
  border: 1px solid rgba(129, 111, 152, 0.48);
  background: rgba(19, 15, 29, 0.9);
  box-shadow: 3px 3px 0 rgba(8, 6, 13, 0.72);
}

.outline-section-tab {
  min-width: 84px;
  padding: 7px 18px;
  border: 0;
  color: #bdb2ca;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.outline-section-tab:hover,
.outline-section-tab:focus-visible {
  color: #fff3cf;
  background: rgba(118, 88, 145, 0.24);
  outline: none;
}

.outline-section-tab-active {
  color: #fff3cf;
  background: rgba(139, 97, 166, 0.42);
  box-shadow: inset 0 -2px 0 #d8b36d;
}
</style>
