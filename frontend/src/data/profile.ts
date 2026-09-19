/**
 * 身份信息。**站上只有这一份，改名字 / 邮箱 / GitHub 只改这里。**
 *
 * 用到它的地方一共四处：
 *   router/index.ts  站点名（SITE_NAME，拼每页 title）
 *   HomeView.vue     藏在景下面的 <h1>
 *   RoomView.vue     墙上那行联系方式（邮箱 + GitHub）
 *   SiteFooter.vue   页脚署名（该组件当前未挂载）
 */

/**
 * 公开的身份信息。**只放真的会被渲染出来的字段。**
 */
export const profile = {
  name: 'LIzao 的自留地',
  /** 一句话定位。首页那块字下面的 <h1> 用它 */
  role: '数学硕士研究生 · 工业时序大模型 / AI Agent',
  github: 'https://github.com/lizao-hub',
  githubLabel: '@lizao-hub',
  /** 邮箱。屋里页露出，是站上唯一的联系方式（电话不展示） */
  email: '2443642197@qq.com',
} as const
