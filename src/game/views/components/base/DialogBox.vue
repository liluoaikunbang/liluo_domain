<template>
  <Transition name="dialog-fade">
    <div
      v-if="visible"
      class="dialog-shell"
      :class="{
        'dialog-shell--scene': sceneMode,
        'dialog-shell--choices': hasChoices,
        'dialog-shell--previewing': scenePreviewing
      }"
      role="dialog"
      aria-live="polite"
      aria-label="剧情对话框"
    >
      <section class="dialog-box" @click="requestAdvance">

        <header v-if="speaker" class="dialog-header">
          <span class="speaker-tag" :class="speakerTagClass">{{ speaker }}</span>
        </header>

        <GameScrollArea class="dialog-content">
          {{ text }}
        </GameScrollArea>

        <DialogChoiceList
          v-if="hasChoices"
          :choices="choices"
          :active-index="activeChoiceIndex"
          @select="handleChoiceSelect"
          @hover="activeChoiceIndex = $event"
          @click.stop
        />

        <footer class="dialog-footer" :class="{ 'dialog-footer--choices': hasChoices }">
          <span class="dialog-hint">{{ currentHint }}</span>
          <div class="dialog-actions">
            <button
              class="dialog-history"
              type="button"
              aria-label="打开历史记录，快捷键 H"
              title="快捷键 H"
              @click.stop="openHistory"
            >
              历史记录 <span class="dialog-history__key">H</span>
            </button>
            <button
              v-if="sceneMode"
              class="dialog-preview"
              type="button"
              aria-label="按住查看事件背景图"
              @pointerdown.stop.prevent="startScenePreview"
              @pointerup.stop.prevent="stopScenePreview"
              @pointercancel.stop.prevent="stopScenePreview"
              @mouseleave="stopScenePreview"
            >
              查看背景
            </button>
            <button
              v-if="!hasChoices"
              class="dialog-close"
              type="button"
              @click.stop="handlePrimaryAction"
            >
              {{ actionLabel }}
            </button>
          </div>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import DialogChoiceList from './DialogChoiceList.vue'
import GameScrollArea from './GameScrollArea.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  },
  choices: {
    type: Array,
    default: () => []
  },
  speaker: {
    type: String,
    default: ''
  },
  speakerSide: {
    type: String,
    default: 'right'
  },
  continueHint: {
    type: String,
    default: '点击对话框、Enter、Space 或 Esc 继续'
  },
  canAdvance: {
    type: Boolean,
    default: false
  },
  sceneMode: {
    type: Boolean,
    default: false
  },
  scenePreviewing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'advance', 'choose', 'open-history', 'scene-preview-change'])

const hasChoices = computed(() => props.choices.length > 0)
const activeChoiceIndex = ref(0)

const speakerTagClass = computed(() => {
  return props.speakerSide === 'left' ? 'speaker-tag--left' : 'speaker-tag--right'
})

const actionLabel = computed(() => {
  if (hasChoices.value) {
    return '结束交谈'
  }

  return props.canAdvance ? '继续' : '结束'
})

const currentHint = computed(() => {
  if (hasChoices.value) {
    return props.sceneMode
      ? '↑↓切换，Enter / Space确认，也可按住 V 查看背景'
      : '↑↓切换，Enter / Space确认，也可直接按数字键选择'
  }

  return props.sceneMode ? '按住查看背景或 V 可暂时隐藏对话框' : props.continueHint
})

const resetActiveChoice = () => {
  activeChoiceIndex.value = 0
}

const moveActiveChoice = (offset) => {
  if (!hasChoices.value) {
    return
  }

  const total = props.choices.length
  activeChoiceIndex.value = (activeChoiceIndex.value + offset + total) % total
}

const confirmActiveChoice = () => {
  if (!hasChoices.value) {
    return
  }

  const currentChoice = props.choices[activeChoiceIndex.value]

  if (!currentChoice) {
    return
  }

  emit('choose', currentChoice.id)
}

const openHistory = () => {
  emit('open-history')
}

const close = () => {
  if (!props.visible) {
    return
  }

  emit('update:visible', false)
  emit('close')
}

const requestAdvance = () => {
  if (hasChoices.value) {
    return
  }

  if (props.canAdvance) {
    emit('advance')
    return
  }

  close()
}

const handlePrimaryAction = () => {
  if (hasChoices.value) {
    close()
    return
  }

  requestAdvance()
}

const handleChoiceSelect = (choiceId) => {
  emit('choose', choiceId)
}

const startScenePreview = () => {
  if (!props.sceneMode || props.scenePreviewing) {
    return
  }

  emit('scene-preview-change', true)
}

const stopScenePreview = () => {
  if (!props.scenePreviewing) {
    return
  }

  emit('scene-preview-change', false)
}

const handleKeydown = (event) => {
  if (!props.visible) {
    return
  }

  if (props.sceneMode && event.key.toLowerCase() === 'v') {
    event.preventDefault()
    startScenePreview()
    return
  }

  if (event.key.toLowerCase() === 'h' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault()
    openHistory()
    return
  }

  if (event.key === 'Escape' && !hasChoices.value) {
    event.preventDefault()
    close()
    return
  }

  if (hasChoices.value) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActiveChoice(-1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActiveChoice(1)
      return
    }

    if (['Enter', ' ', 'Spacebar'].includes(event.key)) {
      event.preventDefault()
      confirmActiveChoice()
      return
    }

    const numericKey = Number.parseInt(event.key, 10)
    if (!Number.isNaN(numericKey) && numericKey >= 1 && numericKey <= props.choices.length) {
      event.preventDefault()
      activeChoiceIndex.value = numericKey - 1
      handleChoiceSelect(props.choices[numericKey - 1].id)
    }

    return
  }

  if (['Enter', ' ', 'Spacebar'].includes(event.key)) {
    event.preventDefault()
    requestAdvance()
  }
}

const handleKeyup = (event) => {
  if (!props.visible || event.key.toLowerCase() !== 'v') {
    return
  }

  event.preventDefault()
  stopScenePreview()
}

const handlePreviewRelease = () => {
  stopScenePreview()
}

watch(
  () => props.choices,
  () => {
    resetActiveChoice()
  },
  { deep: true }
)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetActiveChoice()
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('keyup', handleKeyup)
      window.addEventListener('pointerup', handlePreviewRelease)
      window.addEventListener('blur', handlePreviewRelease)
      return
    }

    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
    window.removeEventListener('pointerup', handlePreviewRelease)
    window.removeEventListener('blur', handlePreviewRelease)
    stopScenePreview()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('pointerup', handlePreviewRelease)
  window.removeEventListener('blur', handlePreviewRelease)
  stopScenePreview()
})

defineExpose({
  close
})
</script>

<style scoped>
.dialog-shell {
  position: fixed;
  left: 50%;
  bottom: clamp(16px, 4vh, 32px);
  width: min(calc(96vw * 18 / 40), calc(96vh * 20 / 9 * 18 / 40));
  display: flex;
  justify-content: center;
  padding: 0 6px;
  box-sizing: border-box;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;
}

.dialog-shell--scene {
  bottom: clamp(10px, 2.4vh, 18px);
  width: min(calc(96vw * 16 / 40), calc(96vh * 20 / 9 * 16 / 40));
}

.dialog-shell--previewing {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.dialog-box {
  width: 100%;
  max-width: none;
  position: relative;
  padding: 14px 18px 12px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 214, 248, 0.34);
  background:
    linear-gradient(180deg, rgba(43, 20, 51, 0.42), rgba(17, 8, 23, 0.36)),
    rgba(12, 6, 17, 0.22);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 238, 252, 0.12),
    inset 0 0 0 1px rgba(255, 214, 248, 0.07);
  backdrop-filter: blur(4px) saturate(1.12);
  pointer-events: auto;
  cursor: pointer;
}

.dialog-shell--scene .dialog-box {
  padding: 10px 14px 9px;
  border-color: rgba(255, 214, 248, 0.28);
  background:
    linear-gradient(180deg, rgba(33, 15, 40, 0.34), rgba(12, 6, 18, 0.3)),
    rgba(10, 5, 15, 0.16);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 238, 252, 0.1),
    inset 0 0 0 1px rgba(255, 214, 248, 0.05);
  backdrop-filter: blur(3px) saturate(1.14);
}

