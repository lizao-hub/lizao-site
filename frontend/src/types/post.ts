export interface Post {
  /** 同时是路由参数，也是 src/content/notes/<slug>.md 的文件名 */
  slug: string
  title: string
  /** ISO 格式，2026-08-14 */
  date: string
  summary: string
  tags: string[]
}
