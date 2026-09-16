#!/usr/bin/env node
/**
 * 从《霞鹜文楷 Light》生成标题字体的子集。
 *
 * 中文字体整包 27 MB（woff2 后 8.8 MB），不可能直接上线，
 * 所以只保留本站在用到的字。详见 src/assets/fonts/README.md。
 *
 * 用法：
 *   npm run subset-font
 *
 * 依赖 fonttools + brotli：
 *   pip install fonttools brotli
 *
 * 上游字体文件不入库（27 MB）。脚本会在需要时下载到临时目录。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const OUT_DIR = join(SRC, 'assets', 'fonts')
const OUT_FONT = join(OUT_DIR, 'lxgw-wenkai-light-subset.woff2')
const GLYPH_SET = join(ROOT, 'glyph-set.txt')

const FONT_VERSION = 'v1.520'
const FONT_URL = `https://github.com/lxgw/LxgwWenKai/releases/download/${FONT_VERSION}/LXGWWenKai-Light.ttf`

const SCAN_EXTENSIONS = new Set(['.vue', '.ts', '.js', '.md', '.css', '.html'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

/** 中日韩字符 + 全角标点。这些是必须打进子集的范围。 */
function isCjk(code) {
  return (
    (code >= 0x3000 && code <= 0x303f) || // CJK 标点
    (code >= 0x3400 && code <= 0x4dbf) || // 扩展 A
    (code >= 0x4e00 && code <= 0x9fff) || // 基本区
    (code >= 0xf900 && code <= 0xfaff) || // 兼容表意
    (code >= 0xff00 && code <= 0xffef) // 全角形式
  )
}

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, onFile)
    else onFile(full)
  }
}

function collectGlyphs() {
  const found = new Set([' '])
  walk(SRC, (file) => {
    if (!SCAN_EXTENSIONS.has(extname(file))) return
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      return // 二进制或读不了的文件跳过
    }
    for (const char of text) {
      if (isCjk(char.codePointAt(0))) found.add(char)
    }
  })
  return [...found].sort()
}

function ensureUpstreamFont(dir) {
  const cached = join(dir, 'LXGWWenKai-Light.ttf')
  if (existsSync(cached)) return cached
  console.log(`下载上游字体 ${FONT_VERSION} ...`)
  execFileSync('curl', ['-sL', '-o', cached, FONT_URL], { stdio: 'inherit' })
  if (!existsSync(cached) || statSync(cached).size < 1_000_000) {
    throw new Error('字体下载失败。请手动下载后放到临时目录，或检查网络。')
  }
  return cached
}

function main() {
  const glyphs = collectGlyphs()
  if (glyphs.length === 0) throw new Error('没有扫描到任何中文字符，检查 SCAN 范围。')
  writeFileSync(GLYPH_SET, glyphs.join(''), 'utf8')
  console.log(`扫描到 ${glyphs.length} 个字符 -> glyph-set.txt`)

  const workDir = mkdtempSync(join(tmpdir(), 'lxgw-'))
  const upstream = ensureUpstreamFont(workDir)

  const args = [
    upstream,
    `--text-file=${GLYPH_SET}`,
    '--flavor=woff2',
    `--output-file=${OUT_FONT}`,
    '--layout-features=*',
    '--no-hinting',
    '--desubroutinize',
  ]

  console.log('运行 pyftsubset ...')
  try {
    execFileSync('pyftsubset', args, { stdio: 'inherit' })
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('找不到 pyftsubset。先安装：pip install fonttools brotli')
    }
    throw error
  }

  const kb = (statSync(OUT_FONT).size / 1024).toFixed(0)
  console.log(`完成：${OUT_FONT} (${kb} KB)`)
}

main()
