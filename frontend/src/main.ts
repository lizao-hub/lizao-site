// 拉丁字形自托管，中文正文走系统无衬线，不下载中文 webfont。
// JetBrains Mono：代码、数字、日期、标签。
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'

// 标题字体：霞鹜文楷 Light 的子集，约 230 KB。
// 生成方式见 src/assets/fonts/README.md，改动标题文案后要跑 npm run subset-font。
import './assets/fonts/lxgw-wenkai-light.css'

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
