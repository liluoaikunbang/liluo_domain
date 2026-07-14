<template>
  <div class="map-action-stack">
    <div v-if="primaryAction" class="map-action-section">
      <p v-if="primaryAction.description" class="map-action-text map-action-description">
        {{ primaryAction.description }}
      </p>
      <LiButton @click="emit('trigger-primary-action')">
        {{ primaryAction.label }}
      </LiButton>
    </div>

    <div
      v-for="mapAction in mapActions"
      :key="mapAction.actionId"
      class="map-action-section"
    >
      <p v-if="mapAction.description" class="map-action-text map-action-description">
        {{ mapAction.description }}
      </p>
      <LiButton @click="emit('trigger-map-action', mapAction.actionId)">
        {{ mapAction.label }}
      </LiButton>
    </div>
  </div>
</template>

<script setup>
import LiButton from '../../components/base/LiButton.vue';

defineProps({
  primaryAction: {
    type: Object,
    default: null
  },
  mapActions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['trigger-primary-action', 'trigger-map-action']);
</script>

<style scoped>
.map-action-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-action-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(236, 156, 227, 0.2);
  background: rgba(255, 193, 245, 0.06);
}

.map-action-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(13px, 1vw, 16px);
  line-height: 1.7;
}

.map-action-description {
  margin-bottom: 0;
}
</style>
