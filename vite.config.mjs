import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { existsSync, renameSync } from 'node:fs'
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

function pagesRootIndex() {
  return {
    name: 'pages-root-index',
    closeBundle() {
      const source = fileURLToPath(new URL('./dist-pages/index.pages.html', import.meta.url))
      const target = fileURLToPath(new URL('./dist-pages/index.html', import.meta.url))
      if (existsSync(source)) renameSync(source, target)
    },
  }
}

export default defineConfig(({ mode }) => {
  const isOffline = mode === 'offline'
  const isPages = mode === 'pages'

  return {
    base: isOffline ? './' : isPages ? '/liluo_domain/' : '/domain/',
    publicDir: isOffline || isPages ? false : 'public',
    plugins: [
      vue(),
      AutoImport({ imports: ['vue'] }),
      Components({ dirs: ['src/components/base'] }),
      isOffline && offlineClassicScript(),
      isPages && pagesRootIndex(),

      // 可选：兼容更老的浏览器（会增大体积）
      // legacy(),
    ].filter(Boolean),
    build: isPages
    ? {
        outDir: 'dist-pages',
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
        rollupOptions: {
          input: fileURLToPath(new URL('./index.pages.html', import.meta.url)),
        },
      }
    : isOffline
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
