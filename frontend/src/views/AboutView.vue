<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'
import SectionFade from '@/components/SectionFade.vue'
import SkillTag from '@/components/SkillTag.vue'
import { assistantship, awards, education, papers, profile, skillGroups } from '@/data/resume'
import { projectsByDate } from '@/data/projects'
</script>

<template>
  <main class="sheet page-top page-bottom">
    <header>
      <h1 class="text-[1.8rem] leading-tight sm:text-[2rem]">关于</h1>
      <p class="mt-6 max-w-[40rem] text-[0.975rem] leading-[1.95] text-ink-soft">
        {{ profile.tagline }}
      </p>
      <p class="mt-4 max-w-[40rem] text-[0.975rem] leading-[1.95] text-ink-soft">
        研究之外，我把大部分时间花在写代码上：用 PyTorch 训练模型，用 FastAPI 把算法封装成在线服务，也用 Vue
        搭了这个网站。
      </p>
    </header>

    <!-- 做过的东西。原先独立的「项目」列表页并到了这里，见 ADR-0001。
         详情仍在各自的页面上，深链接不变。 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">做过的东西</h2>
      <div class="dash-rule mt-4" />

      <div class="mt-6 space-y-8">
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

          <h3 class="mt-3 text-[1.1rem] leading-[1.65]">{{ project.name }}</h3>

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
    </section>

    <!-- 教育背景 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">教育背景</h2>
      <div class="dash-rule mt-4" />
      <div class="mt-6 space-y-8">
        <SectionFade
          v-for="item in education"
          :key="item.school"
          as="article"
          class="grid gap-2 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6"
        >
          <p class="text-[0.75rem] leading-6 text-ink-soft sm:text-right">
            {{ item.period }}
          </p>
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

    <!-- 技术能力：四大类，一类一块 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">顺手会用的</h2>
      <div class="dash-rule mt-4" />
      <div class="mt-6 grid gap-6 sm:grid-cols-2">
        <SectionFade
          v-for="(group, i) in skillGroups"
          :key="group.title"
          as="article"
          :delay="i * 60"
          class="card p-5"
        >
          <h3 class="text-[1rem] leading-[1.6]">{{ group.title }}</h3>
          <p class="mt-2 text-[0.875rem] leading-[1.8] text-ink-soft">{{ group.summary }}</p>
          <ul class="mt-4 flex flex-wrap gap-2">
            <li v-for="tag in group.items" :key="tag">
              <SkillTag :label="tag" />
            </li>
          </ul>
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

    <!-- 其他 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">其他</h2>
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

    <p class="mt-10 text-[0.9rem] leading-[1.9] text-ink-soft">
      平时写的东西都放在
      <RouterLink to="/notes" class="rule-link text-accent">笔记</RouterLink>
      ，拍的照片在
      <RouterLink to="/gallery" class="rule-link text-accent">影像</RouterLink>
      。
    </p>
  </main>
</template>
