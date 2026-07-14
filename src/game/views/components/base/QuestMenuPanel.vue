<template>
  <section class="quest-menu-panel" aria-label="任务栏">
    <section class="menu-card quest-card" aria-label="任务栏内容">
      <aside class="quest-tree-panel" aria-label="任务列表">
        <div class="quest-tree-header">
          <strong class="inventory-detail-title">任务列表</strong>
          <span class="inventory-category-note">按冒险推进、支线、伙伴与完成记录整理。</span>
        </div>

        <div class="quest-tree-list" role="tree" aria-label="任务分类树">
          <div v-for="section in questSections" :key="section.key" class="quest-tree-node">
            <button
              class="quest-tree-branch"
              :class="{ 'quest-tree-branch-active': section.key === activeQuestBranchKey }"
              :data-menu-nav="true"
              data-menu-group="quest-tree-items"
              data-quest-kind="branch"
              :data-menu-key="section.key"
              type="button"
              :aria-expanded="isQuestBranchExpanded(section.key)"
              @focus="$emit('set-active-branch', section.key)"
              @click="$emit('toggle-branch', section.key)"
            >
              <span class="quest-tree-caret" aria-hidden="true">
                {{ isQuestBranchExpanded(section.key) ? '▾' : '▸' }}
              </span>
              <span class="quest-tree-label">{{ section.label }}</span>
              <span class="quest-tree-count">{{ countQuestTasks(section) }}</span>
            </button>

            <div
              v-if="isQuestBranchExpanded(section.key)"
              class="quest-tree-children"
              role="group"
            >
              <article
                v-for="task in section.tasks ?? []"
                :key="task.key"
                class="quest-tree-task"
                :class="{ 'quest-tree-task-active': task.key === activeQuestTaskKey }"
                :data-menu-nav="true"
                data-menu-group="quest-tree-items"
                data-quest-kind="task"
                :data-menu-key="task.key"
                tabindex="0"
                role="treeitem"
                :aria-label="task.title"
                :aria-selected="task.key === activeQuestTaskKey"
                @focus="$emit('select-task', task.key)"
                @click="$emit('select-task', task.key)"
              >
                <span class="quest-task-title">{{ task.title }}</span>
                <span class="quest-task-status">{{ task.status }}</span>
              </article>

              <div
                v-for="group in section.groups ?? []"
                :key="group.key"
                class="quest-tree-node quest-tree-node-nested"
              >
                <button
                  class="quest-tree-branch quest-tree-branch-nested"
                  :class="{ 'quest-tree-branch-active': group.key === activeQuestBranchKey }"
                  :data-menu-nav="true"
                  data-menu-group="quest-tree-items"
                  data-quest-kind="branch"
                  :data-menu-key="group.key"
                  type="button"
                  :aria-expanded="isQuestBranchExpanded(group.key)"
                  @focus="$emit('set-active-branch', group.key)"
                  @click="$emit('toggle-branch', group.key)"
                >
                  <span class="quest-tree-caret" aria-hidden="true">
                    {{ isQuestBranchExpanded(group.key) ? '▾' : '▸' }}
                  </span>
                  <span class="quest-tree-label">{{ group.label }}</span>
                  <span class="quest-tree-count">{{ countQuestTasks(group) }}</span>
                </button>

                <div
                  v-if="isQuestBranchExpanded(group.key)"
                  class="quest-tree-children quest-tree-children-nested"
                  role="group"
                >
                  <article
                    v-for="task in group.tasks"
                    :key="task.key"
                    class="quest-tree-task"
                    :class="{ 'quest-tree-task-active': task.key === activeQuestTaskKey }"
                    :data-menu-nav="true"
                    data-menu-group="quest-tree-items"
                    data-quest-kind="task"
                    :data-menu-key="task.key"
                    tabindex="0"
                    role="treeitem"
                    :aria-label="task.title"
                    :aria-selected="task.key === activeQuestTaskKey"
                    @focus="$emit('select-task', task.key)"
                    @click="$emit('select-task', task.key)"
                  >
                    <span class="quest-task-title">{{ task.title }}</span>
                    <span class="quest-task-status">{{ task.status }}</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section class="quest-detail-panel" aria-label="任务详情">
        <template v-if="activeQuestTask">
          <div class="quest-detail-heading">
            <span class="menu-card-label">{{ activeQuestTask.categoryLabel }}</span>
            <strong class="menu-card-title">{{ activeQuestTask.title }}</strong>
            <span class="quest-detail-status">{{ activeQuestTask.status }}</span>
          </div>
          <p class="menu-card-text quest-detail-summary">{{ activeQuestTask.summary }}</p>
          <div class="quest-detail-body">
            <p
              v-for="paragraph in resolvePlaceholderDetailParagraphs(activeQuestTask, placeholderQuestDetailParagraphs)"
              :key="paragraph"
              class="menu-card-text"
            >
              {{ paragraph }}
            </p>
          </div>
        </template>

        <template v-else>
          <div class="quest-detail-empty">
            <strong class="menu-card-title">尚未选择任务</strong>
            <p class="menu-card-text">
              在左侧展开一个任务分类，再选择其中的任务后，这里会显示对应详情。
            </p>
          </div>
        </template>
      </section>
    </section>
  </section>
</template>

<script setup>
import { resolvePlaceholderDetailParagraphs } from './gameMenuHelpers';

defineProps({
  questSections: { type: Array, default: () => [] },
  activeQuestBranchKey: { type: String, default: '' },
  activeQuestTask: { type: Object, default: null },
  activeQuestTaskKey: { type: String, default: '' },
  placeholderQuestDetailParagraphs: { type: Array, default: () => [] },
  countQuestTasks: { type: Function, required: true },
  isQuestBranchExpanded: { type: Function, required: true }
});

defineEmits(['set-active-branch', 'toggle-branch', 'select-task']);
</script>
