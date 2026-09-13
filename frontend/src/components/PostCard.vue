<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'
import { formatDate } from '@/data/posts'

defineProps<{ post: Post }>()
</script>

<template>
  <article>
    <h2 class="text-xl font-semibold">
      <RouterLink
        :to="`/posts/${post.slug}`"
        class="transition-colors hover:underline underline-offset-4 decoration-zinc-400 dark:decoration-zinc-500"
      >
        {{ post.title }}
      </RouterLink>
    </h2>

    <time :datetime="post.date" class="block text-sm text-zinc-500 mt-1">
      {{ formatDate(post.date) }}
    </time>

    <p class="text-zinc-700 dark:text-zinc-300 mt-2 line-clamp-2">
      {{ post.summary }}
    </p>

    <ul class="flex flex-wrap gap-2 mt-3">
      <li
        v-for="tag in post.tags"
        :key="tag"
        class="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      >
        {{ tag }}
      </li>
    </ul>
  </article>
</template>
