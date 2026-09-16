<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'
import NoteCover from '@/components/NoteCover.vue'
import type { Post } from '@/types/post'
import { statsOf } from '@/data/postStats'
import { publishedAt } from '@/utils/date'

/**
 * 一条笔记的卡片：封面 + 文字，左右各占一半。
 *
 * 交替排布由父级传进来的 flip 决定。这里用 grid 的 order 换位置，
 * 而不是把 DOM 顺序反过来：读屏和 Tab 顺序永远是「先标题后图片」，
 * 视觉上的左右只是排版。
 *
 * 窄屏一律塌成单列，图在上、文在下。
 */
const props = withDefaults(
  defineProps<{
    post: Post
    /** true 表示图在右、文在左（奇数条用） */
    flip?: boolean
    /** 首屏前两条的封面用 eager */
    eager?: boolean
  }>(),
  { flip: false, eager: false },
)

const stats = computed(() => statsOf(props.post.slug))

/** 数字过千折成 1.2k，卡片上是扫一眼的密度，不需要精确到个位 */
function compact(n: number): string {
  if (n < 1000) return String(n)
  const k = n / 1000
  return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`
}
</script>

<template>
  <article class="note-card" :class="flip && 'note-card--flip'">
    <!-- 封面：一半宽 -->
    <div class="note-card__media">
      <NoteCover :src="post.cover" :alt="`${post.title} 的封面`" :eager="eager" />
    </div>

    <!-- 文字：另一半 -->
    <div class="note-card__body">
      <p class="note-card__meta">
        <LineIcon name="clock" :size="12" />
        <span>{{ publishedAt(post.date) }}</span>
      </p>

      <h2 class="note-card__title">
        <RouterLink :to="`/notes/${post.slug}`" class="note-card__link">
          <LineIcon name="pin" :size="13" class="note-card__pin" />
          <span class="note-card__title-text">{{ post.title }}</span>
        </RouterLink>
      </h2>

      <ul class="note-card__stats">
        <li>
          <LineIcon name="flame" :size="12" />
          <span class="note-card__stat-n">{{ compact(stats.heat) }}</span>
          <span class="note-card__stat-label">热度</span>
        </li>
        <li>
          <LineIcon name="comment" :size="12" />
          <span class="note-card__stat-n">{{ compact(stats.comments) }}</span>
          <span class="note-card__stat-label">评论</span>
        </li>
        <li>
          <LineIcon name="thumb" :size="12" />
          <span class="note-card__stat-n">{{ compact(stats.likes) }}</span>
          <span class="note-card__stat-label">点赞</span>
        </li>
      </ul>

      <p class="note-card__summary">{{ post.summary }}</p>

      <ul class="note-card__tags">
        <li v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
/* 网格负责左右两半。窄屏单列，两侧都是 1fr，视觉上五五分。 */
.note-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .note-card {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: stretch;
  }

  /* 图在右：只换视觉顺序，DOM 顺序不动 */
  .note-card--flip .note-card__media {
    order: 2;
  }
  .note-card--flip .note-card__body {
    order: 1;
  }
}

.note-card__media {
  min-width: 0;
}

.note-card__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  justify-content: center;
}

/* --- 发布行 --- */
.note-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}

/* --- 标题：单行省略 --- */
.note-card__title {
  margin-top: 0.7rem;
  /* 标题字体是霞鹜文楷 Light，合成加粗会糊掉，跟着 main.css 走 300 */
  font-size: 1.08rem;
  font-weight: 300;
  line-height: 1.6;
  min-width: 0;
}

.note-card__link {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  color: var(--ink);
  min-width: 0;
  transition: color 200ms linear;
}

.note-card__pin {
  align-self: center;
  color: var(--accent);
}

.note-card__title-text {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note-card__link:hover .note-card__title-text,
.note-card__link:focus-visible .note-card__title-text {
  color: var(--accent);
}

/* --- 数据行：三个数字，等宽 --- */
.note-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 1.1rem;
  margin-top: 0.75rem;
  font-size: 0.72rem;
  color: var(--ink-soft);
}

.note-card__stats > li {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
}

.note-card__stat-n {
  color: var(--ink);
}

.note-card__stat-label {
  opacity: 0.75;
}

/* --- 简介：最多三行 --- */
.note-card__summary {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.85;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

/* --- 标签 --- */
.note-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
