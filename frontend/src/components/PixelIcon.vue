<script setup lang="ts">
import { computed } from 'vue'
import type { PixelIconName } from '@/types/icon'

/**
 * 像素图标。
 *
 * 需求文档明确要求「图标使用像素风 SVG」，所以这里手绘 8x8 点阵，
 * 而不是引入线性图标库：混两种风格会立刻露馅。
 * 所有图标都在 8x8 网格上，用 shape-rendering=crispEdges 保证不糊。
 */
const GLYPHS: Record<PixelIconName, string[]> = {
  sun: [
    '00000000',
    '00100100',
    '00011000',
    '01111110',
    '01111110',
    '00011000',
    '00100100',
    '00000000',
  ],
  moon: [
    '00011100',
    '00110000',
    '01100000',
    '01100000',
    '01100000',
    '01100000',
    '00110000',
    '00011100',
  ],
  close: [
    '00000000',
    '01100110',
    '00111100',
    '00011000',
    '00011000',
    '00111100',
    '01100110',
    '00000000',
  ],
  left: [
    '00000000',
    '00011000',
    '00110000',
    '01100000',
    '01100000',
    '00110000',
    '00011000',
    '00000000',
  ],
  right: [
    '00000000',
    '00011000',
    '00001100',
    '00000110',
    '00000110',
    '00001100',
    '00011000',
    '00000000',
  ],
  arrow: [
    '00000000',
    '00000100',
    '00000110',
    '11111111',
    '11111111',
    '00000110',
    '00000100',
    '00000000',
  ],
  external: [
    '00000000',
    '00001110',
    '00001111',
    '00001100',
    '00011100',
    '00111000',
    '01110000',
    '00000000',
  ],
  check: [
    '00000000',
    '00000001',
    '00000011',
    '00000110',
    '11001100',
    '01111000',
    '00110000',
    '00000000',
  ],
  dot: [
    '00000000',
    '00000000',
    '00011000',
    '00011000',
    '00011000',
    '00000000',
    '00000000',
    '00000000',
  ],
  menu: [
    '00000000',
    '00000000',
    '11111111',
    '11111111',
    '00000000',
    '11111111',
    '11111111',
    '00000000',
  ],
  terminal: [
    '11111111',
    '10000001',
    '10100001',
    '10010001',
    '10100001',
    '10000001',
    '10111101',
    '11111111',
  ],
}

const props = withDefaults(defineProps<{ name: PixelIconName; size?: number }>(), { size: 16 })

const cells = computed(() => {
  const rows = GLYPHS[props.name]
  const out: Array<{ x: number; y: number }> = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '1') out.push({ x, y })
    }
  })
  return out
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 8 8"
    shape-rendering="crispEdges"
    aria-hidden="true"
    focusable="false"
    class="shrink-0"
  >
    <rect v-for="cell in cells" :key="`${cell.x}-${cell.y}`" :x="cell.x" :y="cell.y" width="1" height="1" fill="currentColor" />
  </svg>
</template>
