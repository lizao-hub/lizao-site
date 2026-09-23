<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import SceneStage from '@/components/SceneStage.vue'
import { RiMailLine, RiGithubLine } from '@remixicon/vue'
import face from '@/assets/lizao-face.webp'
import { resolveScene, roomScene, roomIntro, roomHint } from '@/data/scenes'
import { profile } from '@/data/profile'

/**
 * 屋里。整站的目录，也是「关于我」。
 *
 * 这一页**有页脚**（挂在 App.vue 的 RouterView 后面），所以舞台不能再是
 * fixed 铺满视口的整屏景 —— 那样页脚会被顶到屏幕外。它走 `flow`：
 * 回到文档流、自己占满一屏高、**景贴着导航下沿**（不再像湖边那样居中），
 * 页脚落在一屏下沿之外，往下滚一点点才见面。
 * 代价是这一页从此可以往下滚（湖边仍然不滚），景下面也留出一大条纸。
 *
 * 景与湖边一样是**完整的一张**，上下不裁。
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
    <SceneStage :scene="scene" nav-clearance flow @click.capture="onStageClick">
      <div class="intro" :style="{ left: `${roomIntro.left}%`, top: `${roomIntro.top}%` }">
        <p class="intro__name">
          LIzao<img class="intro__face" :src="face" alt="" />
        </p>

        <!-- <p class="intro__label">教育经历</p> -->
        <p class="intro__item">
          杭州师范大学<span class="intro__dot" aria-hidden="true">·</span>2024.09 — 至今
        </p>

        <!-- <p class="intro__label">竞赛获奖</p>
        <p class="intro__item">
          浙江省大学生电子设计竞赛<span class="intro__dot" aria-hidden="true">·</span>一等奖
        </p>
        <p class="intro__item">
          浙江省大学生智能汽车竞赛<span class="intro__dot" aria-hidden="true">·</span>三等奖
        </p>
        <p class="intro__item">
          全国大学生数学竞赛<span class="intro__dot" aria-hidden="true">·</span>二等奖
        </p> -->

        <!-- <p class="intro__label">其他</p>
        <p class="intro__item"> -->
          <!-- Python 程序设计基础课程<span class="intro__dot" aria-hidden="true">·</span>助教 -->
        <!-- </p> -->
        <p class="intro__meta">数学 × AI × 深度学习 × 全栈</p>

        <!--
          两个联系方式，**只有图标**、不写字，而且摆在整块字的最下面一行
        -->
        <div class="links">
          <a
            class="links__item"
            :href="`mailto:${profile.email}`"
            :aria-label="`发邮件到 ${profile.email}`"
            :title="profile.email"
          >
            <RiMailLine class="links__icon" />
          </a>

          <a
            class="links__item"
            :href="profile.github"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="profile.githubLabel"
            :title="profile.github"
          >
            <RiGithubLine class="links__icon" />
          </a>
        </div>
      </div>

      <!-- <h1 class="sr-only">我的房间和桌上的东西</h1> -->
      <p class="enter-hint">{{ roomHint }}</p>
    </SceneStage>

    <div class="veil-scene" :class="{ 'is-on': veil }" aria-hidden="true" />
  </main>
</template>

<style scoped>
/*
 * 这一页**没有自己的排版样式** —— 它是「一间屋子」，样子都在景里。
 */

/*
 * 墙上的字。字号阶梯、字距、行高、颜色、入场动效**全在 main.css 的 .intro
 * 里** —— 和湖边共用同一份，改观感去改那里（改一处两页一起动）。
 *
 * 位置由 roomIntro 给（见 data/scenes.ts），模板里作为内联 style 落在元素上；
 * roomIntro.left 就是墙面中轴，所以这里只需要把自己横向回退一半。
 */
.intro {
  --intro-shift-x: -50%;
}

/*
 * 名字后面那张小圆脸。
 *
 * **尺寸吃 em，不吃 px**：名字是 clamp(26px, 3.4×--scene-u, 54px)，脸要跟着
 * 一起缩放 —— 所以 1em 就是「跟名字的字号等大」，视口一变它自己跟上，
 * 不用写第二个 clamp。
 *
 * `vertical-align: -0.14em` 是算出来的，不是试出来的：默认 baseline 对齐会让
 * 1em 高的圆脸上沿高出字母的 cap height，看着像浮起来。**实测** Wotfard 的
 * cap height = 0.708em（用 canvas 的 `actualBoundingBoxAscent` 量的，
 * 二分法估不出来），cap 带的中轴因此落在 0.354em —— 想让圆心压在那儿，
 * 下沿要 -0.146em。取 -0.14em，差 0.006em（48px 上不到 0.3px）。
 * **改字号阶梯或换拉丁字体时要回头核这个数** —— 它跟字体度量绑在一起。
 *
 * margin-left 只有 0.18em：`.intro__name` 有 0.04em 的 letter-spacing，
 * 它会给最后一个字母后面也留一道，所以这里只要补剩下的差。
 *
 * 不参与交互：父层 .intro 已经是 pointer-events:none，这里不覆盖它，
 * 图片就点不动、也拖不走。它是画，不是链接。
 */
.intro__face {
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-left: 0.18em;
  vertical-align: -0.14em;
  user-select: none;
}

.links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  /* 两枚图标都到名字这一档尺寸了，间距得跟着放大，否则两条粗笔画挤在一起 */
  gap: 0 0.25em;
  /* 上一行 .intro__meta 自带 0.5em 的 margin-top，这里再补一点呼吸 */
  margin-top: 0.35em;
  font-size: clamp(26px, calc(3.4 * var(--scene-u)), 54px);
  /* 父层是 none，这里开回来 */
  pointer-events: auto;
}

.links__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.18em;
  margin-block: -0.18em;
  opacity: 0.8;
  transition: opacity 200ms ease;
}

.links__item:hover,
.links__item:focus-visible {
  opacity: 1;
}

.links__icon {
  width: 1em;
  height: 1em;
}

/*
 * 窄屏：两枚联系方式图标的最小可点范围。
 *
 * 图标走 1em（.links 的 clamp 下限 26px），加 0.18em 的 padding 只有约 35px，
 * 手指点不准。用一枚透明的 ::after 把可点范围外扩 0.18em（≈44px）——
 * **不动 padding**：padding 一改，两枚图标之间的实际间距（.links 的 gap
 * 是 0.25em，加上各自的 padding）就跟着变，那样改的是观感不是手感。
 * 外扩后两枚之间还剩约 6px 空隙，不会互相抢点击。
 */
@media (max-width: 640px) {
  .links__item {
    position: relative;
  }

  .links__item::after {
    content: '';
    position: absolute;
    inset: -0.18em;
  }
}

/*
 * 书桌上方那句引导语。只给位置 ——
 * 字号、字距、颜色、透明度、`nowrap` 与窄屏的覆盖都在 main.css 的
 * .enter-hint 里（和湖边共用一份，见 HomeView.vue 同一处的说明）。
 */
.enter-hint {
  left: 62.9%;
  top: 58.6%;
}

</style>
