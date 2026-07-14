<template>
  <aside class="side-panel" :aria-label="ariaLabel">
    <div class="side-panel-frame" :class="frameClassNames">
      <span class="panel-tag">{{ title }}</span>
      <div class="side-panel-body">
        <slot />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  ariaLabel: {
    type: String,
    default: '侧边栏区域'
  },
  side: {
    type: String,
    default: 'left'
  },
  speakerState: {
    type: String,
    default: 'neutral',
    validator: (value) => ['neutral', 'active', 'muted'].includes(value)
  }
});

const frameClassNames = computed(() => [
  `side-panel-frame--${props.side === 'right' ? 'right' : 'left'}`,
  `side-panel-frame--${props.speakerState}`
]);

</script>

<style scoped>
.side-panel {
  height: 100%;
  display: flex;
  min-width: 0;
  min-height: 0;
}

.side-panel-frame {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  min-height: 0;
  background: linear-gradient(180deg, rgba(73, 32, 79, 0.98), rgba(45, 20, 53, 0.98));
  filter: none;
  opacity: 1;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease,
    opacity 0.18s ease;
}

.side-panel-frame--left {
  border-right: 1px solid rgba(229, 143, 223, 0.45);
}

.side-panel-frame--right {
  border-left: 1px solid rgba(229, 143, 223, 0.45);
}

.side-panel-frame--active {
  box-shadow:
    inset 0 0 0 1px rgba(255, 229, 250, 0.24),
    0 0 18px rgba(255, 173, 239, 0.16);
}

.side-panel-frame--left.side-panel-frame--active {
  border-right-color: rgba(255, 232, 251, 0.9);
}

.side-panel-frame--right.side-panel-frame--active {
  border-left-color: rgba(255, 232, 251, 0.9);
}

.side-panel-frame--muted {
  opacity: 0.72;
  filter: saturate(0.68) brightness(0.72);
}

.panel-tag {
  display: inline-flex;
  align-self: flex-start;
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid rgba(238, 154, 229, 0.36);
  background:
    linear-gradient(90deg, rgba(233, 127, 225, 0.32) 0%, rgba(168, 83, 176, 0.2) 70%, rgba(76, 35, 89, 0.08) 100%),
    linear-gradient(180deg, rgba(79, 36, 88, 0.96), rgba(56, 25, 67, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 214, 249, 0.18),
    inset 3px 0 0 rgba(255, 182, 240, 0.45);
  color: #e7f6ff;
  font-size: clamp(12px, 0.9vw, 16px);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-shadow: 0 0 8px rgba(255, 170, 245, 0.2);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.side-panel-frame--active .panel-tag {
  border-bottom-color: rgba(255, 230, 251, 0.62);
  background:
    linear-gradient(90deg, rgba(255, 171, 239, 0.42) 0%, rgba(201, 105, 205, 0.26) 70%, rgba(88, 40, 97, 0.1) 100%),
    linear-gradient(180deg, rgba(91, 41, 99, 0.98), rgba(64, 28, 74, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 235, 252, 0.28),
    inset 3px 0 0 rgba(255, 221, 249, 0.82),
    0 0 16px rgba(255, 173, 239, 0.16);
  color: #ffffff;
}

.side-panel-frame--muted .panel-tag {
  color: rgba(231, 246, 255, 0.68);
}

.side-panel-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

@media (max-width: 900px) {
  .side-panel-frame {
    padding: 0;
  }
}
</style>
