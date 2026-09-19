# backend

FastAPI 后端。前端在 `../frontend/`。

两件事：

1. **影像页的照片管理页** —— 加图、裁成正方形、调顺序、删除（`store.py`，不进库）；
2. **项目页的点赞与留言** —— 存在 SQLite 里，由 `/api/projects/{slug}/reactions` 发
   （`db.py` + `reactions.py`）。

## 启动

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

打开 http://localhost:8000 就是管理页（接口文档在 http://localhost:8000/docs）。
照片在上面半页，留言在下面半页。

## 它在管什么

照片存在**前端源码目录** `frontend/src/assets/photos/`，**不是** `backend/media/`。

影像页的照片是 `import.meta.glob` 在构建期收进去的（见
`frontend/src/views/GalleryView.vue`），**文件名就是顺序**。管理页直接往那个目录写
文件，前端一行都不用改。

代价：**传完要重启 dev server 或重新 build**，影像页才会变 —— 管理页上写明了这件事。

> ⚠️ 这是全站唯一一处「后端往前端源码目录写文件」的地方。它是个**本机工具**，
> 不是线上服务。真要上线，照片该挪到 `backend/media/photos/` 由接口发 URL ——
> 那时前端得改成运行时拉清单，`store.py` 是唯一需要动的地方。

## 目录

```
backend/
├── main.py                 FastAPI 实例 + 路由（就这几个接口，没有分层）
├── store.py                照片库：读写、方形化、重编号。文件操作的逻辑都在这
├── db.py                   SQLite：连接 + 建表（表结构就写在里面的 SCHEMA）
├── reactions.py            点赞与留言的读写（**库里只有这个**）
├── admin/index.html        管理页。单文件、自包含，没有构建步骤也没有前端依赖
├── lizao.db                SQLite 文件（**不提交** —— 里面的留言是真实数据，别删）
├── scripts/
│   ├── check_store.py      store.py 的自检：uv run python scripts/check_store.py
│   └── optimize_photos.py  离线批量压图（另一条路，见 scripts/README.md）
├── photos_raw/             压图脚本的原图输入，不提交
└── photos/                 压图脚本的输出（**不是**前端读的那个目录）
```

