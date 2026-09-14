export interface PhotoItem {
  /** 相册名加文件名，用作 key 和灯箱顺序 */
  id: string
  src: string
  /** mine = 我的照片，friends = 朋友的照片。影像页分成两个分区 */
  group: 'mine' | 'friends'
  /** 相册文件夹名，我的照片固定是 life */
  album: string
  /** 相册的显示名，用于灯箱说明 */
  albumName: string
  /** 在该相册里的序号，从 1 开始 */
  index: number
  /** 可选的一句说明。没有就不显示，页面不会自己编。 */
  note?: string
}
