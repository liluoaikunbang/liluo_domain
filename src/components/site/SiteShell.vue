<template>
  <div class="site-shell">
    <a class="skip-link" href="#site-content">跳到正文</a>
    <header class="site-header">
      <RouterLink class="site-brand" to="/">
        <span>璃落宇宙</span>
        <small>AI 原生叙事游戏生产体系</small>
      </RouterLink>
      <nav class="site-nav" aria-label="主导航">
        <RouterLink
          v-for="item in navigation"
          :key="item.path"
          :class="{ 'is-emphasis': item.emphasis }"
          :to="item.path"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <button class="site-menu-button" type="button" :aria-expanded="isMenuOpen" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
        <b>菜单</b>
      </button>
    </header>

    <div v-if="isMenuOpen" class="site-mobile-layer" @click.self="closeMenu">
      <nav class="site-mobile-nav" aria-label="移动端导航">
        <RouterLink v-for="item in allNavigation" :key="item.path" :to="item.path" @click="closeMenu">
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <main id="site-content">
      <slot />
    </main>

    <footer class="site-footer">
      <div>
        <strong>璃落宇宙</strong>
        <p>公开官网展示概念、制作阶段和真实证据；`/game` 仍是正式游戏入口。</p>
      </div>
      <nav aria-label="页脚导航">
        <RouterLink v-for="item in footerNavigation" :key="item.path" :to="item.path">
          {{ item.label }}
        </RouterLink>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, watch, ref } from 'vue'
import { navigation, footerNavigation } from '../../content/site/siteData'

const isMenuOpen = ref(false)
const allNavigation = computed(() => [...navigation, ...footerNavigation])

function closeMenu() {
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function onKeydown(event) {
  if (event.key === 'Escape') closeMenu()
}

watch(isMenuOpen, (nextValue) => {
  document.body.classList.toggle('site-menu-lock', nextValue)
  if (nextValue) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.body.classList.remove('site-menu-lock')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.site-shell {
  min-height: 100vh;
  color: #f5f0e7;
  background: #14171b;
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
  text-align: left;
}

.skip-link {
  position: fixed;
  left: 16px;
  top: -60px;
  z-index: 30;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f0c879;
  color: #17120d;
}

.skip-link:focus {
  top: 12px;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 66px;
  padding: 0 max(20px, calc((100vw - 1180px) / 2));
  border-bottom: 1px solid rgba(245, 240, 231, 0.1);
  background: rgba(20, 23, 27, 0.88);
  backdrop-filter: blur(16px);
}

.site-brand {
  display: grid;
  gap: 2px;
  color: #fff6e8;
  text-decoration: none;
}

.site-brand span {
  font-size: 1.04rem;
  font-weight: 800;
}

.site-brand small {
  color: #cfc6b6;
  font-size: 0.72rem;
}

.site-nav,
.site-footer nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-nav a,
.site-footer a,
.site-mobile-nav a {
  border-radius: 6px;
  color: #eadfcf;
  font-size: 0.92rem;
  text-decoration: none;
}

.site-nav a {
  padding: 8px 10px;
}

.site-nav a.router-link-active,
.site-nav a:hover,
.site-nav a:focus-visible,
.site-mobile-nav a.router-link-active {
  background: rgba(238, 197, 117, 0.14);
  color: #fff;
}

.site-nav .is-emphasis {
  border: 1px solid rgba(238, 197, 117, 0.6);
  color: #f4ce86;
}

.site-menu-button {
  display: none;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(245, 240, 231, 0.18);
  border-radius: 6px;
  background: transparent;
  color: #fff;
}

.site-menu-button span {
  display: block;
  width: 19px;
  height: 2px;
  margin: 3px 0;
  background: currentColor;
}

.site-menu-button b {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.site-mobile-layer {
  position: fixed;
  inset: 0;
  z-index: 19;
  padding: 78px 18px 18px;
  background: rgba(7, 9, 12, 0.68);
}

.site-mobile-nav {
  display: grid;
  gap: 8px;
  margin-left: auto;
  max-width: 360px;
  padding: 16px;
  border: 1px solid rgba(245, 240, 231, 0.12);
  border-radius: 8px;
  background: #181d23;
}

.site-mobile-nav a {
  padding: 12px;
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 38px max(20px, calc((100vw - 1180px) / 2));
  border-top: 1px solid rgba(245, 240, 231, 0.1);
  background: #111418;
}

.site-footer p {
  max-width: 560px;
  margin: 8px 0 0;
  color: #cfc6b6;
  font-size: 0.92rem;
  line-height: 1.7;
}

.site-footer nav {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.site-footer a {
  padding: 6px 8px;
}

@media (max-width: 860px) {
  .site-nav {
    display: none;
  }

  .site-menu-button {
    display: grid;
  }

  .site-footer {
    display: grid;
  }

  .site-footer nav {
    justify-content: flex-start;
  }
}
</style>

<style>
body.site-menu-lock {
  overflow: hidden;
}
</style>
