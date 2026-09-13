<script setup lang="ts">
import SocialLinks from '@/components/SocialLinks.vue'
</script>

<template>
  <aside class="w-72 flex-shrink-0">
    <img
      src="../assets/cat.jpg"
      alt="头像"
      width="120"
      height="120"
      class="rounded-full object-cover"
      style="width: 120px; height: 120px"
    />

    <h1 class="text-2xl font-bold mt-4">李枣</h1>

    <p class="text-zinc-600 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
      写代码，也写字。杭师大研三（杭师大最好的大学）。目前在一家小公司实习，业余时间学习全栈开发！！！！
    </p>

    <SocialLinks />
  </aside>
</template>
