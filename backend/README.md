# backend

FastAPI 后端。前端在 `../frontend/`。

## 目录规划

```
backend/
├── pyproject.toml          ← 依赖声明（uv 管理）
├── .venv/                  ← 虚拟环境，不提交
├── .env.example            ← 环境变量模板（提交这个，不提交 .env）
├── .env                    ← 你的真实密钥，不提交
├── app/
│   ├── __init__.py
│   ├── main.py             ← FastAPI 实例 + 路由注册
│   ├── config.py           ← 读取环境变量
│   ├── database.py         ← 数据库连接
│   ├── models/             ← SQLAlchemy 模型
│   ├── schemas/            ← Pydantic 模型（请求/响应）
│   ├── routers/            ← 路由分组
│   │   ├── posts.py        ← 文章接口
│   │   ├── projects.py     ← 项目接口
│   │   └── photos.py       ← TA 们的照片接口
│   └── utils/
├── media/                  ← 上传的照片，不提交
└── scripts/
    └── seed.py             ← 初始化测试数据
```

## 初始化

```bash
cd backend
uv init --python 3.12
uv add fastapi "uvicorn[standard]" sqlalchemy pydantic-settings python-multipart
uv add --dev ruff
```

## 启动

```bash
uv run uvicorn app.main:app --reload --port 8000
```

- 接口文档：http://localhost:8000/docs
- 前端在 http://localhost:5173

## 跨域（CORS）

前端 5173 端口、后端 8000 端口属于不同源，浏览器会拦截请求。两种解决办法：

**办法一：前端配代理（推荐，开发环境）**

在 `frontend/vite.config.ts` 里加：

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

这样前端写 `fetch('/api/posts/')` 即可，浏览器认为同源，无跨域问题。

**办法二：后端开 CORS**

在 `app/main.py` 里：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

生产环境把 `allow_origins` 换成真实域名，不要用 `["*"]`。

## 图片存放

照片有两种方案：

| 方案 | 说明 | 适用 |
|---|---|---|
| 后端 `media/` 目录 | FastAPI 用 `StaticFiles` 挂载，直接返回图片 | 个人项目、图片少 |
| 对象存储（OSS / S3 / Cloudflare R2） | 图片传到云，后端只存 URL | 图片多、要 CDN 加速 |

现在照片在前端 `src/assets/photos-ta-all/` 里打包进前端。接后端后建议改成放 `backend/media/`，前端通过 URL 引用，这样加图片不用重新构建前端。
