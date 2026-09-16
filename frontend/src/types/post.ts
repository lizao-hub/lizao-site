export interface Post {
  /** 同时是路由参数，也是 src/content/notes/<slug>.md 的文件名 */
  slug: string
  title: string
  /** ISO 格式，2026-08-14 */
  date: string
  summary: string
  tags: string[]
  /**
   * 封面图。留空就用像素占位块顶上（见 NoteCover.vue），
   * 不用为了凑版面去找一张不相干的图。
   * 填法参考 data/postCovers.ts：把图丢进 src/assets/notes-cover/ 再登记文件名。
   */
  cover?: string
}

/**
 * 列表卡片右下角那三个数字。
 *
 * 目前全是模拟数据，站点还没有后端、没有埋点、没有评论系统。
 * 接 FastAPI 之后把 posts.ts 里的 mockStats 换成接口返回值即可，
 * 组件（NoteEntry.vue）不用改。
 */
export interface PostStats {
  /** 🔥 热度 */
  heat: number
  /** 💬 评论数 */
  comments: number
  /** 👍 点赞数 */
  likes: number
}

export type PostStatKey = keyof PostStats
