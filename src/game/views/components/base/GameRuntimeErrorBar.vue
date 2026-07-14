<template>
  <div v-if="errors.length" class="runtime-error-bar" role="alert" aria-live="assertive">
    <div class="runtime-error-bar__inner">
      <span class="runtime-error-bar__label">加载异常</span>
      <div class="runtime-error-bar__content">
        <p
          v-for="error in visibleErrors"
          :key="error.id"
          class="runtime-error-bar__text"
        >
          <strong>{{ error.title }}</strong>
          <span>{{ error.message }}</span>
          <small v-if="error.detail">{{ error.detail }}</small>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  errors: {
    type: Array,
    default: () => []
  }
});

const visibleErrors = computed(() => props.errors.slice(-3).reverse());
</script>

<style scoped>
.runtime-error-bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 40;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  pointer-events: none;
}

.runtime-error-bar__inner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 188, 136, 0.72);
  background: rgba(50, 18, 18, 0.92);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

.runtime-error-bar__label {
  flex: 0 0 auto;
  padding-top: 1px;
  color: #ffd8b5;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 700;
}

.runtime-error-bar__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.runtime-error-bar__text {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  color: #fff7ed;
  font-size: 13px;
  line-height: 1.4;
}

.runtime-error-bar__text strong {
  color: #ffffff;
  font-weight: 700;
}

.runtime-error-bar__text span,
.runtime-error-bar__text small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.runtime-error-bar__text small {
  color: rgba(255, 225, 202, 0.8);
  font-size: 12px;
}

@media (max-width: 900px) {
  .runtime-error-bar {
    padding: 6px;
  }

  .runtime-error-bar__inner {
    gap: 8px;
    min-height: 34px;
    padding: 7px 8px;
  }

  .runtime-error-bar__label,
  .runtime-error-bar__text {
    font-size: 12px;
  }
}
</style>