.dialog-shell--scene.dialog-shell--choices .dialog-box {
  padding-bottom: 10px;
}

.dialog-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.16) 42%, rgba(0, 0, 0, 0.32));
  pointer-events: none;
}

.dialog-shell--scene .dialog-box::after {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.36), rgba(0, 0, 0, 0.2) 42%, rgba(0, 0, 0, 0.38));
}

.dialog-box::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(255, 196, 245, 0.18);
  pointer-events: none;
  z-index: 1;
}

.dialog-shell--scene .dialog-box::before {
  inset: 4px;
  border-color: rgba(255, 196, 245, 0.14);
}

.dialog-header {
  margin-bottom: 8px;
  display: flex;
  position: relative;
  z-index: 2;
}

.dialog-shell--scene .dialog-header {
  margin-bottom: 4px;
}

.speaker-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  background: rgba(255, 162, 238, 0.14);
  border-left: 3px solid rgba(255, 182, 240, 0.72);
  color: #ffe7fb;
  font-size: 13px;
  letter-spacing: 0.08em;
}

.dialog-shell--scene .speaker-tag {
  min-height: 20px;
  padding: 0 8px;
  font-size: 12px;
}

.speaker-tag--left {
  margin-right: auto;
}

.speaker-tag--right {
  margin-left: auto;
}

.dialog-content {
  position: relative;
  z-index: 2;
  color: rgba(255, 251, 255, 0.98);
  font-size: clamp(15px, 1vw, 18px);
  line-height: 1.7;
  white-space: pre-line;
  min-height: 56px;
  text-shadow:
    0 1px 0 rgba(0, 0, 0, 0.48),
    0 0 8px rgba(0, 0, 0, 0.28);
}

.dialog-shell--scene .dialog-content {
  min-height: 34px;
  max-height: 86px;
  font-size: clamp(14px, 0.92vw, 16px);
  line-height: 1.55;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  position: relative;
  z-index: 2;
}

.dialog-shell--scene .dialog-footer {
  margin-top: 6px;
}

.dialog-footer--choices {
  justify-content: flex-start;
}

.dialog-hint {
  color: rgba(255, 218, 246, 0.72);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.dialog-close {
  min-width: 88px;
  padding: 7px 16px;
  border: 1px solid rgba(255, 207, 245, 0.3);
  background: rgba(255, 182, 240, 0.12);
  color: #fff3fd;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.dialog-history {
  min-width: 76px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 207, 245, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: #fff3fd;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.dialog-history__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  margin-left: 5px;
  border: 1px solid rgba(255, 223, 250, 0.28);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 245, 253, 0.9);
  font-size: 10px;
  line-height: 1;
}

.dialog-preview {
  min-width: 76px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 207, 245, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: #fff3fd;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.dialog-history:hover,
.dialog-preview:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 224, 249, 0.42);
  transform: translateY(-1px);
}

.dialog-history:active,
.dialog-preview:active {
  transform: translateY(0);
}

.dialog-history:focus-visible,
.dialog-preview:focus-visible {
  outline: 2px solid rgba(255, 219, 247, 0.9);
  outline-offset: 2px;
}

.dialog-close:hover {
  background: rgba(255, 182, 240, 0.2);
  border-color: rgba(255, 224, 249, 0.52);
  transform: translateY(-1px);
}

.dialog-close:active {
  transform: translateY(0);
}

.dialog-close:focus-visible {
  outline: 2px solid rgba(255, 219, 247, 0.9);
  outline-offset: 2px;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

@media (max-width: 900px) {
  .dialog-shell {
    left: 0;
    right: 0;
    width: auto;
    transform: none;
    padding: 0 12px;
    bottom: 12px;
  }

  .dialog-shell--scene,
  .dialog-shell--previewing {
    transform: none;
  }

  .dialog-box {
    width: 100%;
    padding: 12px 14px;
  }

  .dialog-content {
    min-height: 48px;
    font-size: 15px;
    line-height: 1.65;
  }

  .dialog-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .dialog-actions {
    width: 100%;
    margin-left: 0;
  }

  .dialog-history,
  .dialog-preview {
    flex: 1;
  }

  .dialog-close {
    flex: 1;
    width: auto;
  }
}
</style>
