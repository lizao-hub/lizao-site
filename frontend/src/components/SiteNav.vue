<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'

const route = useRoute()
const open = ref(false)

/**
 * 主导航。
 *
 * 现在的形态：**透明**，白字加粗带阴影，压在页面背景上。
 * 屋里那幅插画衬底时这样最好看；其余内容页目前是米白纸底，
 * 白字在纸底上并不清楚 —— **这是已知的、待处理的状态**：
 * 内容页的背景后续会改（用户已确认），改完白字就站得住了。
 *
 * 曾经有过的东西，都已按要求删掉：
 * - 站名字标（Wordmark）
 * - 明暗主题切换按钮（ThemeToggle）
 * - GitHub 外链（桌面版与手机菜单两处）
 */

/**
 * 导航链接。只放**能从屋里走到、且真的能读**的页面。
 *
 * 湖边（`/`）不在里面：它是场景，整页没有导航（见 ADR-0009）。
 */
const links = [
  { label: '首页', to: '/' },
  { label: '项目', to: '/projects' },
  { label: '笔记', to: '/notes' },
  { label: '影像', to: '/gallery' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch(() => route.fullPath, () => {
  open.value = false
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!--
    整条导航透明：无底色、无边框、无毛玻璃，只有一层极淡的纸色渐变压在顶部。
    渐变是为了压住插画最上沿的细节，让文字有个干净的落点；
    它是「从纸色到全透」的，所以不构成一条实心横条。
  -->
  <header class="nav--over-scene sticky top-0" :style="{ zIndex: 'var(--z-nav)' }">
    <!--
      宽度：单独给导航用更宽的一条（90rem / 1440px），
      不动全站共用的 .shell（68rem）—— 那个决定了长文的阅读宽度。
    -->
    <nav
      aria-label="主导航"
      class="nav-wide flex h-16 items-center justify-end gap-4"
    >
      <ul class="hidden items-center gap-8 md:flex">
        <li v-for="link in links" :key="link.to" class="relative">
          <RouterLink
            :to="link.to"
            class="nav-link"
            :class="isActive(link.to) && 'is-current'"
          >
            {{ link.label }}
          </RouterLink>
          <span
            v-if="isActive(link.to)"
            class="absolute -bottom-1 left-0 h-[2px] w-full bg-current"
            aria-hidden="true"
          />
        </li>
      </ul>

      <button
        type="button"
        class="nav-menu-btn flex md:hidden"
        :aria-label="open ? '关闭菜单' : '打开菜单'"
        :aria-expanded="open"
        aria-controls="mobile-nav"
        @click="open = !open"
      >
        <LineIcon :name="open ? 'close' : 'menu'" :size="14" />
      </button>
    </nav>

    <div v-if="open" id="mobile-nav" class="nav--over-scene absolute inset-x-0 top-16 md:hidden">
      <ul class="nav-wide flex flex-col pb-2">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="nav-link block py-3.5"
            :class="isActive(link.to) && 'is-current'"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped>
/*
 * 导航文字：白色、加粗、带阴影。
 *
 * 阴影不是装饰 —— 它让白字能落在深浅不一的插画上。
 * 用两层：一层紧贴字形的暗影保证轮廓，一层大范围的柔光让字浮起来。
 * （ADR-0002 禁止的是「模糊投影做立体感」，这里是为了可读性的文字阴影，
 *   不是同一回事。）
 *
 * 悬停与当前项：换成 accent 的浅色 + 下划线，不用降低不透明度 ——
 * 白字降透明度之后在浅背景上会直接失踪。
 */
.nav-link {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.55),
    0 2px 14px rgba(0, 0, 0, 0.35);
  transition: color 200ms linear;
}

.nav-link:hover,
.nav-link:focus-visible {
  color: var(--accent-soft);
}

/* 当前项：白字 + 下划线，保持和悬停同一套颜色逻辑 */
.nav-link.is-current {
  color: #fff;
}

/*
 * 手机菜单按钮。
 *
 * ⚠️ 这里**不要写 display**。
 * 模板上是 `class="nav-menu-btn md:hidden"`，靠 Tailwind 的 md:hidden 控制显隐：
 * .md\:hidden 与 .nav-menu-btn[data-v-xxx] 权重相同（都是 0,1,0），
 * 而 scoped 样式在产物里排在 Tailwind 之后 —— 这里一旦写 display:flex，
 * 它就会在每个宽度下都赢掉 md:hidden，按钮在桌面上也一直显出来。
 * 居中用 align/justify，尺寸用 width/height，显隐交给 Tailwind。
 */
.nav-menu-btn {
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2.25rem;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 10px 7px 11px 8px / 8px 11px 7px 10px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

/* 但 align/justify 只在 display:flex 下生效，所以窄屏（按钮该出现时）
   还得用 Tailwind 的 flex。模板上是 `flex md:hidden`。 */

/* 键盘焦点：白描边在浅背景上很弱，用 accent 更醒目 */
.nav-menu-btn:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

/*
 * 导航的横向宽度。
 * 比全站的 .shell（68rem）宽，让两端更靠近屏幕边缘。
 * 用 padding 而不是 max-w + mx-auto，这样宽屏上不会出现两条空白。
 */
.nav-wide {
  margin-inline: auto;
  width: 100%;
  max-width: 90rem;
  padding-inline: clamp(1rem, 3vw, 2.5rem);
}
</style>
