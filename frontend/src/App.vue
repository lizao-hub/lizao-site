<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SketchDefs from '@/components/SketchDefs.vue'

const route = useRoute()

/**
 * 场景页（湖边 / 屋里）自己就是整个页面：100vh 不滚动、没有正文。
 * 给它们加导航和页脚会把景压成一块装饰，也会多出一套并行的导航
 * （屋里本来就靠点物件走路）。见 ADR-0009。
 *
 * 所以这两个路由不渲染导航和页脚：
 * - 湖边的出口是点小木屋；
 * - 屋里的出口是左下角的「回到湖边」，其余是靠点桌上的东西。
 */
const isScene = computed(() => route.meta.scene === true)
</script>

<template>
  <!-- 手绘滤镜与可复用路径，全站挂一次 -->
  <SketchDefs />

  <!-- 纸感噪点铺在最底层，整站共用。场景页不要：景是水彩，叠噪点会脏 -->
  <div
    v-if="!isScene"
    class="grain pointer-events-none fixed inset-0 z-0"
    aria-hidden="true"
  />

  <SiteNav v-if="!isScene" />

  <div :class="isScene ? '' : 'relative z-10'">
    <RouterView v-slot="{ Component }">
      <!-- appear：第一次落地也淡进来。只有 opacity，不做位移 -->
      <Transition name="page" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>

    <SiteFooter v-if="!isScene" />
  </div>
</template>
