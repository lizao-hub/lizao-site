import type { PhotoItem } from '@/types/photo'

/**
 * 加照片只有两步，不用改任何代码：
 *
 *   我的照片   src/assets/photos-life/随便什么名字.jpg
 *   朋友的照片 src/assets/photos-ta-all/<相册文件夹>/photo-01.jpg
 *
 * 两个 glob 会自动收录。想让某张照片带一句说明，
 * 在下面 photoNotes 里加一行，键是「相册名/文件名」。
 * 不加也行，页面不会替你编一句。
 */

const MINE_ALBUM = 'life'
const MINE_NAME = '我的照片'

/** 相册文件夹名 -> 显示名。没登记的相册直接用文件夹名。 */
const albumNames: Record<string, string> = {}

/**
 * 每张照片的可选说明。
 * 例：'life/photo-01.jpg': '那天下午，光很好',
 */
const photoNotes: Record<string, string> = {}

const mineModules = import.meta.glob<string>('../assets/photos-life/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const friendModules = import.meta.glob<string>(
  '../assets/photos-ta-all/*/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
)

function fileNameOf(path: string): string {
  return path.split('/').pop() ?? path
}

function albumOf(path: string): string {
  // '../assets/photos-ta-all/xwx/photo-01.jpg' -> 'xwx'
  const parts = path.split('/')
  return parts[parts.length - 2] ?? 'unsorted'
}

function buildMine(): PhotoItem[] {
  return Object.entries(mineModules)
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    .map(([path, src], i) => {
      const file = fileNameOf(path)
      const id = `${MINE_ALBUM}/${file}`
      return {
        id,
        src,
        group: 'mine' as const,
        album: MINE_ALBUM,
        albumName: MINE_NAME,
        index: i + 1,
        note: photoNotes[id],
      }
    })
}

export interface FriendAlbum {
  album: string
  name: string
  photos: PhotoItem[]
}

function buildFriendAlbums(): FriendAlbum[] {
  const byAlbum = new Map<string, Array<[string, string]>>()

  for (const entry of Object.entries(friendModules)) {
    const album = albumOf(entry[0])
    const list = byAlbum.get(album) ?? []
    list.push(entry)
    byAlbum.set(album, list)
  }

  return [...byAlbum.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([album, entries]) => {
      const photos: PhotoItem[] = entries
        .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
        .map(([path, src], i) => {
          const file = fileNameOf(path)
          const id = `${album}/${file}`
          return {
            id,
            src,
            group: 'friends' as const,
            album,
            albumName: albumNames[album] ?? album,
            index: i + 1,
            note: photoNotes[id],
          }
        })

      return { album, name: albumNames[album] ?? album, photos }
    })
}

export const myPhotos: PhotoItem[] = buildMine()
export const friendAlbums: FriendAlbum[] = buildFriendAlbums()
export const friendPhotos: PhotoItem[] = friendAlbums.flatMap((entry) => entry.photos)

/** 「我的照片」还一张都没有的时候，页面上留一个空的像素相框，而不是假装没人住 */
export const myPhotosIsEmpty = myPhotos.length === 0
