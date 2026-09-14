<script setup lang="ts">
import PixelIcon from '@/components/PixelIcon.vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    class="flex h-9 w-9 items-center justify-center border-2 border-line text-ink-soft transition-colors duration-150 ease-pixel hover:border-accent hover:text-accent"
    @click="toggleTheme"
  >
    <PixelIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="14" />
  </button>
</template>
