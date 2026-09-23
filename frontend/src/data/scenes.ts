import type { Scene, SceneHotspot, SceneLayer } from '@/types/scene'

/**
 * 素材自动收录。加一层图只要丢进 src/assets/backgrounds/<场景>/ 再在上面写一条，
 */
const sceneAssets = import.meta.glob<string>('../assets/backgrounds/*/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** 'home/background.webp' -> 构建后的 URL */
function asset(path: string): string {
  const key = `../assets/backgrounds/${path}`
  const url = sceneAssets[key]
  if (!url) throw new Error(`场景素材不存在：${path}（先跑 npm run build-scenes）`)
  return url
}

/**
 * 两个场景的分层与热点。
 *
 * 所有百分比都是**相对 2848×1602 参考画布**的，和原稿一致。
 * 这些数字不是估的：它们是用带 alpha 掩膜的 SSD 模板匹配
 * （`frontend/scripts/scene-locate-layers.py`）
 * 从各自的 composite.png 里逐像素算出来的，整体平均像素差 0.13/255。
 *
 * 热点上的 zone（可点区域）同样是算出来的：把物件的 alpha 掩膜膨胀 14px，
 * 按 z 序从上往下取「未被占用区域内的最大全 1 矩形」，所以电脑不会抢走
 * 压在它下面的书本的点击。覆盖率 75%~90%。
 *
 * 改素材之后必须重新跑脚本，不要手调百分比。
 */

/** 湖景：index.html。远 → 近的叠放顺序。 */
const lakeLayers: SceneLayer[] = [
  { id: 'background', src: 'home/background.webp', left: 0, top: 0, width: 100 },
  { id: 'shrub', src: 'home/shrub.webp', left: 73.88, top: 71.79, width: 26.05, motion: 'sway-soft' },
  { id: 'willow', src: 'home/willow.webp', left: 0, top: 0, width: 47.51, motion: 'sway' },
  { id: 'fence', src: 'home/fence.webp', left: 76.26, top: 78.71, width: 23.67 },
  { id: 'boy', src: 'home/boy.webp', left: 20.65, top: 52.31, width: 18.05, motion: 'breathe' },
  { id: 'daisy', src: 'home/daisy.webp', left: 0, top: 73.16, width: 41.08, motion: 'sway-strong' },
]

/**
 * 小屋是唯一的热点。它的图单独放在 layers 里会挡住自己，
 * 所以由 hotspot 渲染，位置在这里写一次。
 */
export const lakeHotspot: SceneHotspot = {
  id: 'cabin',
  label: '点击小木屋，进屋坐坐',
  to: '/room',
  src: 'home/cabin.webp',
  left: 80.79,
  top: 70.6,
  width: 8.25,
  alt: '红顶小木屋',
}

/** 屋内：room.html。远 → 近的叠放顺序。 */
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
  left: 76.56,
  top: 78.15,
  width: 4.71,
}

/**
 * 三叠书：只是画，不是门。
 *
 * 竖排那叠（books-tall）曾经是通向 /notes 的热点。那个地址随笔记页一起
 * 废除之后，它降级成纯装饰 —— 位置、尺寸、叠放次序都不动，只是不再接
 * 鼠标（它的 zones 一并删掉：可点区域没有热点就没有主人）。
 *
 * 左侧横叠、右侧横叠这两叠从来就只是装饰：不成组、不接鼠标、没有动画。
 * 三叠书曾经当一个组件（碰哪一叠都一起缩放），那个行为已按要求拿掉。
 */
const bookDecor: SceneLayer[] = [
  { id: 'books-left', src: 'room/booksLeft.webp', left: 37.04, top: 71.41, width: 12.5 },
  { id: 'books-right', src: 'room/booksRight.webp', left: 78.02, top: 69.35, width: 11.52 },
  // { id: 'books-tall', src: 'room/booksTall.webp', left: 66.71, top: 60.24, width: 18.29 },
]

/**
 * 两扇门。标签写的是**真实去向**，不是物件本身的名字：
 * 电脑上写「关于我」但跳去做过的项目，就是在骗人。
 */
const roomDoors: SceneHotspot[] = [
  {
    id: 'laptop',
    label: '点击电脑',
    to: '/projects',
    src: 'room/laptop.webp',
    left: 48.08,
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
    label: '点击相机',
    to: '/gallery',
    src: 'room/camera.webp',
    left: 35.21,
    top: 76.47,
    width: 9.55,
    alt: '复古旁轴相机',
    zones: [{ left: 20.6, top: 2.9, right: 0.0, bottom: 0.0 }],
  },
]

/**
 * 叠放顺序（远 → 近）：背景 → 书桌 → 三叠书 → 电脑 → 相机 → 杯子。
 *
 * 书要排在电脑之前：三叠书里两叠在视觉上压在电脑下面，
 * 但它们的 zone 已经算过不重叠，所以顺序只影响观感，不影响点击。
 * 书不再是门之后，这一条就纯粹是观感问题了。
 *
 * **两张景都完整展示，上下不裁**（曾经给屋里加过上 4% / 下 9% 的裁切，
 * 把景压成一条更矮的横幅；后来要求与湖边一致，就撤了 —— 机制连数据一起删，
 * 想看那一版去 `git log -S crop`）。
 */
export const roomScene: Scene = {
  id: 'room',
  /** 这个数组的顺序**就是绘制顺序**（远 → 近），见 SceneStage.vue 的注释。 */
  layers: [...roomLayers, ...bookDecor, ...roomDoors, mugLayer],
  /** 屋里只剩两扇门：电脑（做过的）与相机（拍下的）。 */
  hotspots: [...roomDoors],
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
 * 墙上那块字的位置（相对舞台的百分比）。
 *
 * **整块落在墙面干净的那一档里**（用户指定：在笔记本上方）。
 * 上下都是硬的边界：
 *   - 上：景顶那道横梁到 y ≈ 3%，再往上就压到梁上了；
 *   - 下：最靠上的一件家具是右侧那叠竖书（books-tall，top 60.24%，
 *     它的左上角就在文字块的右半边），再往下是笔记本（top 64.67%）。
 * 所以文字块底边不能超过 y 60%。
 *
 * top 取 8%：整块高约 48%（344px / 舞台 712px，1280×900 实测），
 * 落在 8%~56.3% —— 上下各留 3~4%，正好是那一段的中线。
 * **文案加行要回头改这个数**：块高变了，光调 top 会把它压到书或木梁上。
 *
 * x 取 65%（你手调的值），由 CSS 的 translateX(-50%) 对中 ——
 * 那是墙面的中轴（窗子在左 40%，右侧那道梁在 89%）。
 * 和湖边那块字同样的摆法，只是湖边贴着天空、这里落在墙上。
 *
 * 这块里包含名字、联系方式、三段简历与收尾提示。联系方式在它**内部**
 * 正常流里，不单独给坐标 —— 否则文案高度一变就会和名字重叠。
 */
export const roomIntro = {
  left: 65,
  top: 8,
}

/** 湖景小屋上方的常驻引导语。 */
export const lakeHint = '点一下小木屋，进屋坐坐'

export const roomHint = '点一下相机、电脑、书本'
