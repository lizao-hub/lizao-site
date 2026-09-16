<script setup lang="ts">
import LineIcon from '@/components/LineIcon.vue'

/**
 * 笔记卡片左（或右）半边的封面。
 *
 * 有图就显示图；没有图不塌、不留白洞，画一片淡色留白，
 * 中间一个小图标说明「这儿以后是封面」。
 * 和影像页的空相框一样，诚实，不假装。
 */
withDefaults(
  defineProps<{
    src?: string
    alt: string
    /** 首屏前两张用 eager，其余懒加载 */
    eager?: boolean
  }>(),
  { src: undefined, eager: false },
)
</script>

<template>
  <div class="note-cover">
    <img
      v-if="src"
      class="note-cover__img"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
    />

    <div v-else class="note-cover__blank bg-surface-sunk">
      <LineIcon name="image" :size="20" />
      <span class="font-mono text-[0.68rem] tracking-[0.08em] text-ink-soft">暂无封面</span>
    </div>
  </div>
</template>
