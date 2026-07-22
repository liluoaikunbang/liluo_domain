import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { fileURLToPath, URL } from 'node:url'

function offlineClassicScript() {
  return {
    name: 'offline-classic-script',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html
          .replace(/<script type="module"([^>]*)>/g, '<script defer$1>')
          .replace(/\s+crossorigin(?:=(['"])[^'"]*\1)?/g, '')
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const isOffline = mode === 'offline'

  return {
    base: isOffline ? './' : '/domain/',
    publicDir: isOffline ? false : 'public',
    plugins: [
      vue(),
      AutoImport({ imports: ['vue'] }),
      Components({ dirs: ['src/components/base'] }),
      isOffline && offlineClassicScript(),

      // 可选：兼容更老的浏览器（会增大体积）
      // legacy(),
    ].filter(Boolean),
    build: isOffline
    ? {
        outDir: 'dist-offline',
        assetsInlineLimit: 0,
        cssCodeSplit: false,
        sourcemap: false,
        minify: true,
        rollupOptions: {
          output: {
            format: 'iife',
            inlineDynamicImports: true,
          },
        },
      }
    : {
        // 正常部署到网站时可以用默认或你自己的设置
        sourcemap: true,
        minify: false,
      },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
