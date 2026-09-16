/**
 * 笔记封面图自动收录。
 *
 * 加封面只有一步：把图丢进 src/assets/notes-cover/ 这个文件夹，
 * 文件名就是 slug，例如 python-to-vue-first-week.jpg。
 * 不用改任何代码，import.meta.glob 会自动收录（和 photos.ts 一个套路）。
 *
 * 没有封面的笔记不会报错，卡片会用像素占位块顶上。
 */
const modules = import.meta.glob<string>('../assets/notes-cover/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** 文件名（去掉扩展名）就是 slug */
const covers: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const file = path.split('/').pop() ?? ''
  const slug = file.replace(/\.[^.]+$/, '')
  if (slug) covers[slug] = url
}

/** 有封面就返回地址，没有就返回 undefined，交给占位块处理 */
export function coverOf(slug: string): string | undefined {
  return covers[slug]
}
