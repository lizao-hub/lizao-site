// 字体。两套自托管，取舍与授权见 src/assets/fonts/README.md：
//   Wotfard Regular —— 拉丁、数字、标点（23 KB，全字集，不需要子集）
//   霞鹜文楷 Light  —— 汉字标题（230 KB 的子集，改标题文案后跑 npm run subset-font）
// 中文正文走系统无衬线（中文 webfont 动辄数 MB，不值得）。
//
// 曾经还有第三套 JetBrains Mono（代码 / 日期 / 标签），但它一个引用都没有 ——
// 站上没有任何元素穿 font-mono，已连同 --font-mono 令牌与 npm 依赖一起删。
// 哪天真要显示代码，再 `npm i @fontsource/jetbrains-mono` 装回来即可。
import './assets/fonts/wotfard.css'
import './assets/fonts/lxgw-wenkai-light.css'

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
