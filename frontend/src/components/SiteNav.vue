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
 * **不做汉堡菜单**（这条没变）：这些去向是写死的数组，不是从路由表里推的 ——
 * 导航该是「选出来的几条路」，而不是「所有路由的目录」。窄屏也不折叠：
 * 五个词排得下（2026-09-23 加上「留言」后重测：375px 上导航的自然宽 239px、
 * 可用 335px，**余 96px**；就算收到 320px 也还剩 41px）。
 * 折进一个按钮里反而是把唯一的去向藏起来。窄屏只做两件事：收紧间距、
 * 把可点范围托到 44px（见样式末尾那段）。
 */
import { RouterLink, useRoute } from 'vue-router'

const LINKS = [
  { label: '关于我', to: '/room' },
  { label: '项目', to: '/projects' },
  { label: '影像', to: '/gallery' },
  { label: '留言', to: '/guestbook' },
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

/* ------------------------------------------------------------------
   手机：收紧间距 + 把可点范围托到 44px

   两个字 / 三个字的链接，文字本身只有 32×18 —— 手指按不准（WCAG 2.5.5
   建议 44×44）。这里**不改 padding 也不改字号**：padding 会把两个链接
   之间的实际间距一起改掉，那动的是观感；字号在 main.css 那一档里。
   只把盒子的最小高度提到 44px、让它自己居中，文字还在原来的位置上。

   代价是「当前页底下那道短线」跟着盒子长高了（它挂在 li 上、定位在
   li 的下沿），所以要把它收回来贴在字的下面 —— 0.45rem 是按
   「字高 18px 居中于 44px」算的：字底落在 31px，线再往下 4px。

   横向只收间距（gap-8 → 1rem）：加「留言」之后这是第五个词，
   实测自然宽 239px，可用 335px，宽得很；收只是为了留出余量，不是掠挤。
   ------------------------------------------------------------------ */
@media (max-width: 640px) {
  .nav-wide {
    padding-inline: 1.25rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .nav-link,
  .nav-home {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }

  /*
    横向：文字只有 32px 宽，用一枚透明的 ::after 各往外扩 0.375rem（6px）
    凑到 44px。**不动 padding** —— padding 会把 li 一起撑宽，当前页那道
    短线（`w-full`）就跟着变长，而它是贴着字宽画的。
    两项之间的空档仍有 20−12 = 8px，不会互相抢点击。
  */
  .nav-link,
  .nav-home {
    position: relative;
  }

  .nav-link::after,
  .nav-home::after {
    content: '';
    position: absolute;
    inset: 0 -0.375rem;
  }

  .nav-links span {
    bottom: 0.45rem;
  }
}
</style>
