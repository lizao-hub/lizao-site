/**
 * 点赞与留言的接口客户端。
 *
 * **这是全站唯一会发请求的地方。** 项目正文在 `data/projects.ts` 里，
 * 页面不依赖这个模块也能读。所以这里取不到东西时的处理是**整块不渲染**
 * （见 `ProjectGuestbook.vue`），而不是在页面上留一块「加载失败」——
 * 后端没起只是没有留言，正文照样完整，不值得为它扣分。
 *
 * 「我点过赞了」记在浏览器的 localStorage 里，服务端只管累加。
 * 为什么这么选（以及它的代价：清缓存能再点一次）写在
 * `backend/reactions.py` 顶部。
 */
import type { Comment, Reactions } from '@/types/reaction'

/**
 * 接口前缀。默认同源 `/api`：
 * - 开发时由 `vite.config.ts` 的 proxy 转到 `http://localhost:8000`；
 * - 上线时由反向代理把 `/api` 指到后端。
 */
const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api'

const likedKey = (slug: string) => `lizao:liked:${slug}`

/**
 * localStorage 在隐私模式 / 禁用 Cookie 时**会直接抛**，
 * 所以读写都兜住：记不住只是「能再点一次」，不值得让页面挂掉。
 */
export function hasLiked(slug: string): boolean {
  try {
    return localStorage.getItem(likedKey(slug)) === '1'
  } catch {
    return false
  }
}

export function rememberLike(slug: string): void {
  try {
    localStorage.setItem(likedKey(slug), '1')
  } catch {
    // 记不住就算了，见上面
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.detail ?? `接口返回 ${res.status}`)
  }
  return (await res.json()) as T
}

/** 取一个项目的赞数与留言。**取不到返回 null**（不是抛错）—— 让调用方自己决定要不要显示。 */
export async function fetchReactions(slug: string): Promise<Reactions | null> {
  try {
    return await request<Reactions>(`${API_BASE}/projects/${slug}/reactions`)
  } catch {
    return null
  }
}

/** 点赞 +1。返回新的累计数；失败返回 null，调用方把数字退回去。 */
export async function postLike(slug: string): Promise<number | null> {
  try {
    const res = await request<{ likes: number }>(`${API_BASE}/projects/${slug}/likes`, {
      method: 'POST',
    })
    return res.likes
  } catch {
    return null
  }
}

/** 写一条留言。失败会抛 —— 这一次是用户主动提交的，得让他看见为什么没成。 */
export async function postComment(slug: string, name: string, body: string): Promise<Comment> {
  return await request<Comment>(`${API_BASE}/projects/${slug}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, body }),
  })
}
