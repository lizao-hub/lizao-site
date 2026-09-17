<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'
import { profile } from '@/data/resume'

/**
 * 页脚。只在内容页出现（场景页没有页脚，见 ADR-0009）。
 *
 * 「屋里」放在这里而不是主导航：屋里是一个场景，不是一篇能读的页面，
 * 但它得有个地方能进去 —— 否则一个从搜索引擎直接落到 /notes 的人
 * 永远看不到站点最有意思的那一页。
 */
</script>

<template>
  <footer class="mt-24 border-t border-line">
    <div class="shell flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[0.78rem] text-ink-faint">© 2026 {{ profile.name }}</p>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <RouterLink
          to="/room"
          class="rule-link text-[0.78rem] text-ink-soft transition-colors duration-200 hover:text-accent"
        >
          屋里
        </RouterLink>

        <a
          :href="profile.github"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-[0.78rem] text-ink-soft transition-colors duration-200 hover:text-accent"
        >
          {{ profile.githubLabel }}
          <LineIcon name="external" :size="12" />
        </a>
      </div>
    </div>
  </footer>
</template>
