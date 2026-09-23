# backend

FastAPI 后端。前端在 `../frontend/`。

两件事：

1. **影像页的照片管理页** —— 加图、裁成正方形、删除（`store.py`，不进库，顺序=上传先后）；
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

照片存在**后端数据目录**，不在前端源码里：默认是仓库根的 `data/photos/`
（部署时即 `/srv/lizao/data/photos`），可用 `PHOTOS_DIR` 覆盖。

`main.py` 把这个目录挂到 `/media/photos/`；影像页在**运行时**向 `/api/photos`
拉清单，再用清单里的 `url` 取图（见 `frontend/src/views/GalleryView.vue`）。
于是后台上传一张、刷新影像页就能看到 —— **不用重新 build 前端**。

> 照片是**运行时数据**，不是构建产物。`data/photos/` 里的文件直接就是线上内容，
> 传 / 删立刻生效。早年它们曾放在 `frontend/src/assets/photos/` 由
> `import.meta.glob` 在构建期收进去，代价是每传一张都要重启 dev server 或
> 重新 build —— 已经改掉了，别照着旧说法找。

## 目录

```
backend/
├── main.py                 FastAPI 实例 + 路由（就这几个接口，没有分层）
├── store.py                照片库：读写、方形化、编号。文件操作的逻辑都在这
├── db.py                   SQLite：连接 + 建表（表结构就写在里面的 SCHEMA）
├── reactions.py            点赞与留言的读写（**库里只有这个**）
├── admin/index.html        管理页。单文件、自包含，没有构建步骤也没有前端依赖
├── lizao.db                SQLite 文件（**不提交** —— 里面的留言是真实数据，别删）
├── scripts/
│   └── check_store.py      store.py 的自检：uv run python scripts/check_store.py
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
| GET | `/api/photos` | 当前照片，**按影像页实际会显示的顺序**（= 上传先后，不可调） |
| POST | `/api/photos` | 存一张（multipart 的 `file`），一律裁成正方形，编号接在最大值后面 |
| DELETE | `/api/photos/{name}` | 删一张 |
| GET | `/media/photos/{name}` | 照片本体（管理页的缩略图用它） |

⚠️ **两个写接口（上传 / 删除）返回的都是完整清单**（`store.list_photos()`），
不是「刚操作的那一张」。管理页拿它就是一整份 `state.photos`，重画整个网格。
上传曾经只回单张，页面读 `data.photos` 得到 `undefined`，
于是「文件存进去了但页面报保存失败」—— 别再让它们不一致。

**顺序不可调**，这是有意的。照片只有「列 / 传 / 删」三种动作，没有重排接口 ——
顺序就是上传的先后：`save_photo` 给每张编上「已有的最大编号 + 1」，
两边都按这个编号排。多存一份「顺序表」迟早会和文件名对不上
（旧版 `PUT /api/photos/order` 就是干这个的，已删）。

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

**文件名就是一个自增 id：`1.jpg`、`2.jpg`、`3.jpg`……** 编号决定它站在第几张 ——
没有第二份顺序清单，多存一份迟早会和文件名对不上。

编号由 `save_photo` 分配（已有的最大编号 + 1），所以**顺序就是上传的先后，
而且不可调** —— 管理页没有拖拽，也没有重排接口。

编号是**身份，不是位置**：删掉 `1.jpg` 之后，下一张仍然是 `4.jpg`（1 / 2 / 3 里
最大是 3，再 +1），**洞不补**。好处是一张照片的 URL 一旦发出去就永久有效，
删别人不会让它改名。

影像页（`GalleryView.vue`）**不再自己排序**：它直接用 `list_photos()` 返回的
清单。于是全站只有 `natural_key` 一处决定照片站在哪，也就不会再出现
「管理页和影像页顺序不一致」。解析不出编号的杂文件（正常不该有）会垫在最后。

## 上传的正方形

管理页选完图**直接传原图**，裁成方形完全由后端 `_to_rgb_square()` 负责：
不是方的就居中裁成正方形。顺带还会：

- 按 **EXIF 摆正** —— 手机竖拍的照片文件里是横的，只在 EXIF 写了一句「转 90°」，
  不先摆正就去裁中心，裁出来是偏的
- 带透明的 PNG **垫白底**再转 RGB，不然透明区会变成黑块
- 长边上限 **1600**、质量 **85**，**只缩不放**（放大只会变糊还变大）
- 一律输出 `.jpg`

参数在 `store.py` 顶部。

## 环境变量

| 变量 | 谁在读 | 说明 |
|---|---|---|
| `PHOTOS_DIR` | `store.py` | 覆盖照片目录（`scripts/check_store.py` 用它跑临时目录） |
| `DATABASE_URL` | `db.py` | 只认 `sqlite:///...`，相对路径相对 **backend/** 解析。默认 `backend/lizao.db` |
| `CORS_ORIGINS` | `main.py` | 逗号分隔。不配就只允许 `localhost:5173`。走 vite 代理时用不上（同源） |
| `DIST_DIR` | `main.py` | 构建好的前端（`dist`）位置。默认仓库根的 `dist/`；它存在才接管 `/` 与 SPA 回退 |

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
