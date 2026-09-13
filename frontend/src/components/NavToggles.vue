<script setup lang="ts">

// useTheme()：返回当前主题状态 theme（值为 'dark' 或 'light'）和切换方法 toggleTheme。通常内部会读写 localStorage 并操作 <html> 元素的 class。
// useLocale()：返回当前语言 locale（值为 'zh' 或 'en'）和切换方法 toggleLocale。
// navCopy：一个多语言文案对象
import { Languages, Moon, Sun } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useLocale } from '@/composables/useLocale'
import { navCopy } from '@/data/navCopy' // 多语言文案数据

const { theme, toggleTheme } = useTheme()
const { locale, toggleLocale } = useLocale()
</script>

<template>
  <div class="flex items-center gap-1">
    <!-- 按钮一：主题切换 -->
    <button
      type="button"
      :aria-label="theme === 'dark' ? navCopy[locale].toLight : navCopy[locale].toDark"
      :title="theme === 'dark' ? navCopy[locale].toLight : navCopy[locale].toDark"
      class="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      @click="toggleTheme"
    >
      <Moon v-if="theme === 'dark'" :size="18" :stroke-width="1.75" aria-hidden="true" />
      <Sun v-else :size="18" :stroke-width="1.75" aria-hidden="true" />
    </button>

    <!-- 按钮二：语言切换 -->
    <button
      type="button"
      :aria-label="navCopy[locale].switchLanguage"
      :title="navCopy[locale].switchLanguage"
      class="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      @click="toggleLocale"
    >
      <Languages :size="18" :stroke-width="1.75" aria-hidden="true" />
      <span class="w-7 text-left tabular-nums">{{ locale === 'zh' ? '中' : 'EN' }}</span>
    </button>
  </div>
</template>
