<template>
  <transition name="map-action-choice-fade">
    <section
      v-if="visible && action"
      class="map-action-choice-layer"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @keydown.esc.prevent="emit('close')"
    >
      <button
        class="map-action-choice-backdrop"
        type="button"
        aria-label="关闭选项"
        @click="emit('close')"
      ></button>

      <article class="map-action-choice-panel">
        <span class="map-action-choice-label">房间动作</span>
        <h2 :id="titleId" class="map-action-choice-title">{{ action.label }}</h2>
        <p v-if="action.description" class="map-action-choice-message">
          {{ action.description }}
        </p>

        <DialogChoiceList
          :choices="action.choices ?? []"
          :active-index="activeChoiceIndex"
          @select="emit('choose', $event)"
          @hover="activeChoiceIndex = $event"
        />
      </article>
    </section>
  </transition>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import DialogChoiceList from '../../components/base/DialogChoiceList.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  action: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['choose', 'close']);

const activeChoiceIndex = ref(0);
const titleId = `map-action-choice-${Math.random().toString(36).slice(2)}`;

const moveActiveChoice = (offset) => {
  const choices = props.action?.choices ?? [];

  if (choices.length === 0) {
    return;
  }

  activeChoiceIndex.value = (activeChoiceIndex.value + offset + choices.length) % choices.length;
};

const confirmActiveChoice = () => {
  const choice = props.action?.choices?.[activeChoiceIndex.value];

  if (!choice) {
    return;
  }

  emit('choose', choice.id);
};

const handleKeydown = (event) => {
  if (!props.visible) {
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveActiveChoice(-1);
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveActiveChoice(1);
    return;
  }

  if (['Enter', ' ', 'Spacebar'].includes(event.key)) {
    event.preventDefault();
    confirmActiveChoice();
    return;
  }

  const numericKey = Number.parseInt(event.key, 10);
  const choices = props.action?.choices ?? [];

  if (!Number.isNaN(numericKey) && numericKey >= 1 && numericKey <= choices.length) {
    event.preventDefault();
    activeChoiceIndex.value = numericKey - 1;
    emit('choose', choices[numericKey - 1].id);
  }
};

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      window.removeEventListener('keydown', handleKeydown);
      return;
    }

    activeChoiceIndex.value = 0;
    window.addEventListener('keydown', handleKeydown);
    await nextTick();
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.map-action-choice-layer {
  position: absolute;
  inset: 0;
  z-index: 14;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(18px, 3vw, 36px);
  box-sizing: border-box;
}

.map-action-choice-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(23, 10, 28, 0.54);
  cursor: pointer;
}

.map-action-choice-panel {
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

.map-action-choice-label {
  color: rgba(255, 225, 244, 0.68);
  font-size: 12px;
  line-height: 1.3;
}

.map-action-choice-title {
  margin: 0;
  color: #fff4fb;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.map-action-choice-message {
  margin: 0;
  color: rgba(255, 241, 249, 0.82);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.map-action-choice-fade-enter-active,
.map-action-choice-fade-leave-active {
  transition: opacity 0.16s ease;
}

.map-action-choice-fade-enter-from,
.map-action-choice-fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .map-action-choice-panel {
    padding: 16px;
  }
}
</style>

