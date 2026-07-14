<template>
  <div class="dialog-history-overlay" role="presentation" @click.stop="close">
    <section
      class="dialog-history-panel"
      role="dialog"
      aria-modal="true"
      aria-label="对话历史记录"
      @click.stop
    >
      <header class="dialog-history-panel__header">
        <h2 class="dialog-history-panel__title">历史记录</h2>
        <button
          class="dialog-history-panel__close"
          type="button"
          aria-label="关闭历史记录"
          @click.stop="close"
        >
          关闭
        </button>
      </header>

      <GameScrollArea class="dialog-history-panel__content">
        <ol v-if="hasHistory" class="dialog-history-list">
          <li
            v-for="entry in history"
            :key="entry.id"
            class="dialog-history-list__item"
            :class="`dialog-history-list__item--${entry.type || 'dialogue'}`"
          >
            <p class="dialog-history-list__text">
              <span v-if="entry.speaker" class="dialog-history-list__speaker">
                {{ entry.speaker }}：
              </span>{{ entry.text }}
            </p>
          </li>
        </ol>
        <p v-else class="dialog-history-panel__empty">本次对话还没有可查看的文本。</p>
      </GameScrollArea>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import GameScrollArea from './GameScrollArea.vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const hasHistory = computed(() => props.history.length > 0)

const close = () => {
  emit('close')
}

const handleKeydown = (event) => {
  if (event.key !== 'Escape') {
    return
  }

  event.preventDefault()
  close()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.dialog-history-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(18px, 5vh, 56px) 18px;
  box-sizing: border-box;
  background: rgba(5, 4, 8, 0.7);
  backdrop-filter: blur(3px);
  pointer-events: auto;
}

.dialog-history-panel {
  width: min(720px, 92%);
  height: min(78%, 620px);
  max-height: min(78%, 620px);
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 1px solid rgba(255, 214, 248, 0.32);
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(36, 17, 43, 0.96), rgba(16, 8, 23, 0.98)),
    rgba(12, 6, 17, 0.92);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 238, 252, 0.12);
}

.dialog-history-panel__header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.dialog-history-panel__title {
  margin: 0;
  color: #ffe7fb;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.dialog-history-panel__close {
  padding: 5px 10px;
  border: 1px solid rgba(255, 207, 245, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: #fff3fd;
  font-size: 12px;
  cursor: pointer;
}

.dialog-history-panel__content {
  flex: 1 1 auto;
  min-height: 0;
}

.dialog-history-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dialog-history-list__item {
  padding: 9px 10px;
  border-left: 2px solid rgba(255, 182, 240, 0.46);
  background: rgba(255, 255, 255, 0.055);
}

.dialog-history-list__item--choice {
  border-left-color: rgba(133, 220, 255, 0.72);
  background: rgba(93, 177, 214, 0.14);
}

.dialog-history-list__speaker {
  display: inline;
  color: rgba(255, 226, 249, 0.82);
  font-size: inherit;
  font-weight: 600;
}

.dialog-history-list__item--choice .dialog-history-list__speaker {
  color: rgba(183, 235, 255, 0.9);
}

.dialog-history-list__text,
.dialog-history-panel__empty {
  margin: 0;
  color: rgba(255, 251, 255, 0.94);
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-line;
}

.dialog-history-panel__close:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 224, 249, 0.42);
}

.dialog-history-panel__close:focus-visible {
  outline: 2px solid rgba(255, 219, 247, 0.9);
  outline-offset: 2px;
}

@media (max-width: 900px) {
  .dialog-history-overlay {
    padding: 12px;
  }

  .dialog-history-panel {
    width: 100%;
    height: 82%;
    max-height: 82%;
  }
}
</style>
