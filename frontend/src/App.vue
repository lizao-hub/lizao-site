<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const route = useRoute()
</script>

<template>
  <!-- 导航固定显示，首页也有，不再做「隐藏导航的门」 -->
  <SiteNav />

  <RouterView v-slot="{ Component }">
    <!-- appear：第一次落地也淡进来。只有 opacity，不做位移 -->
    <Transition name="page" mode="out-in" appear>
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>

  <SiteFooter />
</template>
