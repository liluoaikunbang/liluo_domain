import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import { createPinia } from "pinia";
import router from './router'
const pinia = createPinia()


createApp(App).use(pinia).use(router).use(ArcoVue).mount('#app')

const checkVersion = () => { // 检查版本号，确保每次更新版本后用户端会清空缓存重新进入页面，防止报错
        
    const currentVersion = `${new Date().getMinutes().toString()}` // 假设这是你当前的版本号
    const storedVersion = localStorage.getItem('appVersion')

    if (storedVersion !== currentVersion) {
        // 版本不一致，执行强制刷新操作（Ctrl+F5）
        window.location.reload(true)
        console.log('Finish reload pages.' + currentVersion)
    }

    // 更新localStorage中的版本号
    localStorage.setItem('appVersion', currentVersion)
}
checkVersion()


