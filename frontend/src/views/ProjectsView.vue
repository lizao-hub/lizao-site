<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PixelIcon from '@/components/PixelIcon.vue'
import SectionFade from '@/components/SectionFade.vue'
import SkillTag from '@/components/SkillTag.vue'
import { projectsByDate } from '@/data/projects'
</script>

<template>
  <main class="sheet page-top page-bottom">
    <header>
      <h1 class="text-[1.8rem] leading-tight sm:text-[2rem]">项目</h1>
      <p class="mt-5 max-w-[40rem] text-[0.95rem] leading-[1.9] text-ink-soft">
        三个项目的完整介绍：一个算法研究，一个智能体应用，一个实时分析系统。按结束时间从新到旧。
      </p>
    </header>

    <div class="mt-12">
      <SectionFade
        v-for="(project, i) in projectsByDate"
        :key="project.slug"
        as="article"
        :delay="i * 70"
        class="border-t-2 border-line py-9 first:border-t-0 first:pt-0"
      >
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p class="font-mono text-[0.75rem] text-ink-soft">{{ project.period }}</p>
          <p class="font-mono text-[0.75rem] text-accent">{{ project.role }}</p>
        </div>

        <h2 class="mt-3 text-[1.2rem] leading-[1.6]">
          <RouterLink :to="`/projects/${project.slug}`" class="rule-link text-ink">
            {{ project.name }}
          </RouterLink>
        </h2>

        <p class="mt-3 text-[0.925rem] leading-[1.85] text-ink-soft">{{ project.summary }}</p>

        <ul v-if="project.metrics" class="mt-5 flex flex-wrap gap-x-8 gap-y-4">
          <li v-for="metric in project.metrics" :key="metric.label">
            <p class="pixel-num text-[1.05rem]">
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
          class="mt-6 inline-flex items-center gap-2 font-mono text-[0.78rem] text-accent"
        >
          查看详情
          <PixelIcon name="arrow" :size="12" />
        </RouterLink>
      </SectionFade>
    </div>
  </main>
</template>
