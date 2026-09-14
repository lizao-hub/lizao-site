import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import AboutView from '@/views/AboutView.vue'
import NotesView from '@/views/NotesView.vue'
import GalleryView from '@/views/GalleryView.vue'

const DEFAULT_DESCRIPTION =
  '李泽敖的个人网站：杭州师范大学数学硕士研究生，研究方向为工业时序大模型、工业软测量与 AI Agent 应用。'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '李泽敖 | 简历与作品集', description: DEFAULT_DESCRIPTION },
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
    meta: {
      title: '项目 | 李泽敖',
      description: '三个完整项目：工业垂直大模型微调与 RAG、数据分析 AI Agent、无人机交通流实时分析系统。',
    },
  },
  {
    path: '/projects/:slug',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
    meta: { title: '项目 | 李泽敖', description: DEFAULT_DESCRIPTION },
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: {
      title: '关于 | 李泽敖',
      description: '教育背景、技术能力、科研成果、竞赛获奖与助教经历。',
    },
  },
  {
    path: '/notes',
    name: 'notes',
    component: NotesView,
    meta: {
      title: '笔记 | 李泽敖',
      description: '简历之外的技术笔记：Vue 入门、Python 脚本、读源码的方法与 CSS 布局。',
    },
  },
  {
    path: '/notes/:slug',
    name: 'post',
    // Markdown 渲染器只在这一页用得上，单独切一个 chunk，别拖慢首屏
    component: () => import('@/views/PostView.vue'),
    meta: { title: '笔记 | 李泽敖', description: DEFAULT_DESCRIPTION },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: GalleryView,
    meta: { title: '影像 | 李泽敖', description: '我的照片与朋友的照片。' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// SEO：每一页都有自己的 title 与 description。
// 文章详情页会在组件里用文章标题覆盖一次。
router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '李泽敖'
  const description = typeof to.meta.description === 'string' ? to.meta.description : DEFAULT_DESCRIPTION

  document.title = title

  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', description)
})

export default router
