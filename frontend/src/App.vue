<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'

const route = useRoute()

/**
 * 场景页自己就是整个页面：100vh 不滚动、没有正文。
 * 给它们加导航和页脚会把景压成一块装饰。
 *
 * 只有湖边是这种页 —— 它整页没有导航，出口是点小木屋。
 *
 * 屋里（/room）是「导航独立占上面一条」：舞台让开了 --nav-h
 * （SceneStage 的 navClearance），景的上沿贴着导航条的下沿，两者不重叠。
 * 它同样不要页脚和噪点（噪点叠在水彩上会脏）。
 */
const isScene = computed(() => route.meta.scene === true)

/**
 * 屋里：有导航（独立占上面一条），但不要页脚
 * （舞台是 100vh 且 fixed，页脚会被顶到屏幕外）、
 * 不要纸感噪点（水彩叠噪点会脏）。
 *
 * 曾经这里还有一个 isProjects 特判（那一页整页是一台 fixed 显示器），
 * 已随 /projects 的内容清空一起去掉 —— 它现在和其余两个空页一样，
 * 就是一张普通的纸，照常吃噪点、照常跟着文档流滚动。
 */
const isRoom = computed(() => route.name === 'room')

/**
 * 纸感噪点：只给普通内容页（场景页不叠，水彩叠噪点会脏）。
 * 注意：页脚原先也由 hasChrome 控制，现已全站移除，
 * 待后续统一重新制作（见 SiteFooter.vue，暂未挂载）。
 */
const hasChrome = computed(() => !isScene.value && !isRoom.value)
</script>

<template>
  <!-- 纸感噪点铺在最底层，整站共用。景上不叠：水彩叠噪点会脏 -->
  <div
    v-if="hasChrome"
    class="grain pointer-events-none fixed inset-0 z-0"
    aria-hidden="true"
  />

  <!--
    导航自己带纸底（见 main.css 的 .nav-bar），色值就是全站唯一的页面底色，
    每一页都相同 —— 不再需要按路由给它换色。
    （曾经屋里那一条要换 `--scene-paper`，因为舞台铺的是另一种冷一点的纸；
      两种纸并成一个颜色后，那条分支已删。）
  -->
  <SiteNav v-if="!isScene" />

  <!--
    z-10 包住内容，让导航和它同层而不被压在下面。
    注意别在这里加 transform / filter：场景页的 .stage-wrap 是 fixed，
    祖先一旦有 transform 就会变成包含块，把舞台推出屏幕。
  -->
  <div class="relative z-10">
    <RouterView v-slot="{ Component }">
      <!-- appear：第一次落地也淡进来。只有 opacity，不做位移 -->
      <Transition name="page" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </div>
</template>
