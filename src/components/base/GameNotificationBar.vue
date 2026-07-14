<template>
  <div class="notification-layer" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="notice-stack" tag="div" class="notification-list">
      <article
        v-for="notice in notifications"
        :key="notice.id"
        class="notification-item"
        :class="[
          notice.type ? `notification-item--${notice.type}` : 'notification-item--neutral'
        ]"
      >
        <span class="notification-badge">{{ resolveBadge(notice.type) }}</span>
        <p class="notification-text">{{ notice.text }}</p>
      </article>
    </TransitionGroup>
  </div>
</template>

<script setup>
const props = defineProps({
  notifications: {
    type: Array,
    default: () => []
  }
})

const resolveBadge = (type) => {
  if (type === 'gain') {
    return '获得'
  }

  if (type === 'loss') {
    return '失去'
  }

  return '提示'
}
</script>

<style scoped>
.notification-layer {
  position: absolute;
  top: clamp(16px, 2.4vw, 28px);
  left: clamp(12px, 1.8vw, 24px);
  z-index: 4;
  width: min(40%, 320px);
  pointer-events: none;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 10px 14px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 232, 246, 0.3);
  background:
    linear-gradient(90deg, rgba(34, 14, 42, 0.82) 0%, rgba(48, 22, 58, 0.62) 56%, rgba(48, 22, 58, 0.08) 100%);
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.22),
    inset 0 0 0 1px rgba(255, 243, 251, 0.06);
  backdrop-filter: blur(3px);
  overflow: hidden;
}

.notification-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: rgba(255, 217, 116, 0.9);
}

.notification-item--gain {
  border-color: rgba(255, 229, 160, 0.34);
  background:
    linear-gradient(90deg, rgba(79, 48, 18, 0.82) 0%, rgba(111, 72, 26, 0.58) 56%, rgba(111, 72, 26, 0.08) 100%);
}

.notification-item--gain::before {
  background: rgba(255, 214, 97, 0.95);
}

.notification-item--loss {
  border-color: rgba(241, 167, 199, 0.34);
  background:
    linear-gradient(90deg, rgba(74, 22, 40, 0.82) 0%, rgba(99, 35, 58, 0.58) 56%, rgba(99, 35, 58, 0.08) 100%);
}

.notification-item--loss::before {
  background: rgba(245, 144, 176, 0.94);
}

.notification-item--neutral::before {
  background: rgba(176, 208, 255, 0.9);
}

.notification-badge {
  flex: 0 0 auto;
  min-width: 40px;
  color: rgba(255, 246, 250, 0.92);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.notification-text {
  margin: 0;
  color: rgba(255, 250, 253, 0.98);
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.28);
}

.notice-stack-enter-active,
.notice-stack-leave-active {
  transition: opacity 0.42s ease, transform 0.42s ease;
}

.notice-stack-move {
  transition: transform 0.32s ease;
}

.notice-stack-enter-from,
.notice-stack-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

.notice-stack-leave-active {
  position: relative;
}

@media (max-width: 900px) {
  .notification-layer {
    width: min(58%, 280px);
    top: 12px;
    left: 12px;
  }

  .notification-item {
    min-height: 38px;
    padding: 8px 12px;
    gap: 10px;
  }

  .notification-text {
    font-size: 13px;
  }
}
</style>