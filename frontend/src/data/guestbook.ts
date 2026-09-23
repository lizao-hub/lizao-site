/**
 * 留言的接口客户端。
 *
 * **这是全站唯一会发请求的地方**（另一处是影像页直接 fetch 照片清单）。
 * 项目正文在 `data/projects.ts` 里，页面不依赖这个模块也能读。
 *
 * 曾经这里还管点赞，还有一套「我点过没有」的 localStorage 兜底 ——
 * 点赞 2026-09-23 下线，那套东西（含 `lizao:liked:<slug>` 这个键）一并删了。
 */
import type { Comment } from '@/types/guestbook'

/**
 * 接口前缀。默认同源 `/api`：
 * - 开发时由 `vite.config.ts` 的 proxy 转到 `http://localhost:8000`；
 * - 上线时由反向代理把 `/api` 指到后端。
 */
const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.detail ?? `接口返回 ${res.status}`)
  }
  return (await res.json()) as T
}

/**
 * 取全部留言，**从旧到新**（读的顺序就是对话的顺序）。
 *
 * **取不到返回 null**（不是抛错）—— 让调用方自己决定怎么交代。
 * 留言页的做法是照实说「读不到」而不是整块不渲染：那一页的全部内容
 * 就是这一次请求，空着等于一张白纸（见 GuestbookView.vue）。
 */
export async function fetchComments(): Promise<Comment[] | null> {
  try {
    const data = await request<{ items: Comment[] }>(`${API_BASE}/comments`)
    return data.items ?? []
  } catch {
    return null
  }
}

/** 写一条留言。失败会抛 —— 这一次是用户主动提交的，得让他看见为什么没成。 */
export async function postComment(name: string, body: string): Promise<Comment> {
  return await request<Comment>(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, body }),
  })
}
