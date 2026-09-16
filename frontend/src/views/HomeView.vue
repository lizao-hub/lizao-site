<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ParallaxCover from '@/components/ParallaxCover.vue'
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
    <!-- 封面。四层视差，文案在封面里（它本身就是首屏）。见 ADR-0007。 -->
    <ParallaxCover />

    <!-- 自述。头像从旧首屏移到这里，让封面先发生 -->
    <section class="shell page-top">
      <div class="grid gap-8 sm:grid-cols-[1fr_10rem] sm:items-start sm:gap-10">
        <SectionFade>
          <h2 class="text-[1.3rem]">你好</h2>
          <p class="mt-4 max-w-[34rem] text-[0.95rem] leading-[2] text-ink-soft">
            {{ profile.tagline }}
          </p>
          <p class="mt-4 max-w-[34rem] text-[0.95rem] leading-[2] text-ink-soft">
            这里是自留地。放写过的代码、拍过的照片，和一些顺手记下来的东西。
          </p>

          <ul class="mt-6 flex flex-wrap gap-2">
            <li v-for="tag in profile.focus" :key="tag">
              <SkillTag :label="tag" />
            </li>
          </ul>

          <div class="mt-8 flex flex-wrap gap-4">
            <RouterLink to="/notes" class="btn btn--primary">
              看看笔记
              <LineIcon name="arrow" :size="13" />
            </RouterLink>
            <RouterLink to="/about" class="btn">关于我</RouterLink>
          </div>
        </SectionFade>

        <SectionFade v-if="heroPhoto" :delay="80">
          <span class="portrait-frame" :style="{ aspectRatio: '4 / 5' }">
            <img
              :src="heroPhoto.src"
              :alt="`${heroPhoto.albumName}：第 ${heroPhoto.index} 张`"
              loading="lazy"
              decoding="async"
            />
          </span>
        </SectionFade>
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
