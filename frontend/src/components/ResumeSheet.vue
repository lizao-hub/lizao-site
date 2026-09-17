<script setup lang="ts">
import { computed } from 'vue'
import { awards, education, skillGroups } from '@/data/resume'

/**
 * 屋里那张纸：简历摘要。
 *
 * 位置在笔记本上方（用户指定），坐标是**相对舞台**的百分比，
 * 和场景图层用同一套参照系，所以缩窗口时不会跑位。
 *
 * 内容只取三类：教育背景 / 技术能力 / 竞赛获奖。
 * 论文和助教不在这里 —— 它们留在 /projects 的尾部，
 * 同一批数据不应该在两个页面各说一遍。
 *
 * 技术能力只列**组标题 + 一句概述**，不展开那 30 个标签：
 * 这是一张纸片，不是简历。细节去 /projects。
 */

const props = defineProps<{
  /** 相对舞台的定位，写在 scenes.ts 里 */
  left: number
  top: number
  width: number
}>()

/** 学历：一条一行，学校 · 专业 · 学位，右边跟时间 */
const degrees = computed(() => education)

/**
 * 技术能力只留**组标题**，不写概述、不展开标签。
 * 这节是全篇最长的（4 组），带上概述就会让纸片高到压住笔记本。
 * 每一项具体是什么去 /projects 看。
 */
const skills = computed(() => skillGroups.map((group) => group.title))

/** 竞赛：只留奖项与赛事名，时间跟在后面 */
const prizes = computed(() =>
  awards.map((award) => ({
    prize: award.prize,
    competition: award.competition,
    date: award.date,
  })),
)
</script>

<template>
  <aside
    class="resume-sheet"
    :style="{
      left: `${props.left}%`,
      top: `${props.top}%`,
      width: `${props.width}%`,
    }"
    aria-label="简历摘要：教育背景、技术能力、竞赛获奖"
  >
    <!-- 教育背景 -->
    <section>
      <h2 class="sheet__title">教育背景</h2>
      <ul class="mt-1.5 space-y-0.5">
        <li v-for="item in degrees" :key="item.school" class="sheet__row">
          <span class="sheet__strong">{{ item.school }}</span>
          <span class="sheet__dim">{{ item.major }} · {{ item.degree }}</span>
          <span class="sheet__date">{{ item.period }}</span>
        </li>
      </ul>
    </section>

    <!-- 技术能力：只列组标题 -->
    <section class="mt-3">
      <h2 class="sheet__title">技术能力</h2>
      <p class="sheet__dim mt-1.5">{{ skills.join(' · ') }}</p>
    </section>

    <!-- 竞赛获奖 -->
    <section class="mt-3">
      <h2 class="sheet__title">竞赛获奖</h2>
      <ul class="mt-1.5 space-y-0.5">
        <li v-for="prize in prizes" :key="prize.competition" class="sheet__row">
          <span class="sheet__strong">{{ prize.prize }}</span>
          <span class="sheet__dim">{{ prize.competition }}</span>
          <span class="sheet__date">{{ prize.date }}</span>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
/*
 * 一张压在景上的纸。
 *
 * 关键约束：它必须**可读**。场景是米白水彩，纸片用接近不透明的纸色底 +
 * 极轻的偏移（不用模糊投影，见 ADR-0002），保证小字也清楚。
 *
 * 纸片本身不接鼠标（pointer-events: none），只有里面的链接接 ——
 * 否则它会挡住下面笔记本的可点区域。
 */
.resume-sheet {
  position: absolute;
  z-index: 4;
  max-height: 62%;
  overflow: auto;
  padding: 0.95rem 1.15rem;
  border: 1px solid var(--scene-wood);
  border-radius: 10px 7px 12px 8px / 8px 12px 7px 11px;
  /* 色块偏移，不是模糊投影 */
  box-shadow: 3px 3px 0 var(--scene-paper-veil);
  background: color-mix(in srgb, var(--scene-paper-warm) 93%, transparent);
  color: var(--scene-ink);
  font-size: clamp(10px, 0.78vw, 13.5px);
  line-height: 1.75;
  letter-spacing: 0.02em;
  /* 自身不接鼠标，免得挡住下面的电脑 */
  pointer-events: none;
}

/* 内容太长时可以滚，滚动条要细一些，别破坏纸感 */
.resume-sheet {
  scrollbar-width: thin;
}

.sheet__title {
  font-size: 0.82em;
  font-weight: 600;
  letter-spacing: 0.28em;
  color: var(--scene-wood);
}

.sheet__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.5em;
  align-items: baseline;
}

.sheet__strong {
  font-weight: 600;
}

.sheet__dim {
  color: var(--scene-ink-soft);
}

.sheet__date {
  margin-left: auto;
  white-space: nowrap;
  color: var(--scene-ink-soft);
  font-variant-numeric: tabular-nums;
}

/*
  竖屏：舞台顶部对齐、高度按比例算，纸片用百分比定位会挤在一条窄带里。
  这里改成把摘要放到舞台**下面**的正常流里，和首页的文案同样的处理。
*/
@media (max-aspect-ratio: 1 / 1) {
  .resume-sheet {
    position: static;
    width: auto;
    max-height: none;
    margin: 0 1.25rem;
  }
}

/* 太窄的窗口里三列（内容 / 概述 / 日期）挤在一起，日期换行 */
@media (max-width: 40rem) {
  .sheet__date {
    margin-left: 0;
  }
}
</style>
