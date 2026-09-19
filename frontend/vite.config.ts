import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  /*
   * 项目的点赞与留言从后端来，所以 dev / preview 都要把 `/api` 转到 uvicorn
   * （默认 8000）。**只在开发时有效** —— 上线时是反向代理在干这件事。
   *
   * 后端没起也不会报错：留言区取不到就整块不渲染，**正文照常显示** ——
   * 内容在前端那份数据文件里，不依赖这个接口。
   * 想看到留言就先把后端跑起来
   * （`cd backend && uv run uvicorn main:app --reload --port 8000`）。
   */
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
