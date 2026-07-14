<template>
  <section class="menu-card menu-card-primary" aria-label="当前栏目">
    <span class="menu-card-label">{{ activeTab.label }}</span>
    <strong class="menu-card-title">{{ activeTab.title }}</strong>
    <p class="menu-card-text">{{ activeTab.description }}</p>
  </section>

  <section class="menu-placeholder-grid" aria-label="内容预留区">
    <article class="menu-card" :data-menu-nav="true" data-menu-group="placeholder-cards" tabindex="0">
      <span class="menu-card-label">当前状态</span>
      <strong class="menu-card-title">占位展示中</strong>
      <p class="menu-card-text">
        这一栏后续会替换成 {{ activeTab.label }} 的正式界面，目前先保留布局与风格位置。
      </p>
    </article>

    <article class="menu-card" :data-menu-nav="true" data-menu-group="placeholder-cards" tabindex="0">
      <span class="menu-card-label">扩展方向</span>
      <strong class="menu-card-title">可继续接入内容</strong>
      <p class="menu-card-text">
        可以继续承接背包条目、技能列表、任务详情、剧情回顾与系统设置。
      </p>
    </article>
  </section>
</template>

<script setup>
defineProps({
  activeTab: {
    type: Object,
    required: true
  }
});
</script>
