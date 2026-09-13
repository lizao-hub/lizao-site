<script setup lang="ts">
// 作用：从 lucide-vue-next 图标库中按需导入两个具体的图标组件。
import { Github, Mail } from 'lucide-vue-next' 

// 定义 TypeScript 接口，规范每个社交链接的数据结构
interface SocialLink {
  label: string
  href: string
  icon: typeof Github
}

const links: SocialLink[] = [
  { label: 'GitHub 主页', href: 'https://github.com/lizao-hub/my_vue3', icon: Github },
  { label: '发送邮件', href: 'mailto:2443642197@qq.com', icon: Mail },
]
</script>

<template>
<!-- <nav>：语义化 HTML 标签，表示这是一个导航区域。
aria-label="社交链接"：无障碍（a11y）属性，告诉屏幕阅读器（如盲人使用的读屏软件）这个导航区块的作用是“社交链接”。
Tailwind 类名：
flex：启用 Flexbox 弹性布局，使子元素横向排列。
gap-3：设置子元素之间的间距为 0.75rem（12px）。
mt-4：设置上边距（margin-top）为 1rem（16px）。 -->
  <nav aria-label="社交链接" class="flex gap-3 mt-4">
    <a
      v-for="link in links"
      :key="link.label"
      :href="link.href"
      :aria-label="link.label"
      target="_blank"
      rel="noopener noreferrer"
      class="text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
    >
    <!-- <component :is="...">：Vue 的动态组件特性。它会根据 link.icon 的值，动态渲染对应的图标组件（即 Github、Twitter 或 Mail）。这避免了写两个个 v-if 判断。 -->
      <component :is="link.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
    </a>
  </nav>
</template>
