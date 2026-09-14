<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'
import { shortDate } from '@/utils/date'

defineProps<{ post: Post }>()
</script>

<template>
  <article class="grid gap-2 sm:grid-cols-[6rem_1fr] sm:gap-x-6">
    <time
      :datetime="post.date"
      class="font-mono text-[0.75rem] leading-6 tracking-[0.04em] text-ink-soft sm:text-right"
    >
      {{ shortDate(post.date) }}
    </time>

    <div>
      <h2 class="text-[1.05rem] leading-[1.7]">
        <RouterLink :to="`/notes/${post.slug}`" class="rule-link text-ink">
          {{ post.title }}
        </RouterLink>
      </h2>

      <p class="mt-2 text-[0.925rem] leading-[1.85] text-ink-soft">
        {{ post.summary }}
      </p>

      <p class="mt-3 font-mono text-[0.72rem] tracking-[0.04em] text-ink-soft">
        {{ post.tags.join(' / ') }}
      </p>
    </div>
  </article>
</template>
