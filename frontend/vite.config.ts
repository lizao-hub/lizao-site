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
   * 项目的点赞与留言、以及影像页的照片都从后端来，所以 dev / preview 要把
   * `/api` 和 `/media` 都转到 uvicorn（默认 8000）。**只在开发时有效** ——
   * 上线时是 FastAPI 自己（或前面的反向代理）在干这件事。
   *
   * 后端没起也不会报错：留言区取不到就整块不渲染、照片墙拉不到就留空，
   * **正文照常显示** —— 内容在前端那份数据文件里，不依赖这个接口。
   * 想看到留言和照片就先把后端跑起来
   * （`cd backend && uv run uvicorn main:app --reload --port 8000`）。
   */
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
})
