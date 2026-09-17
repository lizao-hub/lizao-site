<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'
import SectionFade from '@/components/SectionFade.vue'
import SkillTag from '@/components/SkillTag.vue'
import { projectsByDate } from '@/data/projects'
import { assistantship, awards, education, papers, profile } from '@/data/resume'

/**
 * 做过的项目。电脑上那扇门通向这里。
 *
 * 这一页在 ADR-0001 里曾被折进 /about，现在又独立出来（见 ADR-0009）：
 * 屋里那台电脑点开就该看到「做过的东西」，而不是一页简历。
 *
 * 清单后面挂了一段「其他」—— 学历 / 论文 / 比赛 / 助教。
 * 它们不是项目，但也没有别的地方可去：屋里只有三扇门，其中两扇
 * 通向影像和笔记，第三扇就是这里。放在同一页的尾部，是最近的归宿。
 */
</script>

<template>
  <main class="sheet page-top page-bottom">
    <header>
      <h1 class="text-[1.8rem] leading-tight sm:text-[2rem]">做过的东西</h1>
      <p class="mt-6 max-w-[40rem] text-[0.975rem] leading-[1.95] text-ink-soft">
        三个自己从头做完的项目。每一个都写下了做法，点开可以看细节。
      </p>
    </header>

    <div class="mt-12 space-y-6">
      <SectionFade
        v-for="(project, i) in projectsByDate"
        :key="project.slug"
        as="article"
        :delay="i * 70"
        class="card p-6"
      >
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p class="text-[0.75rem] text-ink-soft">{{ project.period }}</p>
          <p class="text-[0.75rem] text-accent">{{ project.role }}</p>
        </div>

        <h2 class="mt-3 text-[1.1rem] leading-[1.65]">{{ project.name }}</h2>

        <p class="mt-3 text-[0.925rem] leading-[1.85] text-ink-soft">{{ project.summary }}</p>

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
          class="mt-6 inline-flex items-center gap-2 text-[0.8rem] text-accent"
        >
          看看怎么做的
          <LineIcon name="arrow" :size="12" />
        </RouterLink>
      </SectionFade>
    </div>

    <!-- ------------------------------------------------------------------
         其他：学历、论文、比赛、助教。
         它们不是项目，但是同一个人的另一半记录。
         ------------------------------------------------------------------ -->
    <section class="mt-20">
      <h2 class="text-[1.2rem]">其他</h2>
      <div class="dash-rule mt-4" />

      <!-- 教育背景 -->
      <div class="mt-8 space-y-8">
        <SectionFade
          v-for="item in education"
          :key="item.school"
          as="article"
          class="grid gap-2 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6"
        >
          <p class="text-[0.75rem] leading-6 text-ink-soft sm:text-right">{{ item.period }}</p>
          <div>
            <h3 class="text-[1.02rem] leading-[1.7]">
              {{ item.school }}
              <span class="text-ink-soft">· {{ item.major }}</span>
            </h3>
            <p class="mt-1 text-[0.75rem] text-accent">{{ item.degree }}</p>
            <p class="mt-2 text-[0.9rem] leading-[1.85] text-ink-soft">{{ item.detail }}</p>
          </div>
        </SectionFade>
      </div>
    </section>

    <!-- 论文 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">写过的论文</h2>
      <div class="dash-rule mt-4" />
      <ul class="mt-6 space-y-6">
        <SectionFade v-for="paper in papers" :key="paper.title" as="li">
          <div class="flex flex-wrap items-center gap-3">
            <span class="badge">{{ paper.status }}</span>
            <span class="text-[0.75rem] text-ink-soft">{{ paper.venue }} · {{ paper.role }}</span>
          </div>
          <p class="mt-3 text-[0.925rem] leading-[1.8]">{{ paper.title }}</p>
        </SectionFade>
      </ul>
    </section>

    <!-- 获奖：一行一条，不展开 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">参加过的比赛</h2>
      <div class="dash-rule mt-4" />
      <ul class="mt-6 space-y-4">
        <SectionFade
          v-for="award in awards"
          :key="award.competition"
          as="li"
          class="grid gap-1 sm:grid-cols-[4.5rem_1fr_4rem] sm:items-baseline sm:gap-x-5"
        >
          <span class="text-[0.8rem] text-accent">{{ award.prize }}</span>
          <span class="text-[0.925rem] leading-[1.7]">{{ award.competition }}</span>
          <span class="text-[0.75rem] text-ink-soft sm:text-right">{{ award.date }}</span>
        </SectionFade>
      </ul>
    </section>

    <!-- 助教 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">带过的课</h2>
      <div class="dash-rule mt-4" />
      <div class="mt-6">
        <h3 class="text-[1rem]">
          {{ assistantship.role }}
          <span class="text-ink-soft">· {{ assistantship.org }}</span>
        </h3>
        <p class="mt-1 text-[0.75rem] text-ink-soft">{{ assistantship.period }}</p>
        <p class="mt-2 text-[0.9rem] leading-[1.85] text-ink-soft">{{ assistantship.detail }}</p>
      </div>
    </section>

    <div class="mt-14">
      <a :href="profile.github" target="_blank" rel="noopener noreferrer" class="btn">
        GitHub {{ profile.githubLabel }}
        <LineIcon name="external" :size="13" />
      </a>
    </div>
  </main>
</template>
