/**
 * 项目的点赞与留言。**这是全站唯一从接口来的数据** ——
 * 项目正文在 `data/projects.ts`，是排版不是记录，不进数据库。
 *
 * 这两样东西进库是因为它们**会增长**：赞会一直往上加，
 * 留言是别人写的、我这一侧不掌握的内容。它们按 slug 挂在项目上，
 * 所以 slug 是它们和那份静态内容之间唯一的接缝。
 */

/** 一条留言 */
export interface Comment {
  id: number
  slug: string
  /** 昵称。不是账号 —— 留言区不要求登录 */
  name: string
  body: string
  /** ISO 8601，UTC。前端自己转成当地日期显示 */
  createdAt: string
}

/** 一个项目的点赞数与留言。详情页一次请求拿这两样。 */
export interface Reactions {
  slug: string
  likes: number
  /**
   * **我**（这个浏览器）点过没有。后端按 cookie 里那个 id 认人，
   * 认不出（比如 cookie 被禁）就是 false —— 宁可让你再点一次，也不猜。
   * 前端拿它决定那颗心画不画成红的。
   */
  liked: boolean
  comments: Comment[]
}
