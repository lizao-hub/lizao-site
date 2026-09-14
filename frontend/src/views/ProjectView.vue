<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PixelIcon from '@/components/PixelIcon.vue'
import SkillTag from '@/components/SkillTag.vue'
import { findProject, projectNeighbours } from '@/data/projects'
import { profile } from '@/data/resume'

const route = useRoute()

const project = computed(() => findProject(String(route.params.slug)))
const neighbours = computed(() => projectNeighbours(String(route.params.slug)))

watchEffect(() => {
  document.title = project.value ? `${project.value.name} | ${profile.name}` : `${profile.name}`
})
</script>

<template>
  <main class="sheet page-top page-bottom">
    <RouterLink
      to="/projects"
      class="rule-link inline-flex items-center gap-2 font-mono text-[0.78rem] text-ink-soft hover:text-ink"
    >
      <PixelIcon name="left" :size="12" />
      项目
    </RouterLink>

    <template v-if="project">
      <header class="mt-8">
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p class="font-mono text-[0.75rem] text-ink-soft">{{ project.period }}</p>
          <p class="font-mono text-[0.75rem] text-accent">{{ project.role }}</p>
        </div>

        <h1 class="mt-4 text-[1.6rem] leading-[1.5] sm:text-[1.9rem]">{{ project.name }}</h1>

        <p class="mt-5 text-[0.975rem] leading-[1.9] text-ink-soft">{{ project.summary }}</p>

        <ul class="mt-6 flex flex-wrap gap-2">
          <li v-for="tag in project.tags" :key="tag">
            <SkillTag :label="tag" />
          </li>
        </ul>
      </header>

      <!-- 量化结果单独一行，这是招聘方最先看的部分 -->
      <section v-if="project.metrics" class="mt-10 border-2 border-line bg-surface p-6">
        <ul class="grid gap-6 sm:grid-cols-3">
          <li v-for="metric in project.metrics" :key="metric.label">
            <p class="pixel-num text-[1.35rem]">
              {{ metric.value }}<span v-if="metric.unit" class="text-[0.9rem]">{{ metric.unit }}</span>
            </p>
            <p class="mt-2 text-[0.8rem] text-ink-soft">{{ metric.label }}</p>
          </li>
        </ul>
      </section>

      <section class="mt-12">
        <h2 class="text-[1.2rem]">做了什么</h2>
        <div class="pixel-rule mt-4" />
        <ul class="mt-6 space-y-5">
          <li
            v-for="item in project.highlights"
            :key="item"
            class="flex gap-3 text-[0.95rem] leading-[1.9]"
          >
            <PixelIcon name="dot" :size="12" class="mt-[0.6rem] text-accent" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </section>

      <div v-if="project.href" class="mt-12">
        <a :href="project.href" target="_blank" rel="noopener noreferrer" class="pixel-btn">
          {{ project.hrefLabel ?? '代码仓库' }}
          <PixelIcon name="external" :size="13" />
        </a>
      </div>

      <nav class="mt-16 border-t-2 border-line pt-6" aria-label="项目切换">
        <ul class="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <li v-if="neighbours.prev">
            <RouterLink
              :to="`/projects/${neighbours.prev.slug}`"
              class="group inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors duration-150 ease-pixel hover:text-accent"
            >
              <PixelIcon name="left" :size="12" />
              更新：{{ neighbours.prev.name }}
            </RouterLink>
          </li>
          <li v-if="neighbours.next" class="sm:text-right">
            <RouterLink
              :to="`/projects/${neighbours.next.slug}`"
              class="group inline-flex items-center gap-2 text-[0.85rem] text-ink-soft transition-colors duration-150 ease-pixel hover:text-accent"
            >
              更早：{{ neighbours.next.name }}
              <PixelIcon name="right" :size="12" />
            </RouterLink>
          </li>
        </ul>
      </nav>
    </template>

    <div v-else class="mt-10">
      <p class="text-ink-soft">找不到这个项目。</p>
      <RouterLink to="/projects" class="pixel-btn mt-6">返回项目列表</RouterLink>
    </div>
  </main>
</template>
