# frontend

Vue 3 + Vite + TypeScript + Tailwind v3。纯静态产物，构建完丢给 Nginx 就行。

---

## 这个站在做什么

以求职为主、兼顾技术展示的个人简历站。主要读者是招聘方 / HR / 面试官，
次要读者是同行开发者。内容依据 `../doc/RESUME.md`。

对应的设计约束（改代码之前先读一遍，不然很容易把它改回一个普通模板）：

| 约束 | 具体是什么 |
|---|---|
| 极简专业打底 | 白底、大留白、深色文字。正文不做任何像素化，保证可读性 |
| 像素只做点缀 | 像素只出现在图标、按钮、标签、分隔线、相框、大号数字上 |
| 一个强调色 | 复古蓝。全站没有第二个彩色 |
| 圆角为零 | 直角 + 2px 实线边框 + 无模糊硬阴影 |
| 动效克制 | 只有 CSS hover、路由交叉淡入、区块滚动淡入（触发一次）。没有视差、没有粒子、没有打字机 |
| 明暗两套 | 手动切换 + localStorage 记忆，首屏之前就生效，不闪白 |
| 没有破折号 | 全站禁用 `—` 和 `–`，可见文案里一个都不许有 |
| 只有中文 | 不做中英切换 |

---

## 目录

```
src/
├── assets/
│   ├── main.css                 设计令牌、像素零件、Markdown 正文样式
│   ├── photos-life/             我的照片（见该目录下的 README）
│   └── photos-ta-all/<相册>/    朋友的照片
├── components/
│   ├── SiteNav.vue              固定导航 + GitHub + 明暗切换 + 手机菜单
│   ├── SiteFooter.vue
│   ├── ThemeToggle.vue          明暗切换按钮
│   ├── PixelIcon.vue            8x8 点阵图标（手绘，不引图标库）
│   ├── SkillTag.vue             技能标签
│   ├── SectionFade.vue          滚动淡入封装，IntersectionObserver 触发一次
│   ├── NoteEntry.vue            一条笔记
│   ├── PhotoTile.vue            一张照片，直角像素相框
│   └── PhotoLightbox.vue        看大图，带键盘和焦点管理
├── composables/useTheme.ts
├── content/notes/*.md           文章正文（Markdown）
├── data/
│   ├── resume.ts                简历数据：教育 / 技能 / 论文 / 竞赛 / 助教
│   ├── projects.ts              项目数据（列表 + 详情页共用）
│   ├── posts.ts                 文章元信息 + 正文加载 + 排序
│   └── photos.ts                照片自动收录 + 相册名
├── router/index.ts              路由 + 每页 title / description
├── styles/layers.ts             z-index 数值表
├── types/
├── utils/
│   ├── date.ts
│   └── markdown.ts              markdown-it，关掉 html 和 typographer
└── views/                       Home / Projects / Project / About / Notes / Post / Gallery
```

---

## 加内容

### 加一篇笔记

两步：

1. 新建 `src/content/notes/<slug>.md`，写正文（纯 Markdown）
2. 在 `src/data/posts.ts` 的 `posts` 数组里加一条元信息，`slug` 和文件名一致

列表页按 `date` 从新到旧排，不用管数组顺序。

正文里的裸 HTML 会被转义，`--` 也不会被自动替换成破折号，这是故意的。

### 加一个项目

改 `src/data/projects.ts` 就够了：

- `slug` 决定详情页地址 `/projects/<slug>`，也是唯一标识
- `end` 用来排序（形如 `2026.08`），`period` 是展示用的起止时间
- `metrics` 只写简历里真实存在的量化结果，没有就留空，不要编数字
- `highlights` 一行一条，尽量短，招聘方是扫着看的

### 加照片

丢文件就行，不用改代码：

```
src/assets/photos-life/随便什么名字.jpg              我的照片
src/assets/photos-ta-all/<相册文件夹>/photo-01.jpg   朋友的照片
```

两个 `import.meta.glob` 会自动收录，并按文件名数字排序。
相册名默认取文件夹名，想改显示名去 `photos.ts` 的 `albumNames` 里登记。

想让某张照片带一句说明，在 `photos.ts` 的 `photoNotes` 里加：

```ts
const photoNotes: Record<string, string> = {
  'life/photo-01.jpg': '那天下午，光很好',
}
```

不加也不会显示任何东西，页面不会替你编一句。

**上线前先压图。** 手机一张原图 4MB，十张就是 40MB。

### 改简历内容

只改 `src/data/resume.ts`，组件不用动。改完跑一次 `npm run type-check`。

---

## 设计令牌

全部在 `src/assets/main.css` 顶部的 `:root` 和 `.dark` 里。改配色只改那里。

```
--paper                背景
--surface              卡片、标签、代码块的底色
--ink                  正文
--ink-soft             次要文字（两个模式都满足 AA）
--line                 边框与分隔线
--accent               复古蓝，全站唯一强调色
--accent-ink           强调色底上的文字（亮色模式是白，暗色模式是深色）
--pixel-shadow         硬阴影，直角无模糊
--veil                 看照片的遮罩，两个模式下都是深的
--z-nav / --z-lightbox
```

字体：中文用系统无衬线，不下载中文 webfont。
拉丁 / 数字 / 代码用自托管的 JetBrains Mono，字标与大号数字用 Press Start 2P。

---

## 几个容易踩的坑

**Tailwind 会把运行时类名删掉。**
Vue 在运行时才加上的类（`page-enter-active` 之类）在源码里搜不到，
放在 `@layer components` 里会被当成没用到而删掉。
所以路由过渡那几个类写在 `main.css` 所有 `@layer` 之外，别挪回去。

**不要在组件里随手写 `z-50`。**
用 `src/styles/layers.ts` 里的数值，它和 CSS 变量一一对应。

**像素阴影不要换成 `box-shadow` 模糊阴影。**
硬阴影（无 blur、有 offset）是这套视觉的核心，模糊阴影会让它瞬间变成普通卡片。

**新增图标要画在 8x8 网格里。**
`PixelIcon.vue` 的每个字形都是 8 行 8 列的点阵字符串，别引入线性图标库混用。

**中文不能用像素字体。**
Press Start 2P 只有拉丁字形，中文会逐字回落到系统字体。
所以像素字体只用在数字、短拉丁串和字标上，正文与中文标题一律系统无衬线。

---

## 开发

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # 类型检查 + 构建，产物在 dist/
npm run type-check
```
