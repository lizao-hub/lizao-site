import type { PostStats } from '@/types/post'

/**
 * 笔记卡片上的热度 / 评论 / 点赞。
 *
 * ⚠️ 全部是模拟数据。站点现在没有后端、没有埋点、没有评论系统。
 * 这里单独放一个文件，是为了以后接 FastAPI 时只改这一处：
 * 把 mockStats 换成接口请求，组件层（NoteEntry.vue）一个字都不用动。
 *
 * 键是 slug，和 content/notes/<slug>.md 对齐。
 */
export const mockStats: Record<string, PostStats> = {
  'python-to-vue-first-week': { heat: 1284, comments: 36, likes: 92 },
  'why-i-still-write-scripts': { heat: 863, comments: 21, likes: 64 },
  'reading-source-code-as-a-beginner': { heat: 1547, comments: 48, likes: 131 },
  'css-layout-notes': { heat: 692, comments: 15, likes: 47 },
}

/** 没登记的文章给一份兜底，卡片不会出现空槽 */
export const emptyStats: PostStats = { heat: 0, comments: 0, likes: 0 }

export function statsOf(slug: string): PostStats {
  return mockStats[slug] ?? emptyStats
}
