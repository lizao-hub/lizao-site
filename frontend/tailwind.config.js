/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx,md}'],
  theme: {
    extend: {
      // 颜色全部走 CSS 变量（见 src/assets/main.css），只有光明一套令牌。
      // 这里**只做映射，不持有事实**：色值一个都不写在这。
      colors: {
        paper: 'var(--paper)',
        // 贴在同一张纸上的「纸片」。当前只有预留的手绘零件（.btn / .tag / .card）用它。
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        line: {
          DEFAULT: 'var(--line)',
          soft: 'var(--line-soft)',
        },
        // 自然色：森林、水、木。低饱和，用于极少量的语义强调，不是第二个强调色。
        moss: 'var(--moss)',
        water: 'var(--water)',
        wood: 'var(--wood)',
        // 影像页相册那套纸与木（album）、/gallery 的吉卜力调色板（gh）、
        // /projects 的 Windows 桌面隐喻都已经删掉了 —— 那些配色是「第二个世界」，
        // 和现在「一个年轻人的私人小世界」的主题打架。站上只有上面这一套。
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
          soft: 'var(--accent-soft)',
        },
      },
      // 字体栈都写在 main.css 的 :root 里，这里只做映射 —— 和颜色一样，
      // Tailwind 不持有事实。字体名（拉丁 Wotfard、标题霞鹜文楷）只在那边出现，
      // 换字体不用碰这个文件。各栈的取舍见 main.css 的注释与 assets/fonts/README.md。
      //
      // 只映射**真的有类在穿**的两条：sans（body 的 @apply）与 display（h1/h2/h3、
      // .figure）。曾经还映射过 mono（JetBrains Mono），零引用，已随字体一起删；
      // 场景页那套 --font-scene 由 main.css 的 .scene-page 直接吃，不经过 Tailwind。
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
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
