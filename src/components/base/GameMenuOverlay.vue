<template>
  <transition name="game-menu-fade">
    <section
      v-if="visible"
      class="game-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="旅途菜单"
    >
      <button
        class="game-menu-backdrop"
        type="button"
        aria-label="关闭菜单遮罩"
        @click="$emit('close')"
      ></button>

      <div class="game-menu-panel">
        <button class="game-menu-close" type="button" aria-label="关闭菜单" @click="$emit('close')">
          ×
        </button>

        <div class="game-menu-body">
          <nav class="game-menu-sidebar" aria-label="菜单栏目">
            <button
              v-for="item in menuTabs"
              :key="item.key"
              class="game-menu-tab"
              :class="{ 'game-menu-tab-active': item.key === activeTabKey }"
              type="button"
              @click="activeTabKey = item.key"
            >
              <span class="game-menu-tab-label">{{ item.label }}</span>
            </button>
          </nav>

          <section class="game-menu-content" aria-label="当前栏目内容">
            <section class="menu-placeholder-card menu-placeholder-card-primary" aria-label="当前栏目">
              <span class="menu-placeholder-label">{{ activeTab.label }}</span>
              <strong class="menu-placeholder-title">{{ activeTab.title }}</strong>
              <p class="menu-placeholder-text">
                {{ activeTab.description }}
              </p>
            </section>

            <section class="menu-placeholder-grid" aria-label="内容预留区">
              <article class="menu-placeholder-card">
                <span class="menu-placeholder-label">当前状态</span>
                <strong class="menu-placeholder-title">占位展示中</strong>
                <p class="menu-placeholder-text">
                  这一栏后续会替换成 {{ activeTab.label }} 的正式界面，目前先保留布局与风格位置。
                </p>
              </article>

              <article class="menu-placeholder-card">
                <span class="menu-placeholder-label">扩展方向</span>
                <strong class="menu-placeholder-title">可继续接入内容</strong>
                <p class="menu-placeholder-text">
                  可在这里继续接背包条目、技能列表、任务详情、剧情回顾、存档位与系统设置。
                </p>
              </article>
            </section>
          </section>
        </div>
      </div>
    </section>
  </transition>
</template>

<script setup>
import { computed, ref } from 'vue';

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);

const menuTabs = [
  {
    key: 'items',
    label: '物品',
    title: '物品栏正在预备中',
    description: '之后可用于查看普通物品、关键道具与探索收集内容。'
  },
  {
    key: 'skills',
    label: '技能',
    title: '技能栏正在预备中',
    description: '之后可在这里承接角色技能、被动效果与战斗外能力展示。'
  },
  {
    key: 'quests',
    label: '任务',
    title: '任务栏正在预备中',
    description: '之后可用于整理主线、支线、地点线索与当前推进目标。'
  },
  {
    key: 'review',
    label: '回顾',
    title: '回顾栏正在预备中',
    description: '之后可在这里收纳重要对话、剧情摘要与探索记录。'
  },
  {
    key: 'save',
    label: '存档',
    title: '存档栏正在预备中',
    description: '之后可接入存档读档、自动存档与进度摘要信息。'
  },
  {
    key: 'settings',
    label: '设置',
    title: '设置栏正在预备中',
    description: '之后可继续扩展音量、按键、显示效果与辅助选项。'
  }
];

const activeTabKey = ref(menuTabs[0].key);

const activeTab = computed(
  () => menuTabs.find((item) => item.key === activeTabKey.value) ?? menuTabs[0]
);
</script>

<style scoped>
.game-menu-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  box-sizing: border-box;
}

.game-menu-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(31, 14, 37, 0.2);
  cursor: pointer;
}

.game-menu-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: clamp(24px, 2.6vw, 34px);
  box-sizing: border-box;
  border: 1px solid rgba(236, 180, 231, 0.28);
  background:
    linear-gradient(180deg, rgba(78, 40, 92, 0.92), rgba(57, 27, 68, 0.92));
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 235, 248, 0.06);
}

.game-menu-close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(250, 213, 243, 0.22);
  background: rgba(94, 50, 108, 0.72);
  color: #fff6fc;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
}

.game-menu-close:hover,
.game-menu-close:focus-visible {
  border-color: rgba(255, 233, 250, 0.44);
  background: rgba(134, 78, 149, 0.9);
  transform: scale(1.04);
  outline: none;
}

.game-menu-body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(96px, 132px) minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
}

.game-menu-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  border: 1px solid rgba(235, 192, 229, 0.16);
  background: rgba(61, 29, 72, 0.78);
  overflow: hidden;
}

.game-menu-tab {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 6px 10px;
  border: none;
  border-bottom: 1px solid rgba(242, 206, 237, 0.12);
  background: rgba(103, 55, 118, 0.5);
  color: #fff5fc;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.game-menu-tab:hover,
.game-menu-tab:focus-visible {
  background: rgba(120, 68, 136, 0.7);
  transform: none;
  box-shadow: inset 3px 0 0 rgba(255, 202, 241, 0.5);
  outline: none;
}

.game-menu-tab-active {
  background: linear-gradient(90deg, rgba(150, 79, 164, 0.78), rgba(112, 58, 127, 0.74));
  box-shadow:
    inset 4px 0 0 rgba(255, 214, 245, 0.76),
    inset 0 0 0 1px rgba(255, 241, 250, 0.06);
}

.game-menu-tab-label {
  font-size: 14px;
  letter-spacing: 0.06em;
}

.game-menu-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.menu-placeholder-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  flex: 1;
}

.menu-placeholder-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(239, 194, 233, 0.2);
  background: rgba(88, 45, 102, 0.72);
}

.menu-placeholder-card-primary {
  min-height: 180px;
  justify-content: center;
  background: rgba(95, 48, 109, 0.8);
}

.menu-placeholder-label {
  color: rgba(255, 225, 244, 0.68);
  font-size: 12px;
  letter-spacing: 0.14em;
}

.menu-placeholder-title {
  color: #fff4fb;
  font-size: 20px;
  font-weight: 500;
}

.menu-placeholder-text {
  margin: 0;
  color: rgba(255, 241, 249, 0.82);
  font-size: 14px;
  line-height: 1.7;
}

.game-menu-fade-enter-active,
.game-menu-fade-leave-active {
  transition: opacity 0.18s ease;
}

.game-menu-fade-enter-from,
.game-menu-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .game-menu-body {
    grid-template-columns: 1fr;
  }

  .game-menu-close {
    top: 0;
    right: 0;
  }

  .game-menu-sidebar {
    padding: 0;
  }

  .menu-placeholder-grid {
    grid-template-columns: 1fr;
  }
}
</style>