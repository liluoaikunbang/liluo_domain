<template>
  <span class="status-badge" :data-kind="kind">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { developmentStatuses, evidenceLevels } from '../../content/site/siteData'

const props = defineProps({
  value: { type: String, required: true },
  kind: { type: String, default: 'status' },
})

const label = computed(() => {
  if (props.kind === 'evidence') return evidenceLevels[props.value] || props.value
  return developmentStatuses[props.value] || props.value
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  width: max-content;
  padding: 3px 8px;
  border: 1px solid rgba(238, 197, 117, 0.36);
  border-radius: 999px;
  color: #f2d08a;
  background: rgba(238, 197, 117, 0.1);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}

.status-badge[data-kind='evidence'] {
  border-color: rgba(145, 190, 180, 0.42);
  color: #b5e5db;
  background: rgba(91, 145, 137, 0.14);
}
</style>
