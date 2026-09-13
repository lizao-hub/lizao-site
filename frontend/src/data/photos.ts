import type { FriendPhoto } from '@/types/photo'

// 新增照片只需两步：
//   1. 把图放进 src/assets/photos-ta-all/<相册文件夹名>/
//   2. 在下面数组里加一行（src 用 new URL 相对当前文件解析，Vite 会自动处理打包）
// 照片命名建议 photo-01.jpg、photo-02.jpg……（见 backend/scripts/optimize_photos.py）
const xwx = import.meta.glob<string>('../assets/photos-ta-all/xwx/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function byFileName(modules: Record<string, string>): string[] {
  return Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    .map(([, url]) => url)
}

export const friendPhotos: FriendPhoto[] = [
  {
    album: 'xwx',
    name: { zh: '是你吗？xxx', en: 'XWX' },
    // 一条数据对应一张照片，按文件名自动排序
    images: byFileName(xwx),
  },
]

// 拍平成一个列表，供画廊直接遍历
export const allFriendPhotos: FriendPhoto['images'] = friendPhotos.flatMap((album) => album.images)
