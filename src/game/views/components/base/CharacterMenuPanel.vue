<template>
  <section class="character-menu-panel" aria-label="人物栏">
    <section class="menu-card character-card" aria-label="人物详情">
      <section class="character-portrait-panel" aria-label="人物立绘">
        <span
          class="character-walk-sprite"
          :class="{ 'character-walk-sprite-hop': currentPlayerWalkIsHop }"
          :style="currentPlayerWalkStyle"
          aria-hidden="true"
        >
          <span class="character-walk-motion">
            <span
              v-for="(frameStyle, index) in currentPlayerWalkFrameStyles"
              :key="index"
              class="character-walk-frame"
              :style="frameStyle"
            ></span>
          </span>
        </span>
        <span
          v-if="displayedPlayerPortraitLayers.length"
          class="character-portrait character-portrait-layer-stack"
          :aria-label="activePlayerPortrait.alt ?? '璃落立绘'"
          role="img"
        >
          <img
            v-for="portraitLayer in displayedPlayerPortraitLayers"
            :key="portraitLayer.key"
            class="character-portrait-layer-image"
            :src="portraitLayer.src"
            :alt="portraitLayer.alt ?? ''"
            aria-hidden="true"
          >
        </span>
        <img
          v-else-if="activePlayerPortrait.src"
          class="character-portrait"
          :src="activePlayerPortrait.src"
          :alt="activePlayerPortrait.alt ?? '璃落立绘'"
        >
        <span v-else class="character-portrait-empty">暂无立绘</span>
        <span
          v-if="previewPlayerPortraitLayers.length"
          class="character-portrait-back-preview-wrap"
        >
          <button
            class="character-portrait-back-preview"
            :aria-label="previewPlayerPortraitAriaLabel"
            type="button"
            :aria-pressed="isBackPortraitActive"
            @click.stop="toggleBackPortrait"
          >
            <span class="character-portrait-back-preview-stack">
              <img
                v-for="portraitLayer in previewPlayerPortraitLayers"
                :key="portraitLayer.key"
                class="character-portrait-back-preview-image"
                :src="portraitLayer.src"
                :alt="portraitLayer.alt ?? ''"
                aria-hidden="true"
              >
            </span>
          </button>
          <span class="character-portrait-back-preview-label">
            {{ previewPlayerPortraitLabel }}
          </span>
        </span>
      </section>

      <section class="character-summary-panel" aria-label="人物概况">
        <div class="character-summary-heading">
          <div class="character-summary-title">
            <span class="character-name-text">璃落</span>
          </div>
        </div>

        <div class="character-stat-grid" aria-label="人物数值">
          <article
            v-for="stat in characterStats"
            :key="stat.label"
            class="character-stat-item"
            :data-menu-nav="true"
            data-menu-group="character-stats"
            :data-menu-key="stat.key"
            tabindex="0"
          >
            <span class="menu-card-label">{{ stat.label }}</span>
            <strong
              class="character-stat-value"
              :class="{ 'character-stat-status-value': stat.key === 'status' }"
            >
              <span
                v-if="stat.key === 'status' && playerStatusIcons.length > 0"
                class="character-stat-status-list"
              >
                <span
                  v-for="(statusIcon, index) in playerStatusIcons"
                  :key="statusIcon.id"
                  class="character-stat-status-item"
                >
                  <img
                    class="character-stat-status-icon"
                    :src="statusIcon.iconUrl"
                    :alt="statusIcon.label"
                    :title="statusIcon.label"
                  >
                  <span class="character-stat-status-text">{{ statusIcon.label }}</span>
                  <span
                    v-if="index < playerStatusIcons.length - 1"
                    class="character-stat-status-separator"
                    aria-hidden="true"
                  >/</span>
                </span>
              </span>
              <span v-else class="character-stat-status-text">{{ stat.value }}</span>
            </strong>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  activePlayerPortrait: {
    type: Object,
    default: () => ({})
  },
  currentPlayerPreviewStyle: {
    type: Object,
    default: () => ({})
  },
  currentPlayerWalkStyle: {
    type: Object,
    default: () => ({})
  },
  currentPlayerWalkFrameStyles: {
    type: Array,
    default: () => []
  },
  currentPlayerWalkIsHop: {
    type: Boolean,
    default: false
  },
  characterStats: {
    type: Array,
    default: () => []
  },
  playerStatusIcons: {
    type: Array,
    default: () => []
  }
});

const isBackPortraitActive = ref(false);

const displayedPlayerPortraitLayers = computed(() => {
  return isBackPortraitActive.value
    ? props.activePlayerPortrait.backLayers ?? []
    : props.activePlayerPortrait.layers ?? [];
});

const previewPlayerPortraitLayers = computed(() => {
  return isBackPortraitActive.value
    ? props.activePlayerPortrait.layers ?? []
    : props.activePlayerPortrait.backLayers ?? [];
});

const previewPlayerPortraitLabel = computed(() => {
  return isBackPortraitActive.value ? '\u524d\u8eab' : '\u540e\u80cc';
});

const previewPlayerPortraitAriaLabel = computed(() => {
  const portraitAlt = props.activePlayerPortrait.alt ?? '\u7483\u843d\u7acb\u7ed8';

  return `${portraitAlt}${previewPlayerPortraitLabel.value}\u9884\u89c8`;
});

function toggleBackPortrait() {
  if (!props.activePlayerPortrait.backLayers?.length) {
    return;
  }

  isBackPortraitActive.value = !isBackPortraitActive.value;
}

watch(() => props.activePlayerPortrait, () => {
  isBackPortraitActive.value = false;
});
</script>
