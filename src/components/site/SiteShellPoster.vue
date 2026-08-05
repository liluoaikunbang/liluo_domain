<template>
  <div class="poster-shell">
    <a class="poster-shell__skip" href="#site-content">跳到正文</a>

    <header class="poster-shell__header">
      <div class="poster-shell__inner">
        <RouterLink class="poster-shell__brand" to="/">
          <span>璃落宇宙</span>
          <small>AI 原生叙事游戏生产体系</small>
        </RouterLink>

        <nav class="poster-shell__nav" aria-label="主导航">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            :class="{ 'is-emphasis': item.emphasis }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <button class="poster-shell__menu" type="button" :aria-expanded="isMenuOpen" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
          <b>菜单</b>
        </button>
      </div>
    </header>

    <div v-if="isMenuOpen" class="poster-shell__mobile-layer" @click.self="closeMenu">
      <nav class="poster-shell__mobile-nav" aria-label="移动导航">
        <RouterLink v-for="item in allNavigation" :key="item.path" :to="item.path" @click="closeMenu">
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <main id="site-content" class="poster-shell__main">
      <slot />
    </main>

    <footer class="poster-shell__footer">
      <div class="poster-shell__inner poster-shell__footer-inner">
        <div class="poster-shell__footer-copy">
          <strong>璃落宇宙</strong>
          <p>公开官网负责视觉展台、真实证据、生产体系与协作转化；`/game` 仍是正式旗舰入口。</p>
        </div>
        <nav class="poster-shell__footer-nav" aria-label="页脚导航">
          <RouterLink v-for="item in footerNavigation" :key="item.path" :to="item.path">
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { footerNavigation, navigation } from '../../content/site/siteCatalog'

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
  document.body.classList.toggle('poster-shell-lock', nextValue)
  if (nextValue) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.body.classList.remove('poster-shell-lock')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.poster-shell {
  min-height: 100vh;
  color: #f4efe6;
  background:
    radial-gradient(circle at top left, rgba(184, 111, 43, 0.2), transparent 24%),
    radial-gradient(circle at top right, rgba(70, 115, 178, 0.18), transparent 22%),
    linear-gradient(180deg, #0d1118 0%, #121923 36%, #0b1017 100%);
}

.poster-shell__skip {
  position: fixed;
  top: -52px;
  left: 18px;
  z-index: 60;
  padding: 10px 14px;
  border-radius: 999px;
  background: #dba44f;
  color: #12161d;
  text-decoration: none;
}

.poster-shell__skip:focus {
  top: 12px;
}

.poster-shell__header {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(18px);
  background: rgba(12, 17, 24, 0.86);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.poster-shell__inner {
  width: min(1240px, calc(100% - 36px));
  margin: 0 auto;
}

.poster-shell__header .poster-shell__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 78px;
}

.poster-shell__brand {
  display: grid;
  gap: 4px;
  color: #faf3e7;
  text-decoration: none;
}

.poster-shell__brand span {
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.poster-shell__brand small {
  color: #9ba7b8;
  font-size: 0.74rem;
}

.poster-shell__nav,
.poster-shell__footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.poster-shell__nav a,
.poster-shell__footer-nav a,
.poster-shell__mobile-nav a {
  color: #d7deea;
  text-decoration: none;
  font-weight: 700;
}

.poster-shell__nav a {
  padding: 10px 12px;
  border-radius: 999px;
}

.poster-shell__nav a.router-link-active,
.poster-shell__nav a:hover,
.poster-shell__nav a:focus-visible,
.poster-shell__mobile-nav a.router-link-active {
  background: rgba(219, 164, 79, 0.14);
  color: #fff3d9;
}

.poster-shell__nav .is-emphasis {
  border: 1px solid rgba(219, 164, 79, 0.34);
  background: rgba(219, 164, 79, 0.16);
  color: #ffd99d;
}

.poster-shell__menu {
  display: none;
  position: relative;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(22, 29, 40, 0.9);
}

.poster-shell__menu span {
  display: block;
  width: 20px;
  height: 2px;
  margin: 4px auto;
  background: #f3e7d0;
}

.poster-shell__menu b {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.poster-shell__mobile-layer {
  position: fixed;
  inset: 0;
  z-index: 35;
  padding: 84px 18px 18px;
  background: rgba(5, 8, 13, 0.56);
}

.poster-shell__mobile-nav {
  display: grid;
  gap: 8px;
  max-width: 360px;
  margin-left: auto;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: rgba(14, 20, 29, 0.98);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.poster-shell__mobile-nav a {
  padding: 12px 14px;
  border-radius: 16px;
}

.poster-shell__main {
  min-height: calc(100vh - 220px);
}

.poster-shell__footer {
  margin-top: 72px;
  padding: 38px 0 54px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(10, 14, 21, 0.44), rgba(7, 10, 15, 0.96));
}

.poster-shell__footer-inner {
  display: flex;
  justify-content: space-between;
  gap: 28px;
}

.poster-shell__footer-copy strong {
  color: #f5efe4;
  font-size: 1rem;
}

.poster-shell__footer-copy p {
  max-width: 620px;
  margin: 10px 0 0;
  color: #9eabbd;
  line-height: 1.8;
}

.poster-shell__footer-nav {
  justify-content: flex-end;
}

.poster-shell__footer-nav a {
  padding: 8px 0 8px 10px;
}

@media (max-width: 980px) {
  .poster-shell__nav {
    display: none;
  }

  .poster-shell__menu {
    display: block;
  }

  .poster-shell__footer-inner {
    display: grid;
  }

  .poster-shell__footer-nav {
    justify-content: flex-start;
  }
}
</style>

<style>
body.poster-shell-lock {
  overflow: hidden;
}
</style>
