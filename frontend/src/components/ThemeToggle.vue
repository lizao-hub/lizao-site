<script setup lang="ts">
import LineIcon from '@/components/LineIcon.vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    class="flex h-9 w-9 items-center justify-center rounded-[10px_7px_11px_8px/8px_11px_7px_10px] border border-line text-ink-soft transition-colors duration-200 hover:border-accent hover:text-accent"
    @click="toggleTheme"
  >
    <LineIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="14" />
  </button>
</template>
