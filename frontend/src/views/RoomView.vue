<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import SceneStage from '@/components/SceneStage.vue'
import ResumeSheet from '@/components/ResumeSheet.vue'
import { resolveScene, roomScene, roomSheet } from '@/data/scenes'

/**
 * 屋里。整站的目录，也是「关于我」。
 *
 * 你正站在我的房间里，桌上的东西就是站点的全部内容：
 * 电脑 → 做过的项目、相机 → 拍下的照片、竖排书 → 笔记。
 *
 * 墙上那张纸片是简历摘要（教育 / 技术能力 / 竞赛），
 * 位置在笔记本上方，由 roomSheet 给坐标。
 * 详细的论文与助教在 /projects 尾部。
 *
 * 这一页**有导航**（透明浮在景上，见 App.vue），
 * 因为从搜索引擎直接落到这里的人需要一个出口。
 * 没有页脚：页脚会把 100vh 的舞台顶下去。
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
    <SceneStage :scene="scene" @click.capture="onStageClick">
      <!-- 墙上的简历摘要。位置是临时的，后续还要调。 -->
      <ResumeSheet
        :left="roomSheet.left"
        :top="roomSheet.top"
        :width="roomSheet.width"
      />

      <h1 class="sr-only">屋里 · 我的房间和桌上的东西</h1>
    </SceneStage>

    <!-- 「回到湖边」按钮已按要求去掉。 -->

    <div class="veil-scene" :class="{ 'is-on': veil }" aria-hidden="true" />
  </main>
</template>

<style scoped>
/*
 * 这一页不再有自己的样式。
 *
 * 曾经在这里挂「进屋」的入场动画，但它把场景推出屏幕了：
 * room-in 里有 transform，而任何非 none 的 transform 都会让元素
 * 变成 position:fixed 后代的包含块。main 的子元素全是 fixed，
 * 自身高度是 0 —— 于是 .stage-wrap 的 inset:0 按 0 高度解析，
 * 舞台被推到屏幕外（实测 y:-405，正好是舞台高的一半）。
 *
 * 现在入场动画由 SceneStage 的 .stage 自己承担（scene-in），
 * main 保持无 transform。改这一页时记住这条：
 * **不要给 main 或任何祖先加 transform / filter / perspective。**
 */
</style>
