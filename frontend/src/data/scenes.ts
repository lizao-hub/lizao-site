import type { Scene, SceneHotspot, SceneLayer } from '@/types/scene'

/**
 * 素材自动收录。加一层图只要丢进 src/assets/scenes/<场景>/ 再在上面写一条，
 * 不用改 import。和 photos.ts 用的是同一套约定。
 */
const sceneAssets = import.meta.glob<string>('../assets/scenes/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** 'lake/background.webp' -> 构建后的 URL */
function asset(path: string): string {
  const key = `../assets/scenes/${path}`
  const url = sceneAssets[key]
  if (!url) throw new Error(`场景素材不存在：${path}（先跑 npm run build-scenes）`)
  return url
}

/**
 * 两个场景的分层与热点。
 *
 * 所有百分比都是**相对 2848×1602 参考画布**的，和原稿一致。
 * 这些数字不是估的：它们是用带 alpha 掩膜的 SSD 模板匹配
 * （`.workbuddy/tmp/locate_layers.py`，现在收在 scripts/ 下）
 * 从各自的 composite.png 里逐像素算出来的，整体平均像素差 0.13/255。
 *
 * 热点上的 zone（可点区域）同样是算出来的：把物件的 alpha 掩膜膨胀 14px，
 * 按 z 序从上往下取「未被占用区域内的最大全 1 矩形」，所以电脑不会抢走
 * 压在它下面的书本的点击。覆盖率 75%~90%。
 *
 * 改素材之后必须重新跑脚本，不要手调百分比。见 ADR-0008。
 */

/** 湖景：index.html。远 → 近的叠放顺序。 */
const lakeLayers: SceneLayer[] = [
  { id: 'background', src: 'lake/background.webp', left: 0, top: 0, width: 100 },
  { id: 'shrub', src: 'lake/shrub.webp', left: 73.88, top: 71.79, width: 26.05, motion: 'sway-soft' },
  { id: 'willow', src: 'lake/willow.webp', left: 0, top: 0, width: 47.51, motion: 'sway' },
  { id: 'fence', src: 'lake/fence.webp', left: 76.26, top: 78.71, width: 23.67 },
  { id: 'boy', src: 'lake/boy.webp', left: 20.65, top: 52.31, width: 18.05, motion: 'breathe' },
  { id: 'daisy', src: 'lake/daisy.webp', left: 0, top: 73.16, width: 41.08, motion: 'sway-strong' },
]

/**
 * 小屋是唯一的热点。它的图单独放在 layers 里会挡住自己，
 * 所以由 hotspot 渲染，位置在这里写一次。
 */
export const lakeHotspot: SceneHotspot = {
  id: 'cabin',
  label: '点击小木屋，进屋坐坐',
  to: '/room',
  src: 'lake/cabin.webp',
  left: 80.79,
  top: 70.6,
  width: 8.25,
  alt: '红顶小木屋',
}

/** 屋内：room.html。只有竖排那叠书可点，杯子只是装饰。 */
const roomLayers: SceneLayer[] = [
  { id: 'background', src: 'room/background.webp', left: 0, top: 0, width: 100 },
  { id: 'desk', src: 'room/desk.webp', left: 23.7, top: 79.84, width: 69.45 },
]

/**
 * 马克杯。只有装饰，不接鼠标。
 *
 * 它在 layers 里的位置决定绘制顺序：现在的顺序让它压在竖排书籍之上
 * （两图在 y 78%~84% 那段确实重叠，所以这个顺序是有意义的）。
 * 不要再把它往前排。
 */
const mugLayer: SceneLayer = {
  id: 'mug',
  src: 'room/mug.webp',
  left: 71.56,
  top: 78.15,
  width: 4.71,
}

/**
 * 只有竖排那叠书是热点，去 /notes。
 *
 * 左侧横叠、右侧横叠两叠是**纯装饰**：不成组、不接鼠标、没有任何动画。
 * 三叠书曾经当一个组件（碰哪一叠都一起缩放），那个行为已按要求拿掉。
 */
const bookHotspots: SceneHotspot[] = [
  {
    id: 'books-tall',
    label: '书',
    to: '/notes',
    src: 'room/booksTall.webp',
    left: 66.71,
    top: 60.24,
    width: 18.29,
    zones: [
      { left: 9.0, top: 22.1, right: 22.6, bottom: 0.3 },
      { left: 45.9, top: 0.5, right: 2.9, bottom: 77.9 },
      { left: 77.4, top: 22.1, right: 0.0, bottom: 62.5 },
    ],
  },
]

/** 另外两叠书：只是画，不是门。 */
const bookDecor: SceneLayer[] = [
  { id: 'books-left', src: 'room/booksLeft.webp', left: 37.04, top: 71.41, width: 12.5 },
  { id: 'books-right', src: 'room/booksRight.webp', left: 80.02, top: 69.35, width: 11.52 },
]

/**
 * 三扇门。标签写的是**真实去向**，不是物件本身的名字：
 * 电脑上写「关于我」但跳去做过的项目，就是在骗人。
 */
const roomDoors: SceneHotspot[] = [
  {
    id: 'laptop',
    label: '电脑 · 做过的东西',
    to: '/projects',
    src: 'room/laptop.webp',
    left: 43.08,
    top: 64.67,
    width: 22.68,
    alt: '笔记本电脑',
    zones: [
      { left: 38.2, top: 0.0, right: 8.0, bottom: 7.3 },
      { left: 4.5, top: 81.7, right: 61.8, bottom: 2.3 },
      { left: 92.0, top: 0.0, right: 2.6, bottom: 46.2 },
    ],
  },
  {
    id: 'camera',
    label: '相机 · 拍下的',
    to: '/gallery',
    src: 'room/camera.webp',
    left: 29.21,
    top: 75.47,
    width: 9.55,
    alt: '复古旁轴相机',
    zones: [{ left: 20.6, top: 2.9, right: 0.0, bottom: 0.0 }],
  },
]

/**
 * 叠放顺序（远 → 近）：背景 → 书桌 → 书 → 电脑 → 相机 → 杯子 → 便签。
 *
 * 书要排在电脑之前：三叠书里有两叠在视觉上压在电脑下面，
 * 但它们的 zone 已经算过不重叠，所以顺序只影响观感，不影响点击。
 */
export const roomScene: Scene = {
  id: 'room',
  /** 这个数组的顺序**就是绘制顺序**（远 → 近），见 SceneStage.vue 的注释。 */
  layers: [...roomLayers, ...bookDecor, ...bookHotspots, ...roomDoors, mugLayer],
  hotspots: [...bookHotspots, ...roomDoors],
}

export const lakeScene: Scene = {
  id: 'lake',
  layers: lakeLayers,
  hotspots: [lakeHotspot],
}

/** 把一份场景里的所有 src 换成构建后的 URL。组件只认 URL，不认路径。 */
export function resolveScene(scene: Scene): Scene {
  return {
    ...scene,
    layers: scene.layers.map((layer) => ({ ...layer, src: asset(layer.src) })),
    hotspots: scene.hotspots.map((spot) => ({ ...spot, src: asset(spot.src) })),
  }
}

/**
 * 屋内那张简历摘要纸片的位置（相对舞台的百分比）。
 *
 * 放在**笔记本上方**（用户指定）。笔记本的包围盒是
 * left 43.08 / top 64.67 / width 22.68 / 高约 21.5%，
 * 即 x 43~66%、y 65~86%。
 *
 * 所以「笔记本上方」= 纸片底边不能超过 y 64%，水平大致与笔记本对齐。
 * 上面的空间只有 y 0~64%，而纸片本身高约 35%（三类内容），
 * 所以 top 只能取到 18% 左右，再往下就会压到笔记本上、挡住它的点击区。
 *
 * 现在的值：x 30~72%、y 18~约 53%，底边离笔记本还有约 12%。
 * 你说了这只是临时位置，后续还要调 —— 改的时候注意上面这条约束。
 */
export const roomSheet = {
  left: 30,
  top: 18,
  width: 42,
}

/** 屋内不再有顶部提示，改成笔记本上方的简历摘要纸片。 */

/** 湖景小屋上方的常驻引导语。 */
export const lakeHint = '点一下小木屋，进屋坐坐'
