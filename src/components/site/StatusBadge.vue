<template>
  <span class="status-badge" :data-kind="kind" :data-tone="tone">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { developmentStatuses, evidenceLevels } from '../../content/site/siteCatalog'

const props = defineProps({
  value: { type: String, required: true },
  kind: { type: String, default: 'status' },
})

const label = computed(() => {
  if (props.kind === 'evidence') return evidenceLevels[props.value] || props.value
  if (props.kind === 'publication') {
    return {
      public_safe: '可公开',
      review_required: '待复审',
      internal_only: '内部保留',
    }[props.value] || props.value
  }
  return developmentStatuses[props.value] || props.value
})

const tone = computed(() => {
  if (props.kind === 'evidence') return 'evidence'
  if (props.kind === 'publication') return props.value
  if (props.value === 'promptReady') return 'ready'
  if (props.value === 'published') return 'published'
  if (props.value === 'planned') return 'planned'
  return 'default'
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  width: max-content;
  padding: 3px 9px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: #ebeed6;
  background: rgba(21, 28, 38, 0.9);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
}

.status-badge[data-tone='evidence'] {
  border-color: rgba(74, 180, 181, 0.32);
  color: #9fd7d2;
  background: rgba(13, 56, 62, 0.9);
}

.status-badge[data-tone='ready'] {
  border-color: rgba(220, 159, 84, 0.34);
  color: #f3c57f;
  background: rgba(74, 43, 12, 0.88);
}

.status-badge[data-tone='published'] {
  border-color: rgba(89, 173, 121, 0.32);
  color: #a9deb7;
  background: rgba(20, 62, 39, 0.88);
}

.status-badge[data-tone='planned'] {
  border-color: rgba(117, 145, 195, 0.28);
  color: #b5c7ea;
  background: rgba(24, 40, 71, 0.88);
}

.status-badge[data-tone='review_required'] {
  border-color: rgba(209, 143, 68, 0.3);
  color: #f0bf77;
  background: rgba(68, 36, 11, 0.88);
}
</style>
