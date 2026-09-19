<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { RiExternalLinkLine } from '@remixicon/vue'
import { profile } from '@/data/profile'

/**
 * 页脚。**全站未挂载**（待重新制作），所以它不参与 `npm run build` 的产物，
 * 但 `vue-tsc` 仍然会检查它 —— 改了图标或数据文件记得同步这里，否则
 * `npm run type-check` 会先在这里红。
 *
 * 「屋里」放在这里而不是主导航：屋里是一个场景，不是一篇能读的页面，
 * 但它得有个地方能进去 —— 否则一个从搜索引擎直接落进内容页的人
 * 永远看不到站点最有意思的那一页。
 *
 * ⚠️ 这个文件是 2026-09-19 傍晚照 git 里的版本补回来的：原文件被一次误删带走，
 * 回收站与编辑器历史里都没有。当时顺手修了三处：图标改走 @remixicon/vue、
 * 身份信息改从 `@/data/profile` 取（`data/resume.ts` 早就不在了）、
 * 删掉引用 `docs/adr/` 的那句（那个目录已不在仓库里）。
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
          <RiExternalLinkLine size="12px" class="inline-block shrink-0 align-[-0.125em]" />
        </a>
      </div>
    </div>
  </footer>
</template>
