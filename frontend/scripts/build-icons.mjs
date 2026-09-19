/**
 * 站点图标（favicon）与屋里行内小脸生成。
 *
 * 从 `scripts/icon-source.png` 生成三份进 public/：
 *
 *     favicon.ico        16 / 32 / 48，三帧打包（老浏览器与固定标签页用）
 *     favicon-192.png    192，现代浏览器的 `<link rel="icon" type="image/png">`
 *     apple-touch-icon.png  180，**带纸色底**（iOS 不给透明图配底，会糊成黑）
 *
 * 屋里「关于我」名字后面那张行内小脸（`../src/assets/lizao-face.webp`）
 * 从 `scripts/face-source.webp` 单独生成 —— 2026-09-19 之后它和 favicon
 * 不再是同一张源图。换脸改 `face-source.webp` 再跑一次；换站点图标改
 * `icon-source.png`。
 *
 * 用法：npm run build-icons
 *
 * ## 为什么是位图而不是那枚手绘 SVG
 *
 * 原来 `favicon.svg` 是手绘点阵的「LZ」字标，矢量、随字号清晰。
 * 现在换成人像表情图 —— 源图是 512×512 的位图，**没有矢量可依**，
 * 所以整套图标改成位图（浏览器标签栏渲染不了 webfont，这块本来也只能用图）。
 * `favicon.svg` 已删：留着一份没人引用的"矢量母版"只会让人以为还要同步它。
 * 要考古去 `git log -- frontend/public/favicon.svg`。
 *
 * ## 尺寸这件事的坑
 *
 * 源图自带 5~7% 的透明留白（表情图的设计边距）。逐档直接缩，
 * 16px 上那张脸只占约 14px。所以先把留白裁到 1%，再按目标尺寸外扩 3%
 * —— **留一点边**，否则圆形会顶到标签栏的框线上，像被裁掉了。
 *
 * 高密度栅格化（density）在**位图源**上不起作用（那是给 SVG 用的），
 * 这里靠的是 `lanczos3` 降采样：从 512 一次算到 16，比逐级缩干净。
 *
 * ## 16px 那一档为什么要跟着补一道锐化
 *
 * 这张脸上「眉毛」和「闭着的眼睛」是两道彼此分开的深色笔画，中间只隔一条
 * 不到一个像素宽的黄缝。512 → 16 是 32 倍降采样，那道缝会被邻近的深色吃掉，
 * 眉眼糊成一团墨（这一档恰好就是浏览器标签栏用的档，最不能糊）。
 *
 * 试过三条路（当时的对比图没进仓库，要看就照下面重跑一遍）：
 *
 *   - **gamma 校正后再缩**：`.gamma(2.2)` 让重采样在线性光下做，物理上更正确，
 *     但细笔画会被**洗淡**（眉眼中线的亮度落差从 66 掉到 47），脸变糊，不取。
 *   - **两级降采样**（512→64→16）：没有改善，落差 67 与直缩持平。
 *   - **`.sharpen(1.2)`**：落差升到 76，48px 与 16px 下眉眼都还是两道 —— **取这条**。
 *     （sharp 的 `sharpen(sigma)` 只给一个数时，1.2 以上再往上加没有区别，
 *     别以为调大就更清楚。）
 *
 * 对比图是拿一个用完即弃的探针脚本生成的（没进仓库）：按「同一张源图 × 几个
 * 缩样参数，各自渲 16px 出来做最近邻放大并排」重写一个就行，别把探针留在 scripts/ 里。
 *
 * ## 颜色
 *
 * 源图是暖黄（H≈45°）。原先 main.css 立着「令牌里只有冷色」的规矩，这枚图标
 * 是全站唯一一处的破例；**那条规矩已于 2026-09-19 废止**，所以它不再需要解释 ——
 * 换图照原样用就行，不必先迁到冷色。
 *
 * 当时为了「万一要迁」备过一版冷色，配方留在这儿备用：逐像素转 HSL →
 * 色相 +90° 后**镜像折返**进 [128°, 308°)、饱和度 `min(s × 0.28, 0.24)`、
 * 明度走一次 `l ** 0.78`（只提中间调，暗部不动，否则眉眼会糊掉）。踩过两个坑：
 * 站点那族色饱和只有 6~21%，照搬 92% 的饱和会出**霓虹绿**；
 * **折返必须镜像** —— 绕环回卷会把笔画的棕（H≈30°）甩到 292° 的紫上去，
 * 整张脸发紫。改完记得回看 `apple-touch-icon.png` 的四角纸色。
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = process.argv[2] || join(here, 'icon-source.png')
const FACE_SRC = join(here, 'face-source.webp')
const OUT = join(here, '..', 'public')

/** 行内小脸的落点。和 public/ 分开：它是页面资源，走构建期 import。 */
const FACE_OUT = join(here, '..', 'src', 'assets')

/** ICO 里打包的帧。16 是标签栏，32 是高分屏与固定标签，48 给老 IE / 书签。 */
const ICO_SIZES = [16, 32, 48]
const TOUCH_SIZE = 180
const PNG_SIZE = 192

/**
 * 屋里名字后面那张行内小脸（`src/assets/lizao-face.webp`）。
 *
 * 它**不进 public/** —— 它是页面里的一个元素，走构建期 import，
 * 这样 Vite 会把它当资源处理（改名、算指纹）。
 * 256 够用：它渲染出来是名字的字号那么大（clamp 26~54px），
 * 普通屏 1 倍、高分屏 2 倍都在这之内。
 */
const FACE_SIZE = 256

/** apple-touch-icon 的底色。取全站唯一的那个纸色（main.css 的 --paper）。 */
const PAPER = { r: 246, g: 249, b: 247, alpha: 1 }

