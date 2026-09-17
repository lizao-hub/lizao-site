<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import SceneStage from '@/components/SceneStage.vue'
import { resolveScene, roomHint, roomScene } from '@/data/scenes'

/**
 * 屋里。整站的目录。
 *
 * 这一页就是「关于我」：你正站在我的房间里，桌上的东西就是站点的全部内容。
 * 所以它不需要额外放一段自我介绍 —— 三扇门加一句提示就够了。
 * 详细的学历 / 论文 / 比赛在 /projects 的尾部，那里是它们的自然归宿。
 *
 * 同首页：没有导航和页脚，出口是左下角的「回到湖边」。
 */

const router = useRouter()
const scene = computed(() => resolveScene(roomScene))
const veil = ref(false)

let timer: number | undefined

/**
 * 点任意物件：整幅淡出 + 纸色遮罩，然后跳转。
 * 和首页同一套过场。
 */
function onStageClick(event: MouseEvent) {
  const link = (event.target as HTMLElement | null)?.closest('a')
  const href = link?.getAttribute('href')
  if (!href || !href.startsWith('/')) return

  event.preventDefault()
  event.stopPropagation()
  if (veil.value) return

  veil.value = true
  timer = window.setTimeout(() => router.push(href), 560)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <main class="scene-page">
    <SceneStage :scene="scene" :hint="roomHint" @click.capture="onStageClick">
      <!-- 进屋时的一点落地感。原稿的 room-in 动画。 -->
      <h1 class="sr-only">屋里 · 我的房间和桌上的东西</h1>
    </SceneStage>

    <RouterLink to="/" class="back">← 回到湖边</RouterLink>

    <div class="veil-scene" :class="{ 'is-on': veil }" aria-hidden="true" />
  </main>
</template>

<style scoped>
main {
  animation: room-in 1s ease both;
}

@keyframes room-in {
  from {
    opacity: 0;
    transform: scale(1.012);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* 「回到湖边」。固定左下角，两种视口下都好按。 */
.back {
  position: fixed;
  left: clamp(14px, 2.2vw, 34px);
  bottom: clamp(14px, 2.2vw, 30px);
  z-index: 20;
  padding: 0.62em 1.7em;
  border: 1px solid var(--scene-wood);
  border-radius: 999px;
  color: var(--scene-wood);
  background: var(--scene-paper-veil);
  text-decoration: none;
  font-size: clamp(11px, 0.95vw, 15px);
  letter-spacing: 0.24em;
  text-indent: 0.24em;
  transition:
    background-color 300ms ease,
    color 300ms ease,
    transform 300ms ease;
}

.back:hover,
.back:focus-visible {
  background: var(--scene-wood);
  color: var(--scene-paper-warm);
  transform: translateY(-2px);
  outline: none;
}

/* 竖屏：舞台在上方，链接落到舞台下面的空白里，不再固定 */
@media (max-aspect-ratio: 1 / 1) {
  .back {
    position: static;
    display: inline-block;
    margin: 1.75rem 0 0 1.25rem;
  }
}
</style>
