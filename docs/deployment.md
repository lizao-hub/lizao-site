# lizao-site 部署与运维笔记

> 本文档由 owner 要求生成（2026-09-20），汇总「部署 / 文件地址 / API / 数据库」相关对话，
> 特别把当时不好理解的概念拆开讲清楚。
>
> 性质说明：这是**线上事实与运维速查**，不是视觉/排版类的「设计约定」（后者按项目约定只写在代码里）。
> 服务器 IP、目录、接口这些会随部署变化，以本文 + 代码为准；改了部署记得同步这里。

---

## 0. 服务器与访问入口

| 项 | 值 |
|---|---|
| 服务器 | 阿里云 ECS，2C2G / 40G 盘 |
| 公网 IP | `101.132.91.17` |
| 当前测试地址 | `http://101.132.91.17:8000`（裸 IP + 非标准端口） |
| 运行状态 | `systemd` 服务 `lizao`，已 `enable --now`，崩溃自动重启、开机自启 |
| 备案状态 | 进行中。**备案期间用裸 IP:8000 测，不受备案限制**；备案下来再绑域名走 80/443 |

**为什么备案期间能用 `:8000` 测？** ICP 备案管的是「域名 + 80/443」。裸 IP + 非标准端口不经过域名解析，运营商不会拦。防火墙里 8000 已放行（备注「fastapi 测试」），80 是禁用——这个配置本身合理。

---

## 1. 部署架构（当前用的是「方案 A」）

浏览器 → `:8000` → **FastAPI 一个程序包办三件事**：
1. 托管前端静态站点（`dist/`）
2. 处理 `/api`（点赞、留言、照片清单）
3. 发照片文件（`/media/photos`）
4. 管理页 `/admin`

为什么用 A 而不是装 nginx：**测试期 + 小白 + 流量极小**。少装一个程序、少一份配置要读要改。等上线（绑域名、上 HTTPS、流量上来）再在前面加 nginx，FastAPI 代码一行都不用动。

（关于「方案 B = nginx 反代」为什么上线才有价值，见第 6 节科普。）

---

## 2. 服务器目录结构

```
/srv/lizao/
├── dist/                      # 前端构建产物（网站成品，纯静态）
│   └── assets/                # 打包后的 JS / CSS / 字体 / 背景图（URL 里的 /assets/*）
├── backend/
│   ├── main.py                # FastAPI 入口：托管 dist + /api + /media + /admin
│   ├── store.py               # 照片库目录逻辑（photos_dir()）
│   ├── db.py                  # SQLite 连接与建表
│   ├── reactions.py           # 点赞 / 留言逻辑
│   └── lizao.db               # ★ 点赞数 + 留言的数据库文件（持久！）
└── data/
    └── photos/                # ★ 照片库（后台上传的图实时写这里，持久！）
```

> ★ 标记的两个是**服务器磁盘上的持久文件**：迁移/重装整机/做快照时记得一起带走，否则点赞、留言、照片会丢。

---

## 3. URL → 服务器路径 对照表（重点）

| 浏览器里的 URL | 服务器真实路径 | 怎么更新 | 机制 |
|---|---|---|---|
| `/` `/room` `/projects` `/projects/:slug` `/gallery` | `dist/index.html` + history 回退 | 重新 build + 上传 `dist` + 重启 | 纯前端页面 |
| `/assets/*` | `/srv/lizao/dist/assets/*` | 重新 build | **构建期烤死**的静态资源 |
| `/media/photos/*` | `/srv/lizao/data/photos/*` | **后台上传即时生效，不用重建** | 运行时从磁盘发 |
| `/admin` | 后端 `admin/index.html` | — | 照片管理 + 留言管理页 |
| `/docs` `/openapi.json` | 后端自动生成 | — | FastAPI 接口文档（公网可读⚠️） |
| `/api/*` | 后端处理逻辑 | 改 `backend/` 代码 | 动态接口 |

**两个静态目录机制完全不同（这是之前那个 bug 的本质）：**
- `/assets` 是「烤死在构建产物里」的——本地打包时定死，传上去就不变。
- `/media/photos` 是「活在服务器硬盘上」的——后台上传一张，目录多一个文件，网站刷新即见。

