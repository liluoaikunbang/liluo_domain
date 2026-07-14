<template>
  <router-view />
</template>

<script setup>
  import Index from './pages/Index.vue';
  document.body.setAttribute('arco-theme', 'dark') // 设置为夜间模式
</script>

<style scoped>
</style>
