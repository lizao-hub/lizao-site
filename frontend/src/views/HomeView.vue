<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import PostCard from '@/components/PostCard.vue'
import { posts } from '@/data/posts'
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <div class="flex gap-12">
      <Sidebar />

      <main class="flex-1 min-w-0">
        <h2 class="sr-only">文章列表</h2>

        <p v-if="posts.length === 0" class="text-zinc-500 italic text-center py-12">
          还没有发布任何文章
        </p>

        <div v-else class="space-y-8">
          <PostCard v-for="post in posts" :key="post.slug" :post="post" />
        </div>
      </main>
    </div>
  </div>
</template>
