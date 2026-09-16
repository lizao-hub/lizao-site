import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import NotesView from '@/views/NotesView.vue'
import GalleryView from '@/views/GalleryView.vue'
import { profile } from '@/data/resume'

const SITE_NAME = profile.name

const DEFAULT_DESCRIPTION =
  '李泽敖的个人网站：写的东西、拍的照片，还有一些顺手记下来的结论。'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: SITE_NAME, description: DEFAULT_DESCRIPTION },
  },
  {
    // 项目列表页已并入「关于」（见 ADR-0001）。
    // 旧地址仍可能被外部引用，重定向而不是掉进 404 兜底。
    path: '/projects',
    redirect: '/about',
  },
  {
    // 只保留单项详情，连带留住可分享的深链接。
    path: '/projects/:slug',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
    meta: { title: `项目 | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION },
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: {
      title: `关于 | ${SITE_NAME}`,
      description: '我是谁、做过什么、写过什么，以及一些不在别处的东西。',
    },
  },
  {
    path: '/notes',
    name: 'notes',
    component: NotesView,
    meta: {
      title: `笔记 | ${SITE_NAME}`,
      description: '写代码时踩过的坑、读源码的方法，以及一些顺手记下来的结论。',
    },
  },
  {
    path: '/notes/:slug',
    name: 'post',
    // Markdown 渲染器只在这一页用得上，单独切一个 chunk，别拖慢首屏
    component: () => import('@/views/PostView.vue'),
    meta: { title: `笔记 | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: GalleryView,
    meta: { title: `影像 | ${SITE_NAME}`, description: '我的照片与朋友的照片。' },
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
  const title = typeof to.meta.title === 'string' ? to.meta.title : SITE_NAME
  const description = typeof to.meta.description === 'string' ? to.meta.description : DEFAULT_DESCRIPTION

  document.title = title

  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', description)
})

export default router
