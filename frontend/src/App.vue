<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SketchDefs from '@/components/SketchDefs.vue'

const route = useRoute()
</script>

<template>
  <!-- 手绘滤镜与可复用路径，全站挂一次 -->
  <SketchDefs />

  <!-- 纸感噪点铺在最底层，整站共用 -->
  <div class="grain pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

  <!-- 导航固定显示，首页也有，不再做「隐藏导航的门」 -->
  <SiteNav />

  <div class="relative z-10">
    <RouterView v-slot="{ Component }">
      <!-- appear：第一次落地也淡进来。只有 opacity，不做位移 -->
      <Transition name="page" mode="out-in" appear>
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>

    <SiteFooter />
  </div>
</template>
