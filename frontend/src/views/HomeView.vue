<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionFade from '@/components/SectionFade.vue'
import SkillTag from '@/components/SkillTag.vue'
import PhotoTile from '@/components/PhotoTile.vue'
import LineIcon from '@/components/LineIcon.vue'
import { highlights, profile } from '@/data/resume'
import { projectsByDate } from '@/data/projects'
import { postsByDate } from '@/data/posts'
import { myPhotos } from '@/data/photos'

const heroPhoto = computed(() => myPhotos[0])
const recentPosts = computed(() => postsByDate.slice(0, 3))
</script>

<template>
  <main>
    <!-- 首屏：姓名、一句话定位、方向标签、两个入口，右侧一张真实照片。 -->
    <section class="hero border-b border-line">
      <div
        class="shell grid gap-6 py-8 sm:gap-12 sm:py-16 lg:grid-cols-[1.4fr_0.9fr] lg:items-center lg:gap-16"
      >
        <div>
          <p class="font-mono text-[0.72rem] tracking-[0.12em] text-accent">
            杭州师范大学 · 在读
          </p>

          <h1 class="mt-5 text-[2rem] leading-tight sm:text-[2.6rem]">{{ profile.name }}</h1>
          <!-- <p class="mt-4 text-[1.05rem] leading-relaxed text-ink sm:text-[1.15rem]">
            {{ profile.role }}
          </p> -->

          <p class="mt-4 max-w-[34rem] text-[0.95rem] leading-[1.9] text-ink-soft">
            {{ profile.tagline }}
          </p>

          <ul class="mt-7 flex flex-wrap gap-2">
            <li v-for="tag in profile.focus" :key="tag">
              <SkillTag :label="tag" />
            </li>
          </ul>

          <div class="mt-9 flex flex-wrap gap-4">
            <RouterLink to="/projects" class="btn btn--primary">
              查看项目
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

    <div class="page-bottom" />

    <!-- 数字摘要：全部能在简历里核对
    <section class="border-b border-line">
      <div class="shell grid gap-8 py-10 sm:grid-cols-3">
        <div v-for="item in highlights" :key="item.label" class="flex items-baseline gap-3">
          <p class="figure text-[1.4rem]">{{ item.value }}<span class="text-[0.85rem]">{{ item.unit }}</span></p>
          <p class="text-[0.85rem] leading-relaxed text-ink-soft">{{ item.label }}</p>
        </div>
      </div>
    </section> -->

    <!-- 精选项目：第一个项目跨两列，后面两个各占一列 -->
    <!-- <section class="shell page-top">
      <SectionFade>
        <h2 class="text-[1.3rem]">精选项目</h2>
      </SectionFade>

      <div class="mt-8 grid gap-6 md:grid-cols-2">
        <SectionFade
          v-for="(project, i) in projectsByDate"
          :key="project.slug"
          as="article"
          :delay="i * 70"
          :class="[
            'card flex flex-col p-6 transition-colors duration-200 hover:border-accent',
            i === 0 ? 'md:col-span-2' : '',
          ]"
        >
          <p class="font-mono text-[0.72rem] tracking-[0.04em] text-ink-soft">
            {{ project.period }} · {{ project.role }}
          </p>
          <h3 class="mt-3 text-[1.1rem] leading-[1.6]">{{ project.name }}</h3>
          <p class="mt-3 text-[0.9rem] leading-[1.85] text-ink-soft">{{ project.summary }}</p>

          <ul v-if="project.metrics" class="mt-5 flex flex-wrap gap-x-8 gap-y-4">
            <li v-for="metric in project.metrics" :key="metric.label">
              <p class="figure text-[1.05rem]">
                {{ metric.value }}<span v-if="metric.unit" class="text-[0.75rem]">{{ metric.unit }}</span>
              </p>
              <p class="mt-1.5 text-[0.75rem] text-ink-soft">{{ metric.label }}</p>
            </li>
          </ul>

          <ul class="mt-5 flex flex-wrap gap-2">
            <li v-for="tag in project.tags" :key="tag">
              <SkillTag :label="tag" />
            </li>
          </ul>

          <RouterLink
            :to="`/projects/${project.slug}`"
            class="mt-6 inline-flex items-center gap-2 self-start font-mono text-[0.78rem] text-accent"
          >
            查看详情
            <LineIcon name="arrow" :size="12" />
          </RouterLink>
        </SectionFade>
      </div>
    </section> -->

    <!-- 最近笔记 -->
    <!-- <section class="sheet page-top page-bottom">
      <SectionFade class="flex items-end justify-between gap-6">
        <h2 class="text-[1.3rem]">最近笔记</h2>
        <RouterLink
          to="/notes"
          class="rule-link shrink-0 font-mono text-[0.78rem] text-ink-soft hover:text-accent"
        >
          全部笔记
        </RouterLink>
      </SectionFade>

      <div class="mt-8 space-y-10">
        <SectionFade
          v-for="(post, i) in recentPosts"
          :key="post.slug"
          as="div"
          :delay="i * 70"
        >
          <RouterLink :to="`/notes/${post.slug}`" class="group block">
            <p class="font-mono text-[0.72rem] text-ink-soft">
              {{ post.tags.join(' / ') }}
            </p>
            <h3 class="mt-2 text-[1.05rem] leading-[1.7] text-ink transition-colors duration-200 group-hover:text-accent">
              {{ post.title }}
            </h3>
            <p class="mt-2 text-[0.9rem] leading-[1.85] text-ink-soft">{{ post.summary }}</p>
          </RouterLink>
        </SectionFade>
      </div>
    </section> -->
  </main>
</template>
