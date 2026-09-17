/** 场景分层的自身动效。都只做极轻微的形变，见 ADR-0005 的动效包线。 */
export type SceneMotion = 'sway' | 'sway-soft' | 'sway-strong' | 'breathe'

/**
 * 一层布景。坐标全部是**相对 2848×1602 参考画布**的百分比，
 * 不是相对视口 —— 舞台自己维持这个比例，层跟着缩放。
 */
export interface SceneLayer {
  id: string
  /** 相对 src/assets/scenes/ 的路径，由 scenes 目录的 glob 解析成 URL */
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
  /** 悬停标签的文案。写真实去向，不写物件名 */
  label: string
  /** 目标路由 */
  to: string
  /**
   * 同组的热点一起响应悬停 / 聚焦。
   * 目前没有场景用到（三叠书不再是同一个组件），保留字段是为了以后
   * 真出现「一组东西共用一个去向」时不用改组件。
   */
  group?: string
  alt?: string
  zones?: SceneZone[]
}

export interface Scene {
  id: string
  /** 绘制与命中顺序：数组前面的在远处，后面的在近处 */
  layers: SceneLayer[]
  hotspots: SceneHotspot[]
}
