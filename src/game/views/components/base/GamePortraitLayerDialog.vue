<template>
  <transition name="portrait-layer-dialog-fade">
    <section
      v-if="visible"
      class="portrait-layer-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="立绘图层操作"
      @click.self="emit('close')"
    >
      <div class="portrait-layer-dialog" tabindex="-1" @keydown.esc="emit('close')">
        <header class="portrait-layer-dialog__header">
          <div class="portrait-layer-dialog__heading">
            <span class="portrait-layer-dialog__label">立绘操作</span>
            <h2 class="portrait-layer-dialog__title">图层显示</h2>
          </div>
          <button
            class="portrait-layer-dialog__close"
            type="button"
            aria-label="关闭立绘图层操作"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <div class="portrait-layer-dialog__content">
          <label
            v-for="layer in layers"
            :key="layer.key"
            class="portrait-layer-option"
            :class="{ 'portrait-layer-option--active': selectedLayerKeys.includes(layer.key) }"
          >
            <input
              class="portrait-layer-option__checkbox"
              type="checkbox"
              :checked="selectedLayerKeys.includes(layer.key)"
              @change="emit('toggle-layer', layer.key)"
            />
            <span class="portrait-layer-option__main">
              <span class="portrait-layer-option__name">{{ layer.alt ?? layer.key }}</span>
              <span class="portrait-layer-option__keywords">{{ formatKeywords(layer.keywords) }}</span>
            </span>
            <span
              class="portrait-layer-option__back"
              :class="{ 'portrait-layer-option__back--empty': !layer.hasBackLayer }"
            >
              {{ layer.hasBackLayer ? '有后背' : '无后背' }}
            </span>
          </label>

          <p v-if="layers.length === 0" class="portrait-layer-dialog__empty">
            暂无可操作的立绘图层
          </p>
        </div>
      </div>
    </section>
  </transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  layers: {
    type: Array,
    default: () => []
  },
  selectedLayerKeys: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'toggle-layer']);

function formatKeywords(keywords) {
  return Array.isArray(keywords) && keywords.length > 0
    ? keywords.join(' / ')
    : '无关键词';
}
</script>

<style scoped>
.portrait-layer-dialog-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: calc(11 / 40 * 100%);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(14px, 2vw, 24px);
  box-sizing: border-box;
  background: rgba(18, 8, 23, 0.66);
}

.portrait-layer-dialog {
  width: min(520px, 100%);
  max-height: min(680px, 100%);
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid rgba(255, 224, 247, 0.32);
  background:
    linear-gradient(180deg, rgba(62, 30, 75, 0.98), rgba(38, 18, 48, 0.98));
  box-shadow:
    inset 0 0 0 1px rgba(255, 241, 250, 0.06),
    0 18px 44px rgba(10, 4, 14, 0.36);
}

.portrait-layer-dialog__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 54px 12px 16px;
  border-bottom: 1px solid rgba(239, 194, 233, 0.16);
  background: rgba(44, 20, 54, 0.5);
}

.portrait-layer-dialog__heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.portrait-layer-dialog__label {
  color: rgba(255, 224, 247, 0.68);
  font-size: 12px;
  line-height: 1.2;
}

.portrait-layer-dialog__title {
  margin: 0;
  color: #fff6fc;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.portrait-layer-dialog__close {
  position: absolute;
  top: 12px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(239, 194, 233, 0.24);
  background: rgba(74, 34, 88, 0.72);
  color: rgba(255, 246, 252, 0.9);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.portrait-layer-dialog__close:hover,
.portrait-layer-dialog__close:focus-visible {
  border-color: rgba(255, 224, 247, 0.42);
  background: rgba(104, 55, 119, 0.82);
  color: #fff8fd;
  outline: none;
}

.portrait-layer-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 14px;
  overflow: auto;
  scrollbar-color: rgba(255, 224, 247, 0.34) rgba(57, 27, 68, 0.34);
  scrollbar-width: thin;
}

.portrait-layer-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(239, 194, 233, 0.18);
  background: rgba(255, 241, 249, 0.06);
  color: rgba(255, 246, 252, 0.88);
  cursor: pointer;
}

.portrait-layer-option:hover,
.portrait-layer-option:focus-within,
.portrait-layer-option--active {
  border-color: rgba(255, 224, 247, 0.38);
  background: rgba(255, 241, 249, 0.11);
}

.portrait-layer-option__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: #d855a7;
}

.portrait-layer-option__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.portrait-layer-option__name {
  min-width: 0;
  color: #fff8fd;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.portrait-layer-option__keywords {
  min-width: 0;
  color: rgba(255, 224, 247, 0.62);
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.portrait-layer-option__back {
  min-width: 54px;
  padding: 3px 6px;
  border: 1px solid rgba(143, 218, 205, 0.34);
  color: #c6f2e8;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
}

.portrait-layer-option__back--empty {
  border-color: rgba(255, 224, 247, 0.16);
  color: rgba(255, 224, 247, 0.48);
}

.portrait-layer-dialog__empty {
  margin: 0;
  padding: 18px;
  color: rgba(255, 224, 247, 0.68);
  font-size: 13px;
  text-align: center;
}

.portrait-layer-dialog-fade-enter-active,
.portrait-layer-dialog-fade-leave-active {
  transition: opacity 0.16s ease;
}

.portrait-layer-dialog-fade-enter-from,
.portrait-layer-dialog-fade-leave-to {
  opacity: 0;
}

@media (max-width: 620px) {
  .portrait-layer-option {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .portrait-layer-option__back {
    grid-column: 2;
    justify-self: flex-start;
  }
}
</style>
