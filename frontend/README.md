# frontend

Vue 3 + Vite + TypeScript + Tailwind v3。纯静态产物，构建完丢给 Nginx 就行。

---

## 这个站在做什么

李泽敖的个人主页。定位、视觉语言和词汇表见仓库根目录的 **[`../CONTEXT.md`](../CONTEXT.md)**，
设计决策见 **[`../docs/adr/`](../docs/adr/)**。改代码之前先读这两处。

---

## 目录

```
src/
├── assets/
│   ├── main.css                 设计令牌、手绘零件、Markdown 正文样式
│   ├── photos-life/             我的照片（见该目录下的 README）
│   ├── notes-cover/             笔记封面，文件名 = slug（见该目录下的 README）
│   └── photos-ta-all/<相册>/    朋友的照片
├── components/
│   ├── SiteNav.vue              固定导航 + GitHub + 明暗切换 + 手机菜单
│   ├── SiteFooter.vue
│   ├── ThemeToggle.vue          明暗切换按钮
│   ├── LineIcon.vue             手绘线条图标（内联 SVG，不引图标库）
│   ├── SkillTag.vue             技能标签
│   ├── SectionFade.vue          滚动淡入封装，IntersectionObserver 触发一次
│   ├── NoteEntry.vue            一条笔记的卡片：封面 + 文字，左右交替
│   ├── NoteCover.vue            笔记封面，没图就画手绘占位块
│   ├── PhotoTile.vue            一张照片，手绘相框
│   └── PhotoLightbox.vue        看大图，带键盘和焦点管理
├── composables/
│   └── useTheme.ts              明暗主题，localStorage 记忆
├── content/notes/*.md           文章正文（Markdown）
├── data/
│   ├── resume.ts               关于页数据：教育 / 技能 / 论文 / 竞赛 / 助教
│   ├── projects.ts              项目数据（列表 + 详情页共用）
│   ├── posts.ts                 文章元信息 + 正文加载 + 排序
│   ├── postCovers.ts            笔记封面自动收录（文件名 = slug）
│   ├── postStats.ts             热度 / 评论 / 点赞（目前是模拟数据）
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

### 给笔记加封面

把图丢进 `src/assets/notes-cover/`，**文件名等于 slug**：

```
python-to-vue-first-week.jpg   ->  /notes/python-to-vue-first-week
```

不用改代码，`src/data/postCovers.ts` 会自动按 slug 匹配。推荐 1280x800、300KB 以内，
卡片按 16:10 居中裁切。没有封面不会报错，卡片会画一个手绘占位块。

### 笔记卡片上的热度 / 评论 / 点赞

**这三个数字目前全是模拟的**，写在 `src/data/postStats.ts` 里，键是 slug。
站点现在没有后端、没有埋点、没有评论系统，所以它们只是占位的展示密度。

接 FastAPI 之后，把 `statsOf()` 换成接口请求即可，组件层（`NoteEntry.vue`）不用动。

### 加一个项目

改 `src/data/projects.ts`。项目内容在 `/about` 里呈现（见 ADR-0001）。

- `slug` 决定详情页地址，也是唯一标识
- `end` 用来排序（形如 `2026.08`），`period` 是展示用的起止时间
- `metrics` 只写真实存在的量化结果，没有就留空，不要编数字
- `highlights` 一行一条，尽量短

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

### 改关于页内容

只改 `src/data/resume.ts`，组件不用动。改完跑一次 `npm run type-check`。

---

## 设计令牌

全部在 `src/assets/main.css` 顶部的 `:root` 和 `.dark` 里。改配色只改那里。

```
--paper                背景（米白 / 暖灰，明确拒绝纯白）
--surface              卡片、标签、代码块的底色
--ink                  正文（墨色，带暖灰的黑）
--ink-soft             次要文字
--line                 边框与分隔线
--accent               点缀色。极少量，只用于按钮、链接悬停、重要高亮
--accent-ink           点缀色底上的文字
--veil                 看照片的遮罩，两个模式下都是深的
--z-nav / --z-lightbox
```

配色在光明与暗色下是**两套独立设计**，不是变量反相。暗色走暖调墨夜（见 ADR-0004）。
自然意象（树、云、水、木）的色相在两种模式下都保留，只是降饱和。

字体：正文中文用系统无衬线，不下载中文 webfont。
标题用自托管的开源中文手写体（见 ADR-0006）。代码用自托管的 JetBrains Mono。

---

## 几个容易踩的坑

**Tailwind 会把运行时类名删掉。**
Vue 在运行时才加上的类（`page-enter-active` 之类）在源码里搜不到，
放在 `@layer components` 里会被当成没用到而删掉。
所以路由过渡那几个类写在 `main.css` 所有 `@layer` 之外，别挪回去。

**不要在组件里随手写 `z-50`。**
用 `src/styles/layers.ts` 里的数值，它和 CSS 变量一一对应。

**手绘边框用静态 SVG 路径，不要换成 CSS 圆角矩形。**
直角方框会让它瞬间变成一个模板站。参见 ADR-0003。

**不要用真实投影表达层次。**
用色块偏移或手绘排线。模糊阴影是同一回事。

**图标要手绘线条，不要引入图标库混用。**
`LineIcon.vue` 的线质必须和手绘边框一致，否则一眼看出是拼的。

**环境动效必须尊重 `prefers-reduced-motion`。**
滚动路径上不留任何逐帧计算，见 ADR-0005。

---

## 开发

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # 类型检查 + 构建，产物在 dist/
npm run type-check
```
