export interface FriendAlbum {
  /** 相册标识，和 assets/photos-ta-all/ 下的文件夹名保持一致 */
  album: string
  /** 相册标题，按语言区分 */
  name: Record<'zh' | 'en', string>
  /** 图片的最终 URL，由 import.meta.glob 生成 */
  images: string[]
}

/** 画廊统一用的照片条目 */
export interface FriendPhoto {
  album: string
  name: Record<'zh' | 'en', string>
  images: string[]
}
