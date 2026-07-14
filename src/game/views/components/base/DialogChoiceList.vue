<template>
  <div class="choice-list" role="listbox" aria-label="对话选项列表">
    <button
      v-for="(choice, index) in choices"
      :key="choice.id"
      type="button"
      class="choice-button"
      :class="{ 'choice-button--active': index === activeIndex }"
      :aria-selected="index === activeIndex"
      @click="$emit('select', choice.id)"
      @mouseenter="$emit('hover', index)"
    >
      <span class="choice-index">{{ String(index + 1).padStart(2, '0') }}</span>
      <span class="choice-label">{{ choice.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  choices: {
    type: Array,
    default: () => []
  },
  activeIndex: {
    type: Number,
    default: 0
  }
})

defineEmits(['select', 'hover'])
</script>

<style scoped>
.choice-list {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 10px;
  border: 1px solid rgba(255, 207, 245, 0.24);
  background:
    linear-gradient(180deg, rgba(30, 12, 36, 0.28), rgba(18, 8, 23, 0.24)),
    rgba(255, 182, 240, 0.04);
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.16),
    inset 0 0 0 1px rgba(255, 238, 251, 0.05);
  overflow: hidden;
}

.choice-button {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  border: none;
  border-top: 1px solid rgba(255, 207, 245, 0.14);
  background: transparent;
  color: #fff6fd;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.choice-button:first-child {
  border-top: none;
}

.choice-button:hover {
  background: rgba(255, 182, 240, 0.16);
}

.choice-button--active {
  background: rgba(255, 182, 240, 0.24);
  box-shadow: inset 3px 0 0 rgba(255, 231, 250, 0.72);
}

.choice-button:focus-visible {
  outline: 2px solid rgba(255, 219, 247, 0.9);
  outline-offset: -2px;
}

.choice-index {
  flex: 0 0 auto;
  min-width: 24px;
  color: rgba(255, 217, 246, 0.72);
  font-size: 11px;
  letter-spacing: 0.08em;
  line-height: 1.5;
}

.choice-label {
  flex: 1;
  font-size: 14px;
  line-height: 1.45;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.38);
}
 </style>
