<template>
  <section class="update-records-panel" aria-labelledby="update-records-title">
    <header class="update-records-header">
      <div>
        <span class="update-records-eyebrow">旅程札记</span>
        <h2 id="update-records-title" class="update-records-title">更新记录</h2>
      </div>
      <button ref="backButtonRef" class="update-records-back" type="button" @click="emit('close')">
        返回
      </button>
    </header>

    <p class="update-records-intro">
      从最近一次变化开始，回看城堡逐步生长的足迹。
    </p>

    <ol class="update-records-list" aria-label="按月份分组的更新记录">
      <li v-for="group in recordGroups" :key="group.key" class="update-record-month">
        <button
          class="update-record-month-toggle"
          type="button"
          :aria-expanded="isMonthExpanded(group.key)"
          :aria-controls="`update-record-month-${group.key}`"
          @click="toggleMonth(group.key)"
        >
          <span>{{ group.label }}</span>
          <span class="update-record-month-meta">
            {{ group.records.length }} 条
            <span aria-hidden="true">{{ isMonthExpanded(group.key) ? '−' : '+' }}</span>
          </span>
        </button>

        <ol
          v-if="isMonthExpanded(group.key)"
          :id="`update-record-month-${group.key}`"
          class="update-record-month-list"
          :aria-label="`${group.label}更新`"
        >
          <li v-for="record in group.records" :key="record.id" class="update-record-item">
            <div class="update-record-marker" aria-hidden="true"></div>
            <article class="update-record-card">
              <div class="update-record-meta">
                <time :datetime="record.date">{{ record.date }}</time>
                <span>记录 {{ record.id }}</span>
              </div>
              <h3>{{ record.title }}</h3>
              <p>{{ record.summary }}</p>
            </article>
          </li>
        </ol>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { groupUpdateRecordsByMonth } from '../../../data/global/updateRecordGroups.js';

const props = defineProps({
  records: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close']);
const backButtonRef = ref(null);
const recordGroups = computed(() => groupUpdateRecordsByMonth(props.records));
const expandedMonthKey = ref(recordGroups.value[0]?.key ?? null);

const isMonthExpanded = (monthKey) => expandedMonthKey.value === monthKey;

const toggleMonth = (monthKey) => {
  expandedMonthKey.value = isMonthExpanded(monthKey) ? null : monthKey;
};

onMounted(() => {
  nextTick(() => backButtonRef.value?.focus());
});
</script>

<style scoped>
.update-records-panel {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  padding: clamp(16px, 2vw, 24px);
  box-sizing: border-box;
  border: 2px solid rgba(255, 226, 246, 0.42);
  background:
    linear-gradient(180deg, rgba(72, 34, 82, 0.94), rgba(43, 21, 52, 0.94));
  box-shadow:
    8px 8px 0 rgba(42, 17, 43, 0.42),
    inset 0 0 0 2px rgba(255, 240, 250, 0.06);
  backdrop-filter: blur(10px);
}

.update-records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.update-records-eyebrow {
  color: rgba(255, 213, 241, 0.74);
  font-size: 12px;
  letter-spacing: 0.18em;
}

.update-records-title {
  margin: 3px 0 0;
  color: #fff5fb;
  font-size: clamp(22px, 2.2vw, 32px);
  font-weight: 500;
  letter-spacing: 0.12em;
}

.update-records-back {
  min-width: 76px;
  min-height: 36px;
  border: 2px solid rgba(255, 237, 249, 0.88);
  background: rgba(126, 52, 112, 0.68);
  color: #fff8fc;
  cursor: pointer;
}

.update-records-back:hover,
.update-records-back:focus-visible {
  outline: none;
  border-color: #fffaff;
  background: rgba(158, 69, 140, 0.86);
  box-shadow: 3px 3px 0 rgba(35, 13, 37, 0.52);
  transform: translate(-1px, -1px);
}

.update-records-intro {
  margin: 12px 0 14px;
  color: rgba(255, 235, 248, 0.78);
  font-size: 13px;
  line-height: 1.6;
}

.update-records-list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  margin: 0;
  padding: 0 8px 0 0;
  list-style: none;
  scrollbar-color: rgba(220, 148, 204, 0.72) rgba(35, 17, 43, 0.44);
  scrollbar-width: thin;
}

.update-record-month {
  margin-bottom: 10px;
}

.update-record-month-toggle {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 228, 247, 0.28);
  background: rgba(91, 39, 82, 0.82);
  color: #fff5fb;
  font: inherit;
  font-size: 15px;
  letter-spacing: 0.08em;
  text-align: left;
  cursor: pointer;
}

.update-record-month-toggle:hover,
.update-record-month-toggle:focus-visible {
  outline: none;
  border-color: rgba(255, 237, 249, 0.88);
  background: rgba(126, 52, 112, 0.82);
}

.update-record-month-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(244, 194, 229, 0.78);
  font-size: 12px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.update-record-month-list {
  margin: 10px 0 0 8px;
  padding: 0 0 0 19px;
  list-style: none;
}

.update-record-item {
  position: relative;
  padding: 0 0 14px 22px;
  border-left: 2px solid rgba(217, 148, 205, 0.36);
}

.update-record-item:last-child {
  padding-bottom: 2px;
}

.update-record-marker {
  position: absolute;
  top: 15px;
  left: -6px;
  width: 8px;
  height: 8px;
  border: 2px solid #f4c9e8;
  background: #7b376e;
  box-shadow: 0 0 8px rgba(248, 190, 231, 0.48);
  transform: rotate(45deg);
}

.update-record-card {
  padding: 12px 14px;
  border: 1px solid rgba(255, 228, 247, 0.18);
  background: rgba(255, 242, 250, 0.065);
}

.update-record-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(244, 194, 229, 0.72);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.update-record-card h3 {
  margin: 6px 0;
  color: #fff7fc;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
}

.update-record-card p {
  margin: 0;
  color: rgba(255, 239, 249, 0.84);
  font-size: 13px;
  line-height: 1.65;
}

@media (max-width: 680px) {
  .update-records-panel {
    padding: 14px;
  }

  .update-record-meta {
    flex-direction: column;
    gap: 3px;
  }

  .update-record-card {
    padding: 10px 12px;
  }
}
</style>