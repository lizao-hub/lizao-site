/**
 * 场景素材转换。
 *
 * 把 frontend/1/ 里的原始 PNG 转成 WebP，输出到 src/assets/backgrounds/。
 * 原始图是 2848×1602 的大图，一张 background.png 就有 6~8 MB，
 * 直接进仓库会让 assets 比整个 src 大一个数量级。
 *
 * 用法：npm run build-scenes
 *
 * 关于尺寸：scene 的舞台宽度上限是 min(100vw, 100vh * 2848/1602)，
 * 在 2560 宽的屏幕上也不会超过 2560 CSS px；2x 屏给到 2848 已经没有意义，
 * 所以长边压到 2400 就够了。压过头会让水彩的笔触糊掉，别降到 1600 以下。
 *
 * 图层是带 alpha 的，必须保留 alpha（WebP 支持，这就是不用 JPEG 的原因）。
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '..', '1')
const OUT = join(here, '..', 'src', 'assets', 'backgrounds')

/** 长边上限。见文件头说明。 */
const MAX_EDGE = 2400
const QUALITY = 82

/**
 * 要转换的图。键是输出文件名，值来自哪个目录。
 *
 * 注意这里只列**要上线**的图：
 * - composite.png 不转：它是用来验证图层位置的合成参考图，页面用不到。
 * - 黑猫.png、日向翔阳动漫海报.png 不转：这两张已经从场景里删掉了。
 */
const SCENE_INPUTS = {
  home: {
    background: 'img/background.png',
    shrub: 'img/远处矮树丛.png',
    willow: 'img/垂柳大树.png',
    cabin: 'img/红顶小木屋.png',
    fence: 'img/棕色木栅栏.png',
    boy: 'img/躺卧少年.png',
    daisy: 'img/前景白色雏菊花丛.png',
  },
  room: {
    background: 'img2/background.png',
    desk: 'img2/实木书桌.png',
    booksTall: 'img2/右侧竖排书籍.png',
    booksLeft: 'img2/左侧横叠书籍.png',
    booksRight: 'img2/右侧横叠书籍.png',
    laptop: 'img2/笔记本电脑.png',
    camera: 'img2/复古旁轴相机.png',
    mug: 'img2/米白马克杯.png',
  },
}

/** 社交卡片用的封面，从湖景合成图里裁 1200×630（og:image 的标准比例）。 */
const OG_SOURCE = 'img/composite.png'

async function convertScene(name, files) {
  const dir = join(OUT, name)
  await mkdir(dir, { recursive: true })

  for (const [output, relative] of Object.entries(files)) {
    const input = join(SRC, relative)
    const target = join(dir, `${output}.webp`)

    const image = sharp(input)
    const meta = await image.metadata()

    // 只在图比上限大的时候缩，避免把小图放大
    const resize =
      Math.max(meta.width, meta.height) > MAX_EDGE
        ? { width: Math.round((meta.width * MAX_EDGE) / Math.max(meta.width, meta.height)), withoutEnlargement: true }
        : undefined

    const buffer = await (resize ? image.resize(resize) : image)
      .webp({ quality: QUALITY, effort: 6 })
      .toBuffer()

    await writeFile(target, buffer)

    const before = meta.size ?? 0
    const after = buffer.length
    console.log(
      `  ${name}/${output}.webp  ${meta.width}×${meta.height}  ` +
        `${formatSize(before)} -> ${formatSize(after)}`,
    )
  }
}

async function buildOgImage() {
  const dir = join(here, '..', 'public')
  await mkdir(dir, { recursive: true })

  const buffer = await sharp(join(SRC, OG_SOURCE))
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .webp({ quality: 84 })
    .toBuffer()

  await writeFile(join(dir, 'og-cover.webp'), buffer)
  console.log(`  public/og-cover.webp  1200×630  ${formatSize(buffer.length)}`)
}

function formatSize(bytes) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

async function main() {
  console.log('转换场景素材到 src/assets/backgrounds/ …\n')
  for (const [name, files] of Object.entries(SCENE_INPUTS)) {
    await convertScene(name, files)
  }
  console.log('\nog:image …')
  await buildOgImage()
  console.log('\n完成。')
}

main().catch((error) => {
  console.error('转换失败：', error.message)
  process.exit(1)
})