## 接口

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/` | 管理页 |
| GET | `/api/projects/{slug}/reactions` | 一个项目的赞数与留言，一次拿完 |
| POST | `/api/projects/{slug}/likes` | 点赞 +1，返回新的累计数 |
| POST | `/api/projects/{slug}/comments` | 写一条留言，body `{"name": "...", "body": "..."}` |
| GET | `/api/comments` | 全部留言（从新到旧）+ 每个项目的赞数与条数，管理页用 |
| DELETE | `/api/comments/{id}` | 删一条留言 |
| GET | `/api/photos` | 当前照片，**按影像页实际会显示的顺序** |
| POST | `/api/photos` | 存一张（multipart 的 `file`），一律裁成正方形 |
| PUT | `/api/photos/order` | 换顺序，body `{"order": ["01-x.jpg", ...]}` |
| POST | `/api/photos/normalize` | 按当前顺序统一编号 |
| DELETE | `/api/photos/{name}` | 删一张 |
| GET | `/media/photos/{name}` | 照片本体（管理页的缩略图用它） |

⚠️ **四个写接口（上传 / 排序 / 统一编号 / 删除）返回的都是**完整清单**
（`store.list_photos()`），不是「刚操作的那一张」。管理页拿它就是一整份
`state.photos`，重画整个网格。上传曾经只回单张，页面读 `data.photos`
得到 `undefined`，于是「文件存进去了但页面报保存失败」—— 别再让它们不一致。

## 点赞与留言：SQLite

**库里只有这两样东西**，两张表（结构写在 `db.py` 的 SCHEMA 里）：

```
project_like     slug → 一个累计数
project_comment  slug → 很多条留言
```

### 项目正文**不在这里**

正文在前端 `src/data/projects.ts`，是排版不是记录：一句引子 + 一段正文 + 一句旁白，
外加按需出现的数字 / 短句 / 表格（`highlight: 12` 指向的是「整张表只亮这一行」——
它表达的是**版式意图**）。把它拆成五张表、或整块塞进一个 JSON 列，都只是多一份
要维护的状态，什么也没换来。

会增长、要持久化的东西才进库 —— 赞会往上加、留言是别人写的。这段取舍写在
`frontend/src/data/projects.ts` 的头部注释里。

**因此不建 `project` 表**：slug 的权威来源是前端那份数据文件，后端再抄一份名单，
等于加一个项目要改两个地方，两处迟早对不上。所以留言与点赞只存 slug 字符串，
写入时校验**格式**（`SLUG_RE`，`[a-z0-9-]`），不校验存在性 ——
前端的路由守卫已经保证只有真实的 slug 进得来。

### 防重复与防垃圾

- **点赞**（2026-09-20 改过）：后端给每个浏览器发一个**随机 id**，放在
  cookie `lizao_liker` 里（httponly，一年，站点是 http 所以不带 `secure`）。
  点赞时把它记进 `project_liker(slug, liker)`，主键就是去重 ——
  **同一个人再点不再加分**。`GET /reactions` 顺带回 `liked`，
  前端据此把那颗心画成实心砖红（`--heart`）。

  认的是**设备/浏览器**，不是人：换浏览器、清 cookie 就是另一个人，能再点一次。
  没有登录，也不存 IP / UA —— 能指向真人的东西不进库。对个人站来说这个强度
  是对的：赞表达的是「有几个人路过觉得不错」，不是一个要拿去对账的数字。

  前端的 localStorage（键 `lizao:liked:<slug>`）没删，但降级成了**本地兜底**：
  cookie 被禁时后端每次都认不出人，有它至少同一个浏览器还记着。
- **留言**：只做三件无需状态的检查 —— 长度（昵称 24 / 正文 500）、非空、
  以及「同一项目下 10 秒内**同样内容**的重复提交」会被挡掉（多半是双击）。
  **不做内容审核**：留言直接上墙，不合适的由管理页删掉。

### 没有 ORM，也没有迁移

只用了标准库 `sqlite3`。**没有迁移机制**：表结构变了就重建。
⚠️ `lizao.db` **不提交**（`.gitignore` 里 `*.db`），但里面的留言是真实数据 ——
要清空就删文件，别顺手把它当缓存删了。

## 顺序是怎么定的

**编号前缀。** `07-foo.jpg` 里的 `07` 就是它在照片墙上的位置 ——
没有第二份顺序清单，多存一份迟早会和文件名对不上。

管理页拖完（或点完 ← →）→ 后端按新顺序给文件重编号。这和前端的排序规则是同一个
约定（`localeCompare(..., { numeric: true })`），`store.py` 的 `natural_key` 是它的
Python 版。

改名走**两趟**（先全改成临时名、再改成最终名）：一趟会撞车，
`01-a.jpg` 要变 `02-a.jpg` 时 `02-b.jpg` 正占着这个位置。
`scripts/check_store.py` 专门钉住这条。

⚠️ 两边的排序**只对「以 `NN-` 开头」的文件名保证一致**。手动丢进目录、没有编号的
文件，在中英混排时两边会不同 —— 中文排序把汉字排在拉丁字母**前面**，而 Python 按
码点比是反的。管理页因此会在检测到这种文件时弹一条提示，点「统一编号」就消掉了。

## 上传的正方形

前端拖拽裁好再传（正方形 JPEG），后端**不信任客户端**，拿到后再兜一道：
不是方的就居中裁成正方形。顺带还会：

- 按 **EXIF 摆正** —— 手机竖拍的照片文件里是横的，只在 EXIF 写了一句「转 90°」，
  不先摆正就去裁中心，裁出来是偏的
- 带透明的 PNG **垫白底**再转 RGB，不然透明区会变成黑块
- 长边上限 **1600**、质量 **85**，**只缩不放**（放大只会变糊还变大）
- 一律输出 `.jpg`

参数在 `store.py` 顶部，和 `scripts/optimize_photos.py` 那套同值。

## 环境变量

| 变量 | 谁在读 | 说明 |
|---|---|---|
| `PHOTOS_DIR` | `store.py` | 覆盖照片目录（`scripts/check_store.py` 用它跑临时目录） |
| `DATABASE_URL` | `db.py` | 只认 `sqlite:///...`，相对路径相对 **backend/** 解析。默认 `backend/lizao.db` |
| `CORS_ORIGINS` | `main.py` | 逗号分隔。不配就只允许 `localhost:5173`。走 vite 代理时用不上（同源） |

`.env.example` 里的 `MEDIA_ROOT` 仍然**没有人读** —— 照片目录由 `PHOTOS_DIR` 定。

## 没有的东西（别照着旧规划找）

本文件早先规划过 `app/models/ + database.py + media/` 那一套分层。**仍然没有引入**：

- SQLite 接进来了，但**是平的** —— `db.py`（连接 + 建表）+ `reactions.py`（读写），
  两个文件放在 backend 根下，没有 `app/` 包、没有 models / schemas / crud 这些层。
  查询就那么几种，分层只会让改一个字段要动三个地方。
- **没有 Pydantic 的响应模型** —— 返回的就是 `store.py` / `reactions.py` 里那个 dict，
  管理页和前端直接读。前端那边有 `types/reaction.ts` 守着形状，中间再插一层
  schema 是重复劳动。唯一的入参模型是 `CommentPayload`（留言），因为要校验。
- **照片仍然不进库**（理由见开头那段引用）。
- **项目正文曾经进过库**，后来又搬回前端了 —— 要考古去 `git log`。
  别照着那版的 README 找 `projects.py` / `scripts/projects.seed.json`。
