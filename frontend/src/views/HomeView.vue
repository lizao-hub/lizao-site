<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import SceneStage from '@/components/SceneStage.vue'
import { lakeHint, lakeScene, resolveScene } from '@/data/scenes'
import { profile } from '@/data/resume'

/**
 * 首页：湖边。整站的门。
 *
 * 这一页没有正文 —— 三行字之外全是景。所以：
 * - 没有导航、没有页脚（见 round2 Q7），出口是点小木屋。
 * - 视觉上只有一个藏在景下面的 <h1>，给搜索引擎和读屏用（round2 Q8）。
 *   景里的三行字是气氛，不是标题；profile.name 是站名，两者不该混。
 *
 * 关于跳转：原稿是「整幅画淡出 + 米色遮罩，600ms 后 location.href」。
 * 这里保留同一套观感，但走**路由**跳转 —— 遮罩还是那层遮罩，
 * 只是 600ms 之后 router.push 而不是整页刷新，省掉一次白屏。
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
        <p class="intro__name">Hi, I'm LIzao</p>
        <p class="intro__meta">01 | 27届 | 数学</p>
        <p class="intro__murmur">你好吗请问我不是很好</p>
      </div>

      <!-- 机器读的标题。景里那三行是气氛，不该被当成 h1。 -->
      <h1 class="sr-only">{{ profile.name }} · {{ profile.role }}</h1>

      <p class="enter-hint">{{ lakeHint }}</p>
    </SceneStage>

    <div class="veil-scene" :class="{ 'is-on': veil }" aria-hidden="true" />
  </main>
</template>

<style scoped>
.intro {
  position: absolute;
  left: 50%;
  top: 6.5%;
  /* 向右半个字宽、向下半个文字块高，和原稿一致 */
  transform: translate(0, 50%);
  text-align: center;
  /* 暗色下天空还是亮的，黑字最清楚 —— 文案跟随景，不跟随主题 */
  color: #000;
  line-height: 1.9;
  pointer-events: none;
  animation: intro-in 1.2s ease both;
}

.intro__name {
  font-size: clamp(26px, 3.4vw, 54px);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.intro__meta {
  margin-top: 0.4em;
  font-size: clamp(11px, 1.15vw, 18px);
  letter-spacing: 0.16em;
}

.intro__murmur {
  margin-top: 0.5em;
  font-size: clamp(11px, 1.1vw, 17px);
  letter-spacing: 0.22em;
}

/* 小屋上方那句引导语。跟着小屋的中轴线走。 */
.enter-hint {
  position: absolute;
  left: 84.9%;
  top: 65.6%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: clamp(9px, 0.85vw, 13px);
  letter-spacing: 0.18em;
  color: #000;
  opacity: 0.8;
  pointer-events: none;
}

@keyframes intro-in {
  from {
    opacity: 0;
    transform: translate(0, calc(50% - 8px));
  }
  to {
    opacity: 1;
    transform: translate(0, 50%);
  }
}

/*
  竖屏手机：舞台按 16:9 铺满会变成一条两成高的窄带，
  文案缩到 13px 且挤在带子里。这里把舞台顶到上方，
  文案落到下面的空白区，字号按窄屏重新给。
  不裁切、不改比例 —— 裁切会把 left:80% 的小木屋整块切掉。
*/
@media (max-aspect-ratio: 1 / 1) {
  .intro {
    position: static;
    transform: none;
    padding: 2.25rem 1.5rem 0;
    animation: intro-in-flat 1.2s ease both;
  }

  .intro__name {
    font-size: 1.75rem;
  }
  .intro__meta,
  .intro__murmur {
    font-size: 0.8rem;
  }

  .enter-hint {
    position: static;
    transform: none;
    display: block;
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.75rem;
  }
}

@keyframes intro-in-flat {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
