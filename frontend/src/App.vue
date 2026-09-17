<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SketchDefs from '@/components/SketchDefs.vue'

const route = useRoute()

/**
 * 场景页自己就是整个页面：100vh 不滚动、没有正文。
 * 给它们加导航和页脚会把景压成一块装饰（见 ADR-0009）。
 *
 * 现在只有湖边是这种页 —— 它没有任何正文，也没有导航，
 * 出口是点小木屋。
 *
 * 屋里（/room）不一样：它同时是「关于我」，所以**有**导航，
 * 但导航要透明浮在景上，而且不要纸感噪点、不要页脚
 * （页脚会把 100vh 的舞台顶下去）。
 */
const isScene = computed(() => route.meta.scene === true)

/** 屋里：导航压在插画上，去掉底色和边框，不能把天空切一道。 */
const isRoom = computed(() => route.name === 'room')

/**
 * 纸感噪点与页脚：两者都只给普通内容页。
 *
 * 景上不叠噪点（水彩叠噪点会脏），也不给页脚 ——
 * 舞台是 100vh 且 fixed，页脚会被顶到屏幕外，白占一个节点。
 * 两个场景页都不满足这个条件。
 */
const hasChrome = computed(() => !isScene.value && !isRoom.value)
</script>

<template>
  <!-- 手绘滤镜与可复用路径，全站挂一次 -->
  <SketchDefs />

  <!-- 纸感噪点铺在最底层，整站共用。景上不叠：水彩叠噪点会脏 -->
  <div
    v-if="hasChrome"
    class="grain pointer-events-none fixed inset-0 z-0"
    aria-hidden="true"
  />

  <SiteNav v-if="!isScene" :transparent="isRoom" />

  <!--
    z-10 包住内容，让导航和它同层而不被压在下面。
    注意别在这里加 transform / filter：场景页的 .stage-wrap 是 fixed，
    祖先一旦有 transform 就会变成包含块，把舞台推出屏幕（见 ADR-0008）。
  -->
  <div class="relative z-10">
    <RouterView v-slot="{ Component }">
      <!-- appear：第一次落地也淡进来。只有 opacity，不做位移 -->
      <Transition name="page" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>

    <SiteFooter v-if="hasChrome" />
  </div>
</template>
