<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import NavToggles from '@/components/NavToggles.vue'
import { useLocale } from '@/composables/useLocale'
import { navCopy } from '@/data/navCopy'


// useRoute()：获取当前路由对象，用于判断哪个导航项处于激活状态。
// links 数组：将导航菜单抽象为数据，key 对应 navCopy 中的多语言键名，to 对应路由路径。新增/删除导航项只需修改此数组，无需改动模板。
const { locale } = useLocale()
const route = useRoute()

const links = [
  { key: 'notes', to: '/notes' },
  { key: 'projects', to: '/projects' },
  { key: 'about', to: '/about' },
  { key: 'friends', to: '/friends' },
] as const
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80"
  >
    <nav
      aria-label="主导航"
      class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4"
    >
      <RouterLink
        to="/"
        class="shrink-0 text-base font-semibold tracking-tight transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        {{ navCopy[locale].brand }}
        <!-- brand: '李枣的自留地' -->
      </RouterLink>

      <div class="flex items-center gap-6">
        <ul class="flex items-center gap-1">
          <li v-for="link in links" :key="link.key">
            <RouterLink
              :to="link.to"
              class="rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              :class="{ 'text-zinc-900 font-medium dark:text-zinc-100': route.path === link.to }"
            >
              {{ navCopy[locale][link.key] }}
            </RouterLink>
          </li>
        </ul>

        <NavToggles />
      </div>
    </nav>
  </header>
</template>
