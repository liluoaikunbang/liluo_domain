<template>
  <article class="visual-card">
    <div
      class="visual-card__poster"
      :style="cardStyle"
      @click="emit('select', entry)"
      @keydown.enter.prevent="emit('select', entry)"
      @keydown.space.prevent="emit('select', entry)"
      :tabindex="interactive ? 0 : -1"
      :role="interactive ? 'button' : undefined"
      :aria-label="interactive ? `查看 ${entry.title} 详情` : undefined"
    >
      <ResponsiveImage v-if="previewAsset" :asset="previewAsset" :alt="entry.title" :framed="false" :sizes="sizes" />
      <div v-else class="visual-card__placeholder">
        <span>{{ placeholderLabel }}</span>
      </div>
      <div class="visual-card__overlay">
        <StatusBadge :value="entry.promptStatus" />
        <StatusBadge :value="entry.publicationStatus" kind="publication" />
      </div>
    </div>
    <div class="visual-card__body">
      <p class="visual-card__meta">
        <span>{{ collectionLabel }}</span>
        <span v-if="entry.worldId">{{ worldLabel }}</span>
      </p>
      <h3>{{ entry.title }}</h3>
      <p>{{ entry.brief?.subject || entry.brief?.focus }}</p>
      <div class="visual-card__tags">
        <span v-for="tag in visibleTags" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import ResponsiveImage from './ResponsiveImage.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  entry: { type: Object, required: true },
  previewAsset: { type: Object, default: null },
  interactive: { type: Boolean, default: false },
  worldLabel: { type: String, default: '' },
  sizes: { type: String, default: '(max-width: 760px) 100vw, 33vw' },
})

const emit = defineEmits(['select'])

const collectionLabel = computed(() => {
  return {
    'general-cross-site': '跨页海报',
    'world-atlas': '世界 atlas',
    'story-branch': '分支预告',
    'liluo-character': '角色视觉',
  }[props.entry.collection] || props.entry.collection
})

const placeholderLabel = computed(() => props.entry.worldId || collectionLabel.value)
const visibleTags = computed(() => (props.entry.tags || []).slice(0, 4))
const cardStyle = computed(() => ({
  '--poster-start': props.entry.worldId ? 'rgba(255, 223, 185, 0.92)' : 'rgba(223, 236, 255, 0.92)',
  '--poster-end': props.entry.collection === 'story-branch' ? 'rgba(255, 196, 145, 0.82)' : 'rgba(161, 190, 235, 0.82)',
  cursor: props.interactive ? 'pointer' : 'default',
}))
</script>

<style scoped>
.visual-card {
  display: grid;
  overflow: hidden;
  border: 1px solid rgba(28, 43, 74, 0.08);
  border-radius: 28px;
  background: rgba(255, 251, 247, 0.96);
  box-shadow: 0 20px 45px rgba(23, 39, 66, 0.08);
}

.visual-card__poster {
  position: relative;
  min-height: 240px;
  outline: none;
  background: linear-gradient(135deg, var(--poster-start), var(--poster-end));
}

.visual-card__poster:focus-visible {
  box-shadow: inset 0 0 0 3px rgba(60, 109, 203, 0.32);
}

.visual-card__placeholder {
  display: grid;
  height: 100%;
  min-height: 240px;
  place-items: center;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.55), transparent 42%),
    linear-gradient(135deg, var(--poster-start), var(--poster-end));
}

.visual-card__placeholder span {
  color: #23395d;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.visual-card__overlay {
  position: absolute;
  inset: 16px 16px auto auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.visual-card__body {
  display: grid;
  gap: 12px;
  padding: 18px 18px 20px;
}

.visual-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 0;
  color: #7b8798;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  color: #172b45;
  font-size: 1.18rem;
  line-height: 1.35;
}

.visual-card__body > p:last-of-type {
  margin: 0;
  color: #4e5f70;
  line-height: 1.75;
}

.visual-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.visual-card__tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(238, 242, 248, 0.95);
  color: #355173;
  font-size: 0.76rem;
  font-weight: 700;
}
</style>
