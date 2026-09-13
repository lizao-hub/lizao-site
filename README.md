# lizao-site

个人网站。前端 Vue 3，后端 FastAPI。

## 结构

```
lizao-site/
├── frontend/     Vue 3 + Vite + TypeScript + Tailwind CSS
└── backend/      FastAPI + Python
```

## 开发

两个终端分别启动：

```bash
# 终端 1：前端 http://localhost:5173
cd frontend
npm install
npm run dev

# 终端 2：后端 http://localhost:8000
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

详细说明见 `frontend/README.md` 和 `backend/README.md`。

## 前端页面

| 路径 | 页面 |
|---|---|
| `/` | 首页，文章列表 |
| `/notes` | 笔记 |
| `/projects` | 项目 |
| `/about` | 关于 |
| `/friends` | TA 们（照片墙） |
| `/posts/:slug` | 文章详情 |

## 已实现

- 导航栏：主题切换（浅色/深色）、中英文切换、路由高亮
- 首页：双栏布局，侧边栏 + 文章列表
- 主题与语言偏好写入 localStorage，刷新后保留

## 待实现

- 笔记 / 项目 / 关于 / TA 们 四个页面的内容
- 中英切换目前只覆盖导航文案，页面数据仍是中文单语
- 接入后端接口，替换现在的静态 mock 数据
- 文章正文的 Markdown 渲染
- 照片改由后端提供，不再打包进前端
