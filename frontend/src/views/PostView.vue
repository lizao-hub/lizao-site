<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { posts, formatDate } from '@/data/posts'

const route = useRoute()
const post = computed(() => posts.find((item) => item.slug === route.params.slug))
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 py-12">
    <RouterLink
      to="/"
      class="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
    >
      返回首页
    </RouterLink>

    <template v-if="post">
      <h1 class="text-3xl font-bold mt-6">{{ post.title }}</h1>

      <time :datetime="post.date" class="block text-sm text-zinc-500 mt-2">
        {{ formatDate(post.date) }}
      </time>

      <ul class="flex flex-wrap gap-2 mt-3">
        <li
          v-for="tag in post.tags"
          :key="tag"
          class="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        >
          {{ tag }}
        </li>
      </ul>

      <p class="text-zinc-700 dark:text-zinc-300 mt-6 leading-relaxed">{{ post.summary }}</p>
    </template>

    <p v-else class="text-zinc-500 italic text-center py-12">找不到这篇文章</p>
  </main>
</template>
