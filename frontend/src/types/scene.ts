/** 场景分层的自身动效。都只做极轻微的形变，不做大幅形变或位移。 */
export type SceneMotion = 'sway' | 'sway-soft' | 'sway-strong' | 'breathe'

/**
 * 一层布景。坐标全部是**相对 2848×1602 参考画布**的百分比，
 * 不是相对视口 —— 舞台自己维持这个比例，层跟着缩放。
 */
export interface SceneLayer {
  id: string
  /** 相对 src/assets/backgrounds/ 的路径，由 scenes 目录的 glob 解析成 URL */
  src: string
  left: number
  top: number
  width: number
  motion?: SceneMotion
}

/**
 * 可点区域。坐标是相对**所属热点自身边框**的百分比，
 * 由 zones2.py 按 alpha 轮廓算出来，互相不重叠。
 */
export interface SceneZone {
  left: number
  top: number
  right: number
  bottom: number
}

export interface SceneHotspot extends SceneLayer {
  /**
   * 可访问名字。**不再显示成悬停标签**——悬停标签已整个拿掉。
   * 给读屏用；也方便以后想恢复时现成有一句话。
   */
  label: string
  /** 目标路由 */
  to: string
  /**
   * 曾经还有一个 `group?: string`（同组热点一起响应悬停 / 聚焦）——
   * 三叠书不再是同一个组件之后就没数据用它，SceneStage 里那套 is-group-active
   * 也早拆了，于是这个字段成了「写着但没有任何代码读」的死字段，已删。
   * 将来真出现「一组东西共用一个去向」时再加回来，那时它才会有实现跟上。
   */
  alt?: string
  zones?: SceneZone[]
}

export interface Scene {
  id: string
  /** 绘制与命中顺序：数组前面的在远处，后面的在近处 */
  layers: SceneLayer[]
  hotspots: SceneHotspot[]
}