/** 裁掉源图留白后，四周再留多少（占最终尺寸的比例）。 */
const MARGIN = 0.03

/** 小于等于这个尺寸才补锐化。64 是分界：往上是「缩略图」，往下是「图标」。 */
const SHARPEN_BELOW = 64

/**
 * 源图里**有内容的**那个正方形，四周按 1% 余量。
 *
 * 取宽高里大的那一边当边长，居中切 —— 表情图是圆的，切成正方形后
 * 圆的直径就是边长，四角自然还是透明的。
 */
async function contentSquare(image) {
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height

  let minX = W
  let minY = H
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // 阈值 8：alpha 1~7 是抗锯齿的毛边，不算内容
      if (data[(y * W + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) throw new Error(`${SRC} 整张都是透明的，没有内容可裁`)

  const side = Math.max(maxX - minX + 1, maxY - minY + 1)
  const pad = Math.round(side * 0.01)
  const edge = Math.min(side + pad * 2, Math.min(W, H))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  return {
    left: Math.max(0, Math.min(W - edge, Math.round(cx - edge / 2))),
    top: Math.max(0, Math.min(H - edge, Math.round(cy - edge / 2))),
    width: edge,
    height: edge,
  }
}

/** 一档尺寸。多出来的那圈透明边由 `extend` 补。 */
async function render(square, size, background) {
  const inner = Math.round(size * (1 - MARGIN * 2))
  const pad = size - inner
  let img = sharp(SRC).extract(square).resize(inner, inner, { kernel: 'lanczos3' })

  // 小尺寸补一道锐化，把降采样吃掉的眉眼缝隙找回来（见文件头）。
  // 大尺寸不加：192 / 180 是从 512 缩 2.7 倍，笔画本来就清楚，
  // 再锐化只会在轮廓外侧勾出一圈亮边。锐化在 `extend` 之前 ——
  // 补透明边之后再做会把 alpha 边缘也锐一遍，外圈会起毛刺。
  if (size <= SHARPEN_BELOW) img = img.sharpen(1.2)

  if (background) {
    // iOS 那边要不透明的：垫一层底再压上去
    img = img
      .flatten({ background: PAPER })
      .extend({
        top: Math.floor(pad / 2),
        bottom: Math.ceil(pad / 2),
        left: Math.floor(pad / 2),
        right: Math.ceil(pad / 2),
        background: PAPER,
      })
  } else {
    img = img.extend({
      top: Math.floor(pad / 2),
      bottom: Math.ceil(pad / 2),
      left: Math.floor(pad / 2),
      right: Math.ceil(pad / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
  }
  return img.png({ compressionLevel: 9 }).toBuffer()
}

/**
 * 手拼 ICO 容器 —— 不必为这个引一个库。
 *
 * 头 6 字节：保留 0、类型 1、帧数；每帧 16 字节目录；然后是各帧的 PNG 载荷。
 * 宽度写 0 表示 256，这里最大的帧是 48，直接写实数。
 * 载荷用 PNG 而不是 BMP：现代浏览器都吃 PNG 型 ICO，
 * 省掉 BMP 那套调色板 / 掩码的写法，边缘还带 alpha。
 */
function buildIco(frames) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(frames.length, 4)

  let offset = 6 + frames.length * 16
  const entries = []
  for (const { size, data } of frames) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // 调色板数：0 = 真彩
    entry.writeUInt8(0, 3) // 保留
    entry.writeUInt16LE(1, 4) // planes
    entry.writeUInt16LE(32, 6) // bpp
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)])
}

await mkdir(OUT, { recursive: true })

const square = await contentSquare(sharp(SRC))
console.log('源图裁切区:', `${square.left},${square.top} ${square.width}×${square.height}`)

const faceSquare = await contentSquare(sharp(FACE_SRC))
console.log('小脸裁切区:', `${faceSquare.left},${faceSquare.top} ${faceSquare.width}×${faceSquare.height}`)

const ico = []
for (const size of ICO_SIZES) ico.push({ size, data: await render(square, size, false) })

await writeFile(join(OUT, 'favicon.ico'), buildIco(ico))
await writeFile(join(OUT, 'favicon-192.png'), await render(square, PNG_SIZE, false))
await writeFile(join(OUT, 'apple-touch-icon.png'), await render(square, TOUCH_SIZE, true))

/*
 * 名字后面那张行内小脸：同源、同一次裁切，**不要** MARGIN 那圈外扩边距
 * （理由见文件头），也不补锐化 —— 256 是从 512 缩 1.8 倍，笔画本来就清楚，
 * 再锐化只会在轮廓外勾出一圈亮边。
 *
 * 用 webp 而不是 png：这张 256 的 PNG 要 57KB，q92 的 webp 只要 10.9KB，
 * 在木墙底色上合成后最大通道差 46、平均 0.99 —— 看不出（量过的）。
 */
await mkdir(FACE_OUT, { recursive: true })
await sharp(FACE_SRC)
  .extract(faceSquare)
  .resize(FACE_SIZE, FACE_SIZE, { kernel: 'lanczos3' })
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toFile(join(FACE_OUT, 'lizao-face.webp'))

for (const size of ICO_SIZES) console.log(`  favicon.ico        ${size}×${size}`)
console.log(`  favicon-192.png    ${PNG_SIZE}×${PNG_SIZE}`)
console.log(`  apple-touch-icon.png ${TOUCH_SIZE}×${TOUCH_SIZE}（纸色底）`)
console.log(`  lizao-face.webp    ${FACE_SIZE}×${FACE_SIZE}（屋里名字后面那张）`)
