/**
 * 点赞与留言的接口客户端。
 *
 * **这是全站唯一会发请求的地方。** 项目正文在 `data/projects.ts` 里，
 * 页面不依赖这个模块也能读。所以这里取不到东西时的处理是**整块不渲染**
 * （见 `ProjectGuestbook.vue`），而不是在页面上留一块「加载失败」——
 * 后端没起只是没有留言，正文照样完整，不值得为它扣分。
 *
 * 「点过赞了」这件事，**主判据在服务端**：后端给这个浏览器发一个随机 id
 * （cookie `lizao_liker`，httponly，一年），点赞时记进 `project_liker`，
 * 于是清缓存、换标签页回来也认得出，`GET /reactions` 直接回一个 `liked`。
 *
 * 下面这两个 localStorage 的读写只是**本地兜底**：cookie 被禁掉时（无痕、
 * 第三方 cookie 全关）后端每次都认不出人，按钮就会每次都能再点一次 ——
 * 有它至少同一台机器的同一个浏览器还记着。别把它当防重复用，
 * 真正的取舍写在 `backend/reactions.py` 顶部。
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

/**
 * 点赞。后端**同一个人只算一次**（重复提交不加分），但一律回 `liked: true` ——
 * 就算这一下没加上分，心也该是红的。失败返回 null，调用方把数字退回去。
 */
export async function postLike(slug: string): Promise<{ likes: number; liked: boolean } | null> {
  try {
    const res = await request<{ likes: number; liked: boolean }>(
      `${API_BASE}/projects/${slug}/likes`,
      { method: 'POST' },
    )
    return { likes: res.likes, liked: res.liked }
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
