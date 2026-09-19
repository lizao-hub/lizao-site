<script setup lang="ts">
/**
 * 固定导航。左边「首页」回 `/`，右边三个去向：关于我 / 项目 / 影像。
 *
 * ⚠️ 这个文件是 2026-09-19 傍晚**按构建产物重建**的：原文件被一次误删带走，
 * 没进回收站（git rm / rm 是直接 unlink），VS Code 本地历史里只剩 9 月 14 日的
 * 旧版（那版还带着早已删掉的 PixelIcon 与 ThemeToggle，不能用）。
 * 依据是当天 16:08 的 `dist/assets/index-CLVRkYAK.js` 与 `index-ByAWI7oe.css`——
 * 类名、props、路由判断都原样留着，**注释留不住**，所以这里的注释是重建时补的。
 *
 * **不做窄屏适配**（全站约定）：没有汉堡菜单，也不做折叠。
 * 三个去向是写死的数组，不是从路由表里推的 —— 导航该是「选出来的几条路」，
 * 而不是「所有路由的目录」。
 */
import { RouterLink, useRoute } from 'vue-router'

const LINKS = [
  { label: '关于我', to: '/room' },
  { label: '项目', to: '/projects' },
  { label: '影像', to: '/gallery' },
]

const route = useRoute()

/**
 * 当前页判定要带上**子路径**：停在 `/projects/xxx` 时 `/projects` 也该是高亮的，
 * 否则从详情页往上看会发现自己「不在任何一栏里」。
 * `startsWith(to + '/')` 那个尾部斜杠是必须的 —— 不带的话 `/projectsxx`
 * 也会被当成 `/projects` 的子路径。
 */
function isCurrent(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <header class="nav-bar sticky top-0" :style="{ zIndex: 'var(--z-nav)' }">
    <nav aria-label="主导航" class="nav-wide flex items-center justify-between gap-4">
      <RouterLink to="/" class="nav-home">首页</RouterLink>

      <ul class="nav-links flex items-center gap-8">
        <li v-for="link in LINKS" :key="link.to" class="relative">
          <RouterLink :to="link.to" class="nav-link" :class="{ 'is-current': isCurrent(link.to) }">
            {{ link.label }}
          </RouterLink>
          <!-- 当前页底下那道短线。absolute 定位在 li 上，不占行高 -->
          <span
            v-if="isCurrent(link.to)"
            class="absolute -bottom-1 left-0 h-[2px] w-full bg-current"
            aria-hidden="true"
          />
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.nav-wide {
  /* 和舞台同宽（--stage-w），这是全站「一条线」的规矩 */
  width: min(100%, var(--stage-w));
  height: var(--nav-h);
  margin-inline: auto;
  padding-inline: clamp(1rem, 3vw, 2.5rem);
}

.nav-link,
.nav-home {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ink);
  transition: color 200ms linear;
}

.nav-link:hover,
.nav-link:focus-visible,
.nav-home:hover,
.nav-home:focus-visible {
  color: var(--accent);
}

/* 当前页反过来要**最不显眼**：它已经是答案了，再用强调色就是在喊 */
.nav-link.is-current {
  color: var(--ink);
}

.nav-links,
.nav-home {
  /* 导航是浮在景上的一层，默认不吃鼠标 —— 只有文字部分接 */
  pointer-events: auto;
}

.nav-home {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>
