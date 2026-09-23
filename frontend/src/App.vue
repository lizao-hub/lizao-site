<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const route = useRoute()

/**
 * 场景页自己就是整个页面：100vh 不滚动、没有正文。
 * 给它们加导航和页脚会把景压成一块装饰。
 *
 * 只有湖边是这种页 —— 它整页没有导航，出口是点小木屋。
 *
 * 屋里（/room）是「导航独立占上面一条」：舞台让开了 --nav-h
 * （SceneStage 的 navClearance），景的上沿贴着导航条的下沿，两者不重叠。
 * 它不要纸感噪点（噪点叠在水彩上会脏），但**要页脚** —— 为此它的舞台
 * 走 SceneStage 的 `flow`（回到文档流，不再 fixed），否则页脚会被
 * 铺满视口的舞台顶到屏幕外。
 */
const isScene = computed(() => route.meta.scene === true)

/**
 * 屋里。它有导航（独立占上面一条），也有页脚（舞台走文档流让出了底部）。
 *
 * 它和内容页只差一件事：**它不叠纸感噪点**（水彩叠噪点会脏）。
 */
const isRoom = computed(() => route.name === 'room')

/**
 * 「普通内容页」＝项目清单 / 项目详情 / 影像：纸感噪点只有它们叠。
 *
 * 场景页（湖边、屋里）都不叠 —— 水彩叠噪点会脏。
 */
const hasGrain = computed(() => !isScene.value && !isRoom.value)

/**
 * 页脚：**除了湖边，每一页都有。**
 *
 * 2026-09-20 重新挂上（此前全站移除过一版，见 SiteFooter.vue 的注释）；
 * 屋里原本被排除在外（舞台是 fixed 铺满视口的景，页脚会被顶到屏幕外，
 * 也会把一幅画压成一块装饰）—— 舞台改成走文档流之后这条理由不成立了，
 * 于是屋里也吃上了。
 *
 * 湖边仍然没有：那一页整页就是一幅景，它根本没有「页面底部」这个东西。
 */
const hasFooter = computed(() => !isScene.value)
</script>

<template>
  <!-- 纸感噪点铺在最底层，整站共用。景上不叠：水彩叠噪点会脏 -->
  <div
    v-if="hasGrain"
    class="grain pointer-events-none fixed inset-0 z-0"
    aria-hidden="true"
  />

  <!--
    导航自己带纸底（见 main.css 的 .nav-bar），色值就是全站共用的页面底色，
    每一页都相同 —— 不再需要按路由给它换色。
    （曾经屋里那一条要换 `--scene-paper`，因为舞台铺的是另一种冷一点的纸；
      两种纸并成一个颜色后，那条分支已删。）
  -->
  <SiteNav v-if="!isScene" />

  <!--
    z-10 包住内容，让导航和它同层而不被压在下面。
    注意别在这里加 transform / filter：湖边那一页的 .stage-wrap 是 fixed，
    祖先一旦有 transform 就会变成包含块，把舞台推出屏幕。
  -->
  <div class="relative z-10">
    <RouterView v-slot="{ Component }">
      <!-- appear：第一次落地也淡进来。只有 opacity，不做位移 -->
      <Transition name="page" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>

    <!--
      页脚放在这个 z-10 的盒子里（而不是它外面）：噪点那层是 fixed z-0，
      不成层的静态块会被压在它下面。放在这儿和内容同层，省掉一个 z-index。
      它在 Transition 之外 —— 切页时页脚不跟着淡入淡出，位置不动。
    -->
    <SiteFooter v-if="hasFooter" />
  </div>
</template>
