import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import NotesView from '@/views/NotesView.vue'
import GalleryView from '@/views/GalleryView.vue'
import { profile } from '@/data/resume'

const SITE_NAME = profile.name

const DEFAULT_DESCRIPTION =
  '李泽敖的个人网站：写的东西、拍的照片，还有一些顺手记下来的结论。'

/**
 * 站点结构（见 ADR-0009）：
 *
 *   /      湖边。整站的门，没有正文也没有导航。
 *   /room  屋里。整站的目录，点桌上的东西去各个页面。「关于我」就是这一页。
 *   其余都是可以从屋里走到的内容页，各自带导航。
 *
 * /about 已经删掉：屋里那一页承担了它的位置，计算机热点改指向
 * /projects（做过的东西）。详见 ADR-0009。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: SITE_NAME, description: DEFAULT_DESCRIPTION, scene: true },
  },
  {
    path: '/room',
    name: 'room',
    component: () => import('@/views/RoomView.vue'),
    meta: {
      title: `屋里 | ${SITE_NAME}`,
      description: '我的房间和桌上的东西：读的书、写过的代码、拍下的照片。',
      scene: true,
    },
  },
  {
    // 电脑热点通向这里。ADR-0001 曾把它折进 /about，现在独立回来，见 ADR-0009。
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
    meta: {
      title: `做过的东西 | ${SITE_NAME}`,
      description: '做过的项目，以及学历、论文、比赛和助教经历。',
    },
  },
  {
    // 单项详情保留，连带留住可分享的深链接。
    path: '/projects/:slug',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
    meta: { title: `项目 | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION },
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
