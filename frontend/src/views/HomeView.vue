<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionFade from '@/components/SectionFade.vue'
import SkillTag from '@/components/SkillTag.vue'
import LineIcon from '@/components/LineIcon.vue'
import { profile } from '@/data/resume'
import { postsByDate } from '@/data/posts'
import { myPhotos } from '@/data/photos'
import { shortDate } from '@/utils/date'

const heroPhoto = computed(() => myPhotos[0])
const recentPosts = computed(() => postsByDate.slice(0, 3))
const recentPhotos = computed(() => myPhotos.slice(0, 4))
</script>

<template>
  <main>
    <!-- 首屏。左侧是一段话，右侧一张真实照片；角落两个很慢的自然意象
         （云与叶）在飘，只在首屏，不跟滚动联动。见 ADR-0005。 -->
    <section class="hero relative overflow-hidden border-b border-line">
      <!-- 环境动效：两个元素，7s 以上周期，压在内容下面 -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
          class="drift sketchy absolute -top-2 right-[8%] h-16 w-32 text-water sm:h-20 sm:w-40"
          viewBox="0 0 160 64"
          fill="none"
          opacity="0.22"
        >
          <path
            d="M22 44c-9 0-16-6-16-14S13 16 24 16c4-7 12-11 21-11 12 0 22 7 25 17 8 1 14 7 14 15 0 4-2 7-5 10H22Z"
            fill="currentColor"
          />
        </svg>
        <svg
          class="sway sketchy absolute bottom-[14%] left-[4%] h-10 w-10 text-moss sm:h-12 sm:w-12"
          viewBox="0 0 40 40"
          fill="none"
          opacity="0.26"
        >
          <path
            d="M6 32C2 20 10 8 28 4c2 16-8 26-22 28Z"
            fill="currentColor"
            opacity="0.7"
          />
          <path d="M9 29c6-6 11-11 17-16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
      </div>

      <div
        class="shell relative grid gap-8 py-16 sm:gap-12 sm:py-24 lg:grid-cols-[1.4fr_0.9fr] lg:items-center lg:gap-16"
      >
        <div>
          <p class="text-[0.75rem] tracking-[0.14em] text-accent">杭州 · 在读</p>

          <h1 class="mt-5 text-[2rem] leading-tight sm:text-[2.6rem]">{{ profile.name }}</h1>

          <p class="mt-5 max-w-[34rem] text-[0.95rem] leading-[1.95] text-ink-soft">
            {{ profile.tagline }}
          </p>

          <p class="mt-4 max-w-[34rem] text-[0.95rem] leading-[1.95] text-ink-soft">
            这里是自留地。放写过的代码、拍过的照片，和一些顺手记下来的东西。
          </p>

          <ul class="mt-7 flex flex-wrap gap-2">
            <li v-for="tag in profile.focus" :key="tag">
              <SkillTag :label="tag" />
            </li>
          </ul>

          <div class="mt-9 flex flex-wrap gap-4">
            <RouterLink to="/notes" class="btn btn--primary">
              看看笔记
              <LineIcon name="arrow" :size="13" />
            </RouterLink>
            <RouterLink to="/about" class="btn">关于我</RouterLink>
          </div>
        </div>

        <div v-if="heroPhoto" class="mx-auto w-full max-w-[11rem] sm:max-w-[13rem] lg:max-w-none">
          <span class="portrait-frame" :style="{ aspectRatio: '4 / 5' }">
            <img
              :src="heroPhoto.src"
              :alt="`${heroPhoto.albumName}：第 ${heroPhoto.index} 张`"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </span>
        </div>
      </div>
    </section>

    <!-- 最近写的：三篇，读完就走 -->
    <section v-if="recentPosts.length" class="shell page-top">
      <SectionFade class="flex items-end justify-between gap-6">
        <h2 class="text-[1.3rem]">最近写的</h2>
        <RouterLink
          to="/notes"
          class="rule-link shrink-0 text-[0.8rem] text-ink-soft hover:text-accent"
        >
          全部笔记
        </RouterLink>
      </SectionFade>

      <div class="mt-8 space-y-9">
        <SectionFade v-for="(post, i) in recentPosts" :key="post.slug" as="div" :delay="i * 70">
          <RouterLink :to="`/notes/${post.slug}`" class="group block">
            <p class="text-[0.72rem] tracking-[0.06em] text-ink-faint">
              {{ shortDate(post.date) }}
            </p>
            <h3
              class="mt-2 text-[1.1rem] leading-[1.7] transition-colors duration-200 group-hover:text-accent"
            >
              {{ post.title }}
            </h3>
            <p class="mt-2 max-w-[40rem] text-[0.9rem] leading-[1.9] text-ink-soft">
              {{ post.summary }}
            </p>
          </RouterLink>
        </SectionFade>
      </div>
    </section>

    <!-- 最近的几张照片 -->
    <section v-if="recentPhotos.length" class="shell page-top">
      <SectionFade class="flex items-end justify-between gap-6">
        <h2 class="text-[1.3rem]">最近拍的</h2>
        <RouterLink
          to="/gallery"
          class="rule-link shrink-0 text-[0.8rem] text-ink-soft hover:text-accent"
        >
          全部影像
        </RouterLink>
      </SectionFade>

      <div class="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <SectionFade
          v-for="(photo, i) in recentPhotos"
          :key="photo.src"
          as="div"
          :delay="i * 60"
        >
          <RouterLink to="/gallery" class="photo">
            <span class="photo__frame block" :style="{ aspectRatio: '1 / 1' }">
              <img
                class="photo__img"
                :src="photo.src"
                :alt="`${photo.albumName}：第 ${photo.index} 张`"
                loading="lazy"
                decoding="async"
              />
            </span>
          </RouterLink>
        </SectionFade>
      </div>
    </section>

    <!-- 一段自述，收尾 -->
    <section class="sheet page-top page-bottom">
      <SectionFade>
        <div class="dash-rule" />
        <p class="mt-8 max-w-[40rem] text-[0.95rem] leading-[2] text-ink-soft">
          白天在实验室里和时序数据打交道，晚上写点小东西。
          这个站点也是其中一件：前端是 Vue，构建完就是一包静态文件。
          想看更具体的，去
          <RouterLink to="/about" class="rule-link text-accent">关于</RouterLink>
          那一页。
        </p>
      </SectionFade>
    </section>
  </main>
</template>