---

## 4. API 清单

**照片**（只有三个：列、传、删）
- `GET  /api/photos` —— 取当前照片清单（影像页加载时调，返回 `count` + `dir` + `photos[]`）
- `POST /api/photos` —— 上传一张照片（后台管理页用，`multipart/form-data` 字段 `file`）
- `DELETE /api/photos/{文件名}` —— 删除某张照片

**项目点赞与留言**（按 `slug` 区分）
- `GET  /api/projects/{slug}/reactions` —— 取某项目赞数 + 留言列表
- `POST /api/projects/{slug}/likes` —— 点赞 +1
- `POST /api/projects/{slug}/comments` —— 写一条留言

**留言管理**
- `GET  /api/comments` —— 列出全部留言（管理页用）
- `DELETE /api/comments/{id}` —— 删除某条留言

> 四个写接口（上传 / order / normalize / delete）一律回**完整清单** `store.list_photos()`，管理页拿它重画网格。

---

## 5. 数据库（SQLite，`backend/lizao.db`）

库里只放**会增长的东西**：点赞数、留言。**项目正文不在库里**（在前端 `src/data/projects.ts`，属于排版不是记录）。

只用标准库 `sqlite3`，无 ORM、无迁移。两张表：

### `project_like`（一个项目一行，累计赞数）
| 列 | 类型 | 约束 | 含义 |
|---|---|---|---|
| `slug` | TEXT | 主键 | 项目标识，如 `traffic-analyzer` |
| `count` | INTEGER | 非空，默认 0 | 累计赞数 |

服务器当前样本：
```
traffic-analyzer    2
industrial-llm-rag  2
```

### `project_comment`（每个项目可有多条，每条一行）
| 列 | 类型 | 约束 | 含义 |
|---|---|---|---|
| `id` | INTEGER | 主键、自增 | 留言编号（删时用） |
| `slug` | TEXT | 非空 | 属于哪个项目 |
| `name` | TEXT | 非空 | 留言昵称 |
| `body` | TEXT | 非空 | 留言内容 |
| `created_at` | TEXT | 非空 | 留言时间，ISO 8601 UTC，前端转本地时间 |

服务器当前样本（1 条）：
```
id=1  slug=traffic-analyzer  name=李枣  body=111  created_at=2026-09-19T08:21:51+00:00
```

**设计要点**
- **没有 `project` 表**：slug 只存字符串，写入时校验格式（`SLUG_RE`）防注入，不校验「项目存不存在」。slug 权威名单在前端，后端再存一份等于双份维护易对不上。
- **点赞认「浏览器」不认人**（2026-09-20 起）：`project_like` 仍只存累计数，另有一张 `project_liker(slug, liker, created_at)`（主键 `(slug, liker)` 即去重）记谁点过。身份是后端发的随机 id cookie `lizao_liker`（httponly，一年）；`GET /reactions` 回 `liked`，前端据此把心画成实心砖红。换浏览器/清 cookie 就是另一个人，可再点一次。前端 localStorage 仍是本地兜底（cookie 被禁时）。
   - 部署提醒：cookie 不带 `secure`（站点是 http）。上了 HTTPS 后打开 `main.py` 里那行 `secure=True`（有注释标着）。
- **有条索引但不强制外键**：`idx_comment_slug ON project_comment(slug, created_at)` 加速「取某项目留言并排序」；没建外键。
- **位置可改**：环境变量 `DATABASE_URL=sqlite:////绝对路径/lizao.db` 可把库挪到别处。

---

## 6. 概念科普（当时不好懂的部分）

### 6.1 静态文件 vs 动态
- **静态**：写好了永远不变的文件（HTML/CSS/JS/图片），浏览器要哪个服务器原样发，不算账。
- **动态**：要现场查库、现算的（如点赞数、留言），由 FastAPI 这个后台程序处理。
- 「部署」= 让公网浏览器能拿到这两部分。

### 6.2 托管 dist 是什么意思
本地 `npm run build` 生成 `dist/` 文件夹（网站成品，代码被打包压缩）。把它传到服务器、让外界能访问，就叫「托管 dist」。

