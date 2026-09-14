/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx,md}'],
  theme: {
    extend: {
      // 颜色全部走 CSS 变量（见 src/assets/main.css），只有一套明暗令牌。
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        line: 'var(--line)',
        accent: 'var(--accent)',
      },
      // 中文正文走系统无衬线（中文 webfont 动辄数 MB，不值得）。
      // 拉丁 / 数字 / 代码用自托管的 JetBrains Mono，字标用 Press Start 2P。
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'Microsoft YaHei',
          'Noto Sans SC',
          'Source Han Sans SC',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        pixel: ['Press Start 2P', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        // 约 44 个汉字一行，简历条目读起来不吃力
        prose: '44em',
      },
      transitionTimingFunction: {
        // 唯一的缓动曲线，和 main.css 里的 transition 保持一致
        pixel: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
