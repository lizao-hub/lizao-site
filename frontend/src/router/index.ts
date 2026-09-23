import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { profile } from '@/data/profile'
import { findProject } from '@/data/projects'

/**
 * 站点名。**每一页的 title 都用它，不做「页名 | 站名」的拼接** ——
 * 标签页上只留一个名字，页面是什么看内容就知道，不必再挤进标题栏。
 * 事实来源是 data/profile.ts 的 profile.name（首页那颗给搜索引擎的 h1 也用它）。
 */
const SITE_NAME = profile.name

const DEFAULT_DESCRIPTION =
  '李泽敖的个人网站：写的东西、拍的照片，还有一些顺手记下来的结论。'

/**
 * 站点结构：
 *
 *   /                    湖边。整站的门，没有正文也没有导航。
 *   /room                屋里。整站的目录，点桌上的东西去各个页面。「关于我」就是这一页。
 *   /projects            做过的东西。屋里那台电脑的去向。项目清单。
 *   /projects/:slug      一个项目的详情。极简单栏，见 views/ProjectView.vue。
 *   /gallery             影像。屋里那台相机的去向。照片墙。
 *   /guestbook           留言。屋里那叠横放的书的去向。站点级的一池。
 *
 * 六个地址**每一页都有内容** —— 「只有两个场景页有内容」是 2026-09 清空期的
 * 旧状态。项目页与影像页还挂着「这一页还在造」那句按语（有意留的未完工记号），
 * 但别再把任何一页叫「空页 / 空壳」。
 *
 * /notes 连地址一起废除了（内容清空过、后来干脆删掉）：屋里那叠竖排书
 * 现在是纯装饰。正文渲染器 utils/markdown.ts 与 markdown-it 依赖同时删掉，
 * 项目正文因此一直是结构化数据，就写在 `data/projects.ts` 里 ——
 * **它不进数据库**（排版不是记录）。进库的是留言，它**不挂在项目上**
 * （以前按 slug 分，见 backend/guestbook.py 顶部），由 views/GuestbookView.vue 读。
 *
 * /about 也删掉了：屋里那一页承担了它的位置，计算机热点改指向
 * /projects（做过的东西）。
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
      title: SITE_NAME,
      description: '我的房间和桌上的东西：写过的代码、拍下的照片。',
      // 注意：屋里**不是** scene。它有导航（独立占上面一条，景在它下面），
      // 因为它同时是「关于我」，需要正常的路由入口。
    },
  },
  {
    // 电脑热点通向这里。
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: {
      title: SITE_NAME,
      description: '做过的项目：每个项目在做什么、怎么做的。',
    },
  },
  {
    /**
     * 一个项目的详情。摘要得先知道是哪个项目，所以这条 meta 写成**函数**
     * （见下面 afterEach 的说明）。title 一律是站名，全站统一。
     */
    path: '/projects/:slug',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
    /**
     * 地址栏手改、或从前留下的旧 slug：退回清单页，
     * 不给人留一张什么都没写的白纸。
     */
    beforeEnter: (to) => (findProject(String(to.params.slug)) ? true : { name: 'projects' }),
    meta: {
      title: SITE_NAME,
      description: (to: RouteLocationNormalized) =>
        findProject(String(to.params.slug))?.summary ?? DEFAULT_DESCRIPTION,
    },
  },
  {
    // 相机热点通向这里。
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/views/GalleryView.vue'),
    meta: { title: SITE_NAME, description: '我的照片与朋友的照片。' },
  },
  {
    // 屋里那叠横放的书的去向。
    path: '/guestbook',
    name: 'guestbook',
    component: () => import('@/views/GuestbookView.vue'),
    meta: {
      title: SITE_NAME,
      description: '留言：路过的人写下的几句话。',
    },
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

/**
 * 每一页的 description 可以是**字符串**，也可以是**拿到路由的函数**。
 *
 * 详情页的摘要就是那个项目的摘要，而项目名要等 slug 到了才知道 ——
 * 写死的模板拼不出来，所以 meta 允许放函数。**现在只有 /projects/:slug 用函数。**
 *
 * title 曾经也走这一套（拼「页名 | 站名」），2026-09-18 起全站统一成站名，
 * 于是它只剩字符串一种写法。下面的取值函数仍按「两种都吃得下」写 ——
 * 将来哪一页想再单独起标题，不用回来改它。
 */
type MetaText = string | ((to: RouteLocationNormalized) => string)

function metaText(value: unknown, to: RouteLocationNormalized, fallback: string): string {
  if (typeof value === 'function') return (value as (to: RouteLocationNormalized) => string)(to)
  return typeof value === 'string' && value ? value : fallback
}

// SEO：每一页都有自己的 description；title 全站统一（见上面的 SITE_NAME）。
router.afterEach((to) => {
  document.title = metaText(to.meta.title, to, SITE_NAME)

  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', metaText(to.meta.description, to, DEFAULT_DESCRIPTION))
})

export default router
