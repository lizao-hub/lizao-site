<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import SceneStage from '@/components/SceneStage.vue'
import { lakeHint, lakeScene, resolveScene } from '@/data/scenes'
import { profile } from '@/data/profile'

/**
 * 首页：湖边。整站的门。
 *
 * 这一页没有正文 —— 三行字之外全是景。
 */

const router = useRouter()
const scene = computed(() => resolveScene(lakeScene))
const veil = ref(false)

let timer: number | undefined

/**
 * 拦下小木屋那一次点击。
 *
 * 为什么不在 SceneStage 里做过场：那个组件的职责是「把数据渲染成可点的景」，
 * 两个场景共用；过场是首页自己的事（从链接直接进屋里时不该淡出）。
 * 所以用一次捕获阶段的代理把它拦在这里。
 */
function onStageClick(event: MouseEvent) {
  const link = (event.target as HTMLElement | null)?.closest('a')
  if (!link || !link.getAttribute('href')?.startsWith('/room')) return

  event.preventDefault()
  event.stopPropagation()
  if (veil.value) return

  veil.value = true
  timer = window.setTimeout(() => router.push('/room'), 520)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <main class="scene-page">
    <!-- 景里的三行字。给眼睛看的，不是给机器看的。 -->
    <SceneStage :scene="scene" @click.capture="onStageClick">
      <div class="intro">
        <p class="intro__name">LIzao 的自留地</p>
        <p class="intro__meta">Hi, I'm LIzao</p>
        <p class="intro__meta">你还好吗请问我不是很好</p>
        <p class="intro__murmur">01 | 27届 | INTP</p>
        <!-- <p class="intro__murmur">XINGXING 一直都在</p> -->
      </div>

      <!-- 机器读的标题。景里那三行是气氛，不该被当成 h1。 -->
      <h1 class="sr-only">{{ profile.name }} · {{ profile.role }}</h1>

      <p class="enter-hint">{{ lakeHint }}</p>
    </SceneStage>

    <div class="veil-scene" :class="{ 'is-on': veil }" aria-hidden="true" />
  </main>
</template>

<style scoped>
/*
 * 这一页只决定这块字**放在哪儿**。
 *
 * 字号阶梯、字距、行高、颜色、以及那 1.2s 的淡入 + 落下，全都在 main.css
 * 的 `.intro` 里 —— 和屋里共用同一份。改观感去改那里（改一处两页一起动），
 * **别在这一页重抄一遍**：曾经两页各抄一份，字号漏改过一次，
 * 连 @keyframes 都同名打架。
 */
.intro {
  left: 50%;
  top: 6.5%;
  /* 往下挪半个文字块高，压在天空那片留白上。
     main.css 的 .intro 拿它拼 transform 和 keyframes —— 这里只给值。 */
  --intro-shift-y: 50%;
}

/* 小屋上方那句引导语。跟着小屋的中轴线走。 */
.enter-hint {
  position: absolute;
  left: 84.9%;
  top: 65.6%;
  transform: translateX(-50%);
  white-space: nowrap;
  /*
   * 字号按**舞台**走（--scene-u），和小屋上方那块字一个规矩。
   *
   * 系数从 0.85 提到 1：它原本是这块景里最小的一档，比屋里的分节标签
   * （0.9）还小 —— 但它是**全站唯一的入口提示**，小屋可点这件事只有这一句
   * 在说。功能性提示不该比装饰性的分节标签还轻。
   * 下限也从 9px 提到 11px：9px 在任何屏幕上都是糊的。
   *
   * 压在湖水上（底 L≈0.25），透明度给到 0.88 —— 黑字在这片水面上
   * 理论上约 4.9:1，实测会被抗锯齿再吃掉一点，留出余量。
   */
  font-size: clamp(11px, var(--scene-u), 15px);
  letter-spacing: 0.18em;
  color: var(--ink-black);
  opacity: 0.88;
  pointer-events: none;
}
</style>
