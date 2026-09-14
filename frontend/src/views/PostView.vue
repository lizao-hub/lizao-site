<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PixelIcon from '@/components/PixelIcon.vue'
import { findPost, postBody } from '@/data/posts'
import { shortDate } from '@/utils/date'
import { renderNote } from '@/utils/markdown'
import { profile } from '@/data/resume'

const route = useRoute()

const post = computed(() => findPost(String(route.params.slug)))
const html = computed(() => (post.value ? renderNote(postBody(post.value.slug)) : ''))

// 路由那边给了静态标题，这里用文章自己的标题盖掉它
watchEffect(() => {
  document.title = post.value ? `${post.value.title} | ${profile.name}` : `${profile.name}`
})
</script>

<template>
  <main class="sheet page-top page-bottom">
    <RouterLink
      to="/notes"
      class="rule-link inline-flex items-center gap-2 font-mono text-[0.78rem] text-ink-soft hover:text-ink"
    >
      <PixelIcon name="left" :size="12" />
      笔记
    </RouterLink>

    <template v-if="post">
      <h1 class="mt-8 text-[1.6rem] leading-[1.5] sm:text-[1.9rem]">{{ post.title }}</h1>

      <p class="mt-5 font-mono text-[0.75rem] tracking-[0.04em] text-ink-soft">
        {{ shortDate(post.date) }}
      </p>

      <!-- markdown-it 关了 html 和 typographer，正文是自己写的 Markdown -->
      <div class="prose-note mt-12" v-html="html" />

      <footer class="mt-16 border-t-2 border-line pt-6">
        <p class="font-mono text-[0.72rem] tracking-[0.04em] text-ink-soft">
          {{ post.tags.join(' / ') }}
        </p>
      </footer>
    </template>

    <div v-else class="mt-10">
      <p class="text-ink-soft">找不到这篇文章。</p>
      <RouterLink to="/notes" class="pixel-btn mt-6">返回笔记列表</RouterLink>
    </div>
  </main>
</template>