### 6.3 nginx 是什么 / 直出 / 反代
- **nginx**：专门干「接待」的工业级门卫程序，最擅长极快发静态文件、把某些请求转交给别的程序。
- **直出**：nginx 收到要静态文件的请求，直接从硬盘读出来丢给浏览器，不绕弯、不算账——最快。
- **反代（反向代理）**：nginx 在门口，看到 `/api` 开头的请求，知道「这是计算活儿」，转交给后台 FastAPI（跑在 uvicorn 上）处理，结果再经 nginx 转回浏览器。

### 6.4 为什么测试用 A、上线换 nginx
测试期只要「有个东西在 :8000 应答」→ FastAPI 一个程序够。
上线要的是一整套「对外门面」，这些是 nginx 的专长、FastAPI 做得很勉强：
1. **HTTPS 证书**：nginx 配合免费证书自动续期；让 FastAPI 自己处理 TLS 麻烦且易漏续。
2. **标准端口 80/443**：浏览器访问域名默认走这两个特权端口，该由稳定前台程序霸着。
3. **缓存 + 压缩 + HTTP/2**：照片墙几十张图，nginx 顺手做浏览器缓存、gzip/brotli 压缩、多文件并发，FastAPI 不主动做。
4. **一个 IP 挂多个服务**：以后加博客/面板，nginx 按域名/路径分流。
5. **缓冲墙**：挡畸形请求、限速、配合 fail2ban 封 IP，坏流量到不了 Python。
换的时候 FastAPI 代码基本不动，只是前面多站一个 nginx。

### 6.5 构建期打包 vs 运行时加载（之前那个 bug 的本质）
- **构建期打包**：照片在 `npm run build` 时就被收进 `dist`（`import.meta.glob`）。网站只认这 9 张「烤死的」图。
- **运行时加载**：打开页面时实时向 `/api/photos` 要清单、从 `/media/photos` 取图。后台一上传刷新即见。
- 之前 bug：影像页用构建期打包，后台上传写到服务器另一目录 → 两套对不上，上传成功但网站看不到。修法 = 影像页改成运行时加载（`GalleryView.vue` + `vite.config.ts` 加 `/media` 代理）。

### 6.6 SSH 密钥登录：关密码不关端口
- 阿里云防火墙里 22 开着只是「网络层放行」；能不能登进去，决定权在服务器 `/etc/ssh/sshd_config`。
- 加了密钥后，**保留 22 端口网络放行，但在 OS 层关掉密码登录**（`PasswordAuthentication no`）。关端口反而麻烦（只能靠 VNC 控制台登）。
- 密钥已加 → 改 `sshd_config` 关密码 → 端口留着。可加密集加固：换高位端口、装 fail2ban。

---

## 7. 安全提醒（⚠️ 测试期可接受，正式上线要收口）

- **`/admin` 公网裸奔**：任何知道 IP 的人都能进、能删留言/照片。别传私密的；备案上 nginx 时给 `/admin` 加 Basic Auth 或限制访问。
- **`/docs` 公网可读**：把全部接口（含删除类）玩法摊在公网。上线前收口。
- **`PHOTOS_DIR` 默认值已写死**为 `/srv/lizao/data/photos`（`store.py`），不依赖 systemd 配置，重装服务不会静默分裂照片库。

---

## 8. 日常更新流程

**只改前端页面**
1. 本地 `node node_modules/vite/bin/vite.js build`（沙箱里 `npm run build` 会触发 wsl 被拦，用这条直调）
2. `scp -r dist root@101.132.91.17:/srv/lizao/`
3. `systemctl restart lizao`

**改后端代码**
1. `scp` 改动的 `.py` 到 `/srv/lizao/backend/`
2. 若改了依赖：`uv sync`（服务器用阿里云镜像 `UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple`，官方源极慢）
3. `systemctl restart lizao`

**加 / 删照片**：直接开 `http://101.132.91.17:8000/admin` 上传/删除，即时生效，不用重建。

---

## 9. 备份提醒

迁移、重装整机、做云快照时，务必带走这两个持久文件：
- `/srv/lizao/backend/lizao.db`（点赞 + 留言）
- `/srv/lizao/data/photos/`（全部照片）

重新部署 `dist` 不影响它们，但重做整机就不在了。
