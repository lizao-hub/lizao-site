/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx,md}'],
  theme: {
    extend: {
      // 颜色全部走 CSS 变量（见 src/assets/main.css），只有一套明暗令牌。
      colors: {
        paper: 'var(--paper)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunk: 'var(--surface-sunk)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-soft)',
        },
        // 自然色：森林、水、木。用于极少量的语义强调，不是第二个强调色。
        moss: 'var(--moss)',
        water: 'var(--water)',
        wood: 'var(--wood)',
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
          soft: 'var(--accent-soft)',
        },
      },
      // 正文中文走系统无衬线（中文 webfont 动辄数 MB，不值得）。
      // 标题用自托管的霞鹜文楷 Light 子集，见 ADR-0006 与 src/assets/fonts/README.md。
      // 拉丁 / 数字 / 代码用自托管的 JetBrains Mono。
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
        display: [
          'LXGW WenKai',
          'LXGW WenKai Light',
          'PingFang SC',
          'Microsoft YaHei',
          'Noto Sans SC',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        // 约 44 个汉字一行，长文读起来不吃力
        prose: '44em',
      },
      // 唯一的弹性缓动曲线，和 main.css 里的 transition 保持一致
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
