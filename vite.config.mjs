import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const isOffline = mode === 'offline'

  return {
    base: isOffline ? './' : '/domain/',
    publicDir: isOffline ? false : 'public',
    plugins: [
      vue(),
      AutoImport({ imports: ['vue'] }),
      Components({ dirs: ['src/components/base'] }),

      // 只在 offline 模式下打成单文件 HTML
      isOffline && viteSingleFile({
        useRecommendedBuildConfig: true,
        removeViteModuleLoader: true,
      }),

      // 可选：兼容更老的浏览器（会增大体积）
      // legacy(),
    ].filter(Boolean),
    build: isOffline
    ? {
        // ✅ 关键：让图片/字体尽量全部内联到 index.html（否则会输出到 dist/assets）
        assetsInlineLimit: 100_000_000,
  
        // 调试阶段可以先开着：方便看报错
        sourcemap: true,
        minify: false,
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
