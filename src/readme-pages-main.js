import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

const siteComponent = () => import('./pages/SitePosterPage.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'site-home', component: siteComponent },
    { path: '/readme', redirect: '/' },
    { path: '/worlds', name: 'site-worlds', component: siteComponent },
    { path: '/worlds/:worldId', name: 'site-world-detail', component: siteComponent },
    { path: '/worlds/:worldId/series/:seriesId', name: 'site-series', component: siteComponent },
    { path: '/characters', name: 'site-characters', component: siteComponent },
    { path: '/characters/:characterId', name: 'site-character-detail', component: siteComponent },
    { path: '/gallery', name: 'site-gallery', component: siteComponent },
    { path: '/evidence', name: 'site-evidence', component: siteComponent },
    { path: '/production', name: 'site-production', component: siteComponent },
    { path: '/roadmap', name: 'site-roadmap', component: siteComponent },
    { path: '/devlog', name: 'site-devlog', component: siteComponent },
    { path: '/collab', name: 'site-collab', component: siteComponent },
    { path: '/game', name: 'game', component: () => import('./game/views/GameView.vue') },
  ],
})

createApp(App).use(createPinia()).use(router).mount('#app')
