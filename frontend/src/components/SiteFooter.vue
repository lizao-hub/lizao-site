<script setup lang="ts">
import PixelIcon from '@/components/PixelIcon.vue'
import { profile } from '@/data/resume'
</script>

<template>
  <footer class="mt-20 border-t-2 border-line">
    <div class="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
      <p class="font-mono text-[0.75rem] text-ink-soft">© 2026 {{ profile.name }}</p>
      <a
        :href="profile.github"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 font-mono text-[0.75rem] text-ink-soft transition-colors duration-150 ease-pixel hover:text-accent"
      >
        {{ profile.githubLabel }}
        <PixelIcon name="external" :size="12" />
      </a>
    </div>
  </footer>
</template>
