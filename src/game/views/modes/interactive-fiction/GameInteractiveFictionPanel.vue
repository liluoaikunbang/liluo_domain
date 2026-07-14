<template>
  <GameSidePanel side="right" aria-label="互动小说副本信息" :title="payload.scenario.title">
    <div class="interactive-fiction-panel">
      <GameScrollArea class="interactive-fiction-panel__content">
        <section class="interactive-fiction-panel__section">
          <p class="interactive-fiction-panel__kicker">任务提示</p>
          <ul
            v-if="payload.activeTasks.length || payload.completedTasks.length"
            class="interactive-fiction-panel__list"
          >
            <li v-for="task in payload.activeTasks" :key="task.id">
              <strong>{{ task.title }}</strong>
              <span>{{ task.hint }}</span>
            </li>
            <li
              v-for="task in payload.completedTasks"
              :key="`completed-${task.id}`"
              class="interactive-fiction-panel__list-item--done"
            >
              <strong>{{ task.title }}</strong>
              <span>已完成</span>
            </li>
          </ul>
          <p v-else class="interactive-fiction-panel__muted">暂无进行中的任务。</p>
        </section>

        <section class="interactive-fiction-panel__section">
          <p class="interactive-fiction-panel__kicker">线索</p>
          <ul v-if="payload.visibleClues.length" class="interactive-fiction-panel__list">
            <li v-for="clue in payload.visibleClues" :key="clue.id">
              <strong>{{ clue.title }}</strong>
              <span>{{ clue.text }}</span>
            </li>
          </ul>
          <p v-else class="interactive-fiction-panel__muted">还没有发现线索。</p>
        </section>
      </GameScrollArea>

      <div class="interactive-fiction-panel__actions">
        <button class="interactive-fiction-panel__action" type="button" @click="$emit('restart')">
          重新开始副本
        </button>
        <button class="interactive-fiction-panel__action" type="button" @click="$emit('leave')">
          离开副本
        </button>
      </div>
    </div>
  </GameSidePanel>
</template>

<script setup lang="ts">
import type { InteractiveFictionPayload } from '../../../core/interactiveFiction';
import GameScrollArea from '../../components/base/GameScrollArea.vue';
import GameSidePanel from '../../shell/GameSidePanel.vue';

defineProps<{
  payload: InteractiveFictionPayload;
}>();

defineEmits<{
  restart: [];
  leave: [];
}>();
</script>

<style scoped>
.interactive-fiction-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.interactive-fiction-panel__content {
  flex: 1;
  min-height: 0;
  padding: 10px 12px 0;
  box-sizing: border-box;
}

.interactive-fiction-panel__section {
  padding: 0 0 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.interactive-fiction-panel__section:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}

.interactive-fiction-panel__kicker {
  margin: 0 0 10px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.3;
  font-weight: 500;
}

.interactive-fiction-panel__muted {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
  line-height: 1.6;
}

.interactive-fiction-panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 0 0 auto;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  box-sizing: border-box;
  background: rgba(45, 20, 53, 0.88);
}

.interactive-fiction-panel__action {
  width: 100%;
  min-height: 32px;
  padding: 7px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(173, 75, 154, 0.86);
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  cursor: pointer;
}

.interactive-fiction-panel__action:hover,
.interactive-fiction-panel__action:focus-visible {
  outline: none;
  border-color: rgba(255, 255, 255, 0.46);
  background: rgba(198, 92, 178, 0.95);
}

.interactive-fiction-panel__list {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.interactive-fiction-panel__list li {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.interactive-fiction-panel__list strong {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 500;
}

.interactive-fiction-panel__list span {
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  line-height: 1.55;
}

.interactive-fiction-panel__list-item--done {
  opacity: 0.72;
}
</style>
