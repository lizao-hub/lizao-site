<script setup lang="ts">
/**
 * 一张照片。手绘相框 + 色块偏移，hover 时轻轻飘起来。
 * 统一按 4:3 裁切，网格才不会参差不齐；点开灯箱看的是完整原图。
 */
withDefaults(
  defineProps<{
    src: string
    alt: string
    caption?: string
    /** CSS aspect-ratio 值 */
    ratio?: string
    /** 首屏那张图用 eager，其余懒加载 */
    eager?: boolean
  }>(),
  {
    caption: undefined,
    ratio: '4 / 3',
    eager: false,
  },
)

const emit = defineEmits<{ (event: 'open'): void }>()
</script>

<template>
  <button type="button" class="photo" @click="emit('open')">
    <span class="photo__frame" :style="{ aspectRatio: ratio }">
      <img
        class="photo__img"
        :src="src"
        :alt="alt"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : 'auto'"
        decoding="async"
      />
    </span>
    <span v-if="caption" class="photo__caption">{{ caption }}</span>
  </button>
</template>
