<script setup lang="ts">
import SectionFade from '@/components/SectionFade.vue'
import NoteEntry from '@/components/NoteEntry.vue'
import { postsByDate } from '@/data/posts'
</script>

<template>
  <main class="sheet page-top page-bottom">
    <header>
      <h1 class="text-[1.8rem] leading-tight sm:text-[2rem]">笔记</h1>
      <p class="mt-5 max-w-[40rem] text-[0.95rem] leading-[1.9] text-ink-soft">
        写代码时踩过的坑、读源码的方法，以及一些顺手记下来的结论。
      </p>
    </header>

    <div class="mt-12 space-y-14 sm:space-y-16">
      <SectionFade
        v-for="(post, i) in postsByDate"
        :key="post.slug"
        as="div"
        :delay="i * 60"
      >
        <!-- 偶数条图在左，奇数条图在右，交替往下 -->
        <NoteEntry :post="post" :flip="i % 2 === 1" :eager="i < 2" />
      </SectionFade>
    </div>
  </main>
</template>
