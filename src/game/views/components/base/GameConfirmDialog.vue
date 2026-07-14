<template>
  <transition name="game-confirm-fade">
    <section
      v-if="visible"
      class="game-confirm-layer"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @keydown.esc.prevent="$emit('cancel')"
    >
      <button
        class="game-confirm-backdrop"
        type="button"
        aria-label="取消确认"
        @click="$emit('cancel')"
      ></button>

      <article class="game-confirm-panel">
        <span class="game-confirm-label">{{ label }}</span>
        <h2 :id="titleId" class="game-confirm-title">{{ title }}</h2>
        <p class="game-confirm-message">{{ message }}</p>

        <div class="game-confirm-actions">
          <button
            ref="cancelButtonRef"
            class="game-confirm-action"
            type="button"
            @click="$emit('cancel')"
          >
            {{ cancelText }}
          </button>
          <button
            class="game-confirm-action game-confirm-action-danger"
            type="button"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </article>
    </section>
  </transition>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: '确认操作'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
});

defineEmits(['confirm', 'cancel']);

const cancelButtonRef = ref(null);
const titleId = `game-confirm-${Math.random().toString(36).slice(2)}`;

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }

    await nextTick();
    cancelButtonRef.value?.focus();
  }
);
</script>

<style scoped>
.game-confirm-layer {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(18px, 3vw, 36px);
  box-sizing: border-box;
}

.game-confirm-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(23, 10, 28, 0.54);
  cursor: pointer;
}

.game-confirm-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 215, 246, 0.32);
  background:
    linear-gradient(180deg, rgba(86, 43, 101, 0.96), rgba(51, 24, 62, 0.96));
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.36),
    inset 0 0 0 1px rgba(255, 240, 250, 0.08);
}

.game-confirm-label {
  color: rgba(255, 225, 244, 0.68);
  font-size: 12px;
  line-height: 1.3;
}

.game-confirm-title {
  margin: 0;
  color: #fff4fb;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.game-confirm-message {
  margin: 0;
  color: rgba(255, 241, 249, 0.82);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.game-confirm-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.game-confirm-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 224, 247, 0.28);
  background: rgba(105, 53, 122, 0.78);
  color: #fff6fc;
  font-size: 14px;
  line-height: 1.35;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.game-confirm-action-danger {
  border-color: rgba(255, 184, 194, 0.4);
  background: rgba(116, 49, 70, 0.82);
}

.game-confirm-action:hover,
.game-confirm-action:focus-visible {
  border-color: rgba(255, 233, 250, 0.5);
  background: rgba(134, 78, 149, 0.92);
  outline: none;
}

.game-confirm-action-danger:hover,
.game-confirm-action-danger:focus-visible {
  border-color: rgba(255, 219, 225, 0.6);
  background: rgba(146, 63, 88, 0.94);
}

.game-confirm-fade-enter-active,
.game-confirm-fade-leave-active {
  transition: opacity 0.16s ease;
}

.game-confirm-fade-enter-from,
.game-confirm-fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .game-confirm-panel {
    padding: 16px;
  }

  .game-confirm-actions {
    grid-template-columns: 1fr;
  }
}
</style>
