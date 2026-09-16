<script setup lang="ts">
import LineIcon from '@/components/LineIcon.vue'
import { profile } from '@/data/resume'
</script>

<template>
  <footer class="mt-24 border-t border-line">
    <div class="shell flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-[0.78rem] text-ink-faint">© 2026 {{ profile.name }}</p>
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
  </footer>
</template>
