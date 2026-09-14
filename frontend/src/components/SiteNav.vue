<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PixelIcon from '@/components/PixelIcon.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { profile } from '@/data/resume'

const route = useRoute()
const open = ref(false)

const links = [
  { label: '首页', to: '/' },
  { label: '项目', to: '/projects' },
  { label: '关于', to: '/about' },
  { label: '笔记', to: '/notes' },
  { label: '影像', to: '/gallery' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch(() => route.fullPath, () => {
  open.value = false
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header
    class="sticky top-0 border-b-2 border-line bg-paper"
    :style="{ zIndex: 'var(--z-nav)' }"
  >
    <nav aria-label="主导航" class="shell flex h-16 items-center justify-between gap-4">
      <RouterLink to="/" class="flex shrink-0 items-center gap-2.5" aria-label="回到首页">
        <span class="pixel-logo" aria-hidden="true">LZ</span>
        <span class="text-[0.95rem] font-semibold text-ink">{{ profile.name }}</span>
      </RouterLink>

      <div class="flex items-center gap-3 sm:gap-4">
        <ul class="hidden items-center gap-6 md:flex">
          <li v-for="link in links" :key="link.to" class="relative">
            <RouterLink
              :to="link.to"
              class="rule-link text-[0.875rem] transition-colors duration-150 ease-pixel"
              :class="isActive(link.to) ? 'text-accent' : 'text-ink-soft hover:text-ink'"
            >
              {{ link.label }}
            </RouterLink>
            <span
              v-if="isActive(link.to)"
              class="absolute -bottom-1 left-0 h-[2px] w-full bg-accent"
              aria-hidden="true"
            />
          </li>
        </ul>

        <a
          :href="profile.github"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden items-center gap-1.5 border-2 border-line px-2.5 py-1.5 font-mono text-[0.75rem] text-ink-soft transition-colors duration-150 ease-pixel hover:border-accent hover:text-accent sm:inline-flex"
        >
          GitHub
          <PixelIcon name="external" :size="12" />
        </a>

        <ThemeToggle />

        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center border-2 border-line text-ink-soft transition-colors duration-150 ease-pixel hover:border-accent hover:text-accent md:hidden"
          :aria-label="open ? '关闭菜单' : '打开菜单'"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          @click="open = !open"
        >
          <PixelIcon :name="open ? 'close' : 'menu'" :size="14" />
        </button>
      </div>
    </nav>

    <div
      v-if="open"
      id="mobile-nav"
      class="absolute inset-x-0 top-16 border-b-2 border-line bg-paper md:hidden"
    >
      <ul class="shell flex flex-col py-2">
        <li v-for="link in links" :key="link.to" class="border-b border-line last:border-b-0">
          <RouterLink
            :to="link.to"
            class="block py-3.5 text-[0.95rem]"
            :class="isActive(link.to) ? 'text-accent' : 'text-ink'"
          >
            {{ link.label }}
          </RouterLink>
        </li>
        <li class="pt-3">
          <a
            :href="profile.github"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 py-2 font-mono text-[0.85rem] text-ink-soft"
          >
            GitHub
            <PixelIcon name="external" :size="12" />
          </a>
        </li>
      </ul>
    </div>
  </header>
</template>
