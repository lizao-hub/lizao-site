<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import LineIcon from '@/components/LineIcon.vue'
import { profile } from '@/data/resume'

/**
 * 首页封面：四层视差。
 *
 * 各层用 data-speed 控制滚动时的上移速度，数值越大越「近」。
 * 位移量按视口高的百分比算（不是 yPercent，那是按层自身高度算的），
 * 并且 CSS 里的 overhang 必须 >= 最大 speed，否则滚动到底会露出黑边。
 * 见 main.css 的 .plx__layer 注释与 ADR-0007。
 *
 * 关于体积：gsap 只在首页动态引入，不进主包。
 * 首屏文案先渲染，动画是渐进增强，所以慢网络下也不会白屏。
 */

const root = ref<HTMLElement | null>(null)
/** 加载动画的初始隐藏态。gsap 就绪后由它接管，动画结束再撤掉这个标记。 */
const pending = ref(true)

/** 与 CSS 的 .plx__layer 保持一致的层定义 */
const LAYERS = [
  { name: 'sky', speed: 0.08 },
  { name: 'hill', speed: 0.22 },
  { name: 'tree', speed: 0.42 },
  { name: 'fore', speed: 0.70 },
] as const

let cleanup: (() => void) | null = null

onMounted(async () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    // 开了「减少动态效果」：直接显示最终态，连 gsap 都不下载
    pending.value = false
    return
  }

  let gsap: typeof import('gsap').gsap
  let ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
  try {
    const [core, st] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
    gsap = core.gsap ?? core.default
    ScrollTrigger = st.ScrollTrigger ?? st.default
    gsap.registerPlugin(ScrollTrigger)
  } catch {
    // 下载失败（断网等）也要让文案可见，不能留一片空白
    pending.value = false
    return
  }

  const el = root.value
  if (!el) return

  const ctx = gsap.context(() => {
    // ---- 加载动画：标题淡入上浮，副标题跟上 ----
    gsap.to(el.querySelectorAll('[data-fx="title"]'), {
      opacity: 1,
      y: 0,
      duration: 1.15,
      ease: 'power3.out',
      delay: 0.2,
      onComplete: () => {
        pending.value = false
      },
    })

    gsap.to(el.querySelectorAll('[data-fx="sub"]'), {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.5,
    })

    gsap.to(el.querySelectorAll('[data-fx="hint"]'), {
      opacity: 0.6,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 1.1,
    })

    // 各层极轻的一次「落地」，从略微放大回到正常
    gsap.from(el.querySelectorAll('.plx__layer'), {
      scale: 1.06,
      duration: 1.6,
      ease: 'power2.out',
      stagger: 0.06,
    })

    // ---- 视差主体 ----
    // y 用函数形式，窗口尺寸变化时能拿到新的 innerHeight。
    // invalidateOnRefresh 让 ScrollTrigger.refresh() 重算这个函数。
    for (const layer of LAYERS) {
      const node = el.querySelector(`[data-layer="${layer.name}"]`)
      if (!node) continue
      gsap.to(node, {
        y: () => -layer.speed * window.innerHeight,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
    }

    // 文案随滚动淡出上移，交接给正文
    gsap.to(el.querySelector('[data-fx="caption"]'), {
      opacity: 0,
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: '30% top',
        end: 'bottom bottom',
        scrub: true,
      },
    })
  }, el)

  cleanup = () => ctx.revert()
})

onBeforeUnmount(() => {
  cleanup?.()
  cleanup = null
})
</script>

<template>
  <section
    ref="root"
    class="plx"
    :class="{ 'is-pending': pending }"
    aria-label="首页封面"
  >
    <div class="plx__viewport">
      <!-- 四层，从远到近。占位图形见 main.css，换成真图见那里说明。 -->
      <div
        v-for="layer in LAYERS"
        :key="layer.name"
        class="plx__layer"
        :class="`plx__layer--${layer.name}`"
        :data-layer="layer.name"
        aria-hidden="true"
      />

      <!-- 封面里的文案。这张封面本身就是首屏，所以介绍要放在里面 -->
      <div class="plx__caption" data-fx="caption">
        <p class="plx__eyebrow" data-fx="title">{{ profile.role }}</p>
        <h1 class="plx__title" data-fx="title">{{ profile.name }}</h1>
        <p class="plx__sub" data-fx="sub">{{ profile.tagline }}</p>

        <div class="plx__actions" data-fx="sub">
          <RouterLink to="/notes" class="plx__btn plx__btn--primary">
            看看笔记
            <LineIcon name="arrow" :size="13" />
          </RouterLink>
          <RouterLink to="/about" class="plx__btn">关于我</RouterLink>
        </div>
      </div>

      <p class="plx__hint" data-fx="hint" aria-hidden="true">向下滚动</p>
    </div>
  </section>
</template>
