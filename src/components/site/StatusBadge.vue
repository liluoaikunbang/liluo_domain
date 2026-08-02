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
  border: 1px solid rgba(25, 45, 86, 0.14);
  border-radius: 999px;
  color: #1a2a44;
  background: rgba(255, 249, 242, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
}

.status-badge[data-tone='evidence'] {
  border-color: rgba(38, 114, 124, 0.2);
  color: #17565d;
  background: rgba(221, 244, 246, 0.95);
}

.status-badge[data-tone='ready'] {
  border-color: rgba(193, 124, 56, 0.24);
  color: #7f3f12;
  background: rgba(255, 237, 218, 0.96);
}

.status-badge[data-tone='published'] {
  border-color: rgba(43, 106, 76, 0.22);
  color: #1d5d43;
  background: rgba(231, 249, 239, 0.96);
}

.status-badge[data-tone='planned'] {
  border-color: rgba(81, 105, 139, 0.2);
  color: #2e4f76;
  background: rgba(234, 241, 249, 0.96);
}

.status-badge[data-tone='review_required'] {
  border-color: rgba(124, 79, 30, 0.2);
  color: #875224;
  background: rgba(255, 243, 221, 0.96);
}
</style>
