// 拉丁字形自托管，中文走系统无衬线，不下载中文 webfont。
// JetBrains Mono：代码、数字、日期、标签。Press Start 2P：字标与大号数字点缀。
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import '@fontsource/press-start-2p/latin-400.css'

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
