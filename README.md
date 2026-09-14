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

## 部署

### 结论：用 Nginx，暂时不需要 Node / Python

当前状态下**整个网站只有前端**：

- 前端是纯静态 SPA（Vue 3 + vue-router **history 模式** + Tailwind），照片打包在 `src/assets/` 里；
- 后端 `backend/main.py` 还是空的，没有 API 可跑。

所以服务器上 **不需要 Node、不需要 Python、不需要 uvicorn，只要 Nginx** 托管 `dist/` 即可。

因为用了 `createWebHistory`（history 模式），必须靠 Nginx 的 `try_files` 做路由回退，
否则直接访问或刷新 `/notes`、`/about` 会 404。

以后接入 FastAPI 后，只需在 Nginx 里加一条 `/api` 反向代理到 `127.0.0.1:8000`，架构不用改。

### 架构

```
用户浏览器
    │  http://服务器IP
    ▼
Nginx (80 端口)
    │  托管 /var/www/lizao-site 静态文件
    └─ try_files 回退到 index.html（SPA 刷新不 404）
```

接入后端后：

```
Nginx ──/api/*──> 127.0.0.1:8000 (uvicorn FastAPI)
      └─/*──────> 静态文件
```

### 步骤

**1. 本地构建前端**

```bash
cd frontend
npm install
npm run build          # 产物在 frontend/dist/
```

**2. 上传产物到服务器**

```bash
# 服务器上先建目录
sudo mkdir -p /var/www/lizao-site

# 本地执行
scp -r frontend/dist/* root@你的服务器IP:/var/www/lizao-site/
```

**3. 安装 Nginx**

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nginx

# CentOS / Rocky
sudo dnf install -y nginx

sudo systemctl enable --now nginx
```

**4. 写配置 `/etc/nginx/conf.d/lizao-site.conf`**

```nginx
server {
    listen 80;
    server_name _;                 # 还没有域名，用 _ 通配；有域名后改成 lizao.xxx
    root /var/www/lizao-site;
    index index.html;

    # 关键：SPA 路由回退，解决 /notes、/about 刷新 404
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长缓存（vite 文件名带 hash，可放心长缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html 绝不缓存，保证发版后立即生效
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;
}
```

**5. 校验并重载**

```bash
sudo nginx -t              # 语法检查
sudo systemctl reload nginx
```

**6. 开放 80 端口**

```bash
# Ubuntu
sudo ufw allow 80/tcp

# CentOS / Rocky
sudo firewall-cmd --add-service=http --permanent && sudo firewall-cmd --reload
```

> **云服务器记得在控制台安全组里也放行 80 端口**，这一步最容易漏。

完成后访问 `http://你的服务器IP` 即可。

### 常见坑

| 坑 | 说明 |
|---|---|
| 安全组没放行 80 | 阿里云 / 腾讯云 / AWS 有独立安全组，光开 ufw / firewalld 不够 |
| SPA 刷新 404 | 漏了 `try_files $uri $uri/ /index.html`，直接访问 `/about` 会 404 |
| 改完不生效 | 忘了 `systemctl reload nginx`；`index.html` 必须设 `no-cache` |
| 照片太大 | `photos_raw/` 是原图，会拖慢首屏。上线前用 `backend/scripts/optimize_photos.py` 先压缩 |
| Node 版本 | `package.json` 要求 `node ^22.18.0 \|\| >=24.12.0`，本地构建时注意 |

### 以后买域名 + 配 HTTPS

把 `server_name _;` 改成真实域名，然后：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lizao.com -d www.lizao.com
```

certbot 会自动改 Nginx 配置、签证书、配 80→443 跳转和自动续期。

### 接入 FastAPI 后端后

在 Nginx 里加反代（此时才需要服务器上装 Python 环境跑 uvicorn）：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

此时前端用相对路径请求 `/api/posts/` 即可，浏览器视为同源，**不需要配 CORS**。

### 关于 Docker

当前只有静态前端，Docker 属于过度设计，直接用 Nginx 最省事。
等后端 FastAPI 成型后，再用 Docker Compose 编排 `nginx + uvicorn` 也不迟。

## 前端页面

| 路径 | 页面 |
|---|---|
| `/` | 入口。一扇半掩的门，没有导航栏，点「推门」才进得去 |
| `/notes` | 笔记，线性往下淌，不是卡片网格 |
| `/friends` | 影像。生活和朋友的照片混在一面墙上，路径没改 |
| `/about` | 关于。一段散文，不是简历 |
| `/projects` | 项目，安静的一条列表 |
| `/posts/:slug` | 文章详情，正文是 Markdown |

设计约束、目录说明、加内容的步骤、容易踩的坑，都写在 `frontend/README.md` 里。

## 已实现

- 一套设计令牌：明暗两个模式、暗苔绿单一强调色、零圆角、胶片颗粒
- 入口页（隐藏导航）、笔记、影像墙、关于、项目、文章详情
- 文章正文走 Markdown（`src/content/notes/*.md`），代码块刻意不做语法高亮
- 照片自动收录：往 `photos-life/` 或 `photos-ta-all/<相册>/` 丢文件即可
- 影像墙的不规则倾斜由文件名哈希决定，刷新不会跳动
- 主题与语言偏好写入 localStorage，刷新后保留；首屏不会闪白

## 待实现

- 生活照片还一张都没有，`photos-life/` 现在是个空相框（入口页暂时用现有的照片顶着）
- 中英切换覆盖了全部界面文案，但文章正文仍是中文单语
- 照片仍打包进前端，以后可以改由后端提供
- 接入 FastAPI 接口，替换现在的静态数据

## 已知问题

`backend/scripts/optimize_photos.py` 的输出目录是 `backend/photos/`，
但前端读的是 `frontend/src/assets/photos-ta-all/<相册>/`，两边对不上，
而且脚本不支持相册子目录。暂时只能手工把压好的图放进对应相册文件夹。
