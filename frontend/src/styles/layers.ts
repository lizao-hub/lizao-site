/**
 * z-index 只允许用这里的数值，不要在组件里随手写 z-50。
 * 同一个数值同时定义在 main.css 的 --z-* 变量里，改的时候两边一起改。
 */
export const Z = {
  /** 固定导航条 */
  nav: 40,
  /** 照片灯箱 */
  lightbox: 50,
} as const
