/**
 * 留言。**这是全站唯一从接口来的数据** ——
 * 项目正文在 `data/projects.ts`，是排版不是记录，不进数据库。
 *
 * 它进库是因为它**会增长**：留言是别人写的、我这一侧不掌握的内容。
 * **留言不挂在项目上**（曾经按 slug 分），所以这里没有 slug ——
 * 一条「网站做得不错」并不属于某个项目（见 backend/guestbook.py 顶部）。
 *
 * 点赞曾经也在这个文件里（`likes` / `liked`），2026-09-23 整块下线。
 */

/** 一条留言 */
export interface Comment {
  id: number
  /** 昵称。不是账号 —— 留言区不要求登录 */
  name: string
  body: string
  /** ISO 8601，UTC。前端自己转成当地日期显示 */
  createdAt: string
}
