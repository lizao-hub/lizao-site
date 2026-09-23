# backend

FastAPI 后端。前端在 `../frontend/`。

两件事：

1. **影像页的照片管理页** —— 加图、裁成正方形、删除（`gallery.py`，不进库，顺序=上传先后）；
2. **留言页的留言** —— 存在 SQLite 里，由 `/api/comments` 收发
   （`db.py` + `guestbook.py`）。

（**点赞**曾经是第 2 件事的一半：一张累计表、一张认人表、一个 httponly cookie。
 2026-09-23 整块下线，旧表启动时 DROP；那段取舍写在 `guestbook.py` 顶部。）

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
├── gallery.py                照片库：读写、方形化、编号。文件操作的逻辑都在这
├── db.py                   SQLite：连接 + 建表（表结构就写在里面的 SCHEMA）
├── guestbook.py            留言的读写（**库里只有这个**）
├── admin/index.html        管理页。单文件、自包含，没有构建步骤也没有前端依赖
├── lizao.db                SQLite 文件（**不提交** —— 里面的留言是真实数据，别删）
├── scripts/
│   └── check_gallery.py    gallery.py 的自检：uv run python scripts/check_gallery.py
```

## 接口

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/` | 管理页 |
| GET | `/api/comments` | 全部留言，**从旧到新** —— 留言页与管理页共用 |
| POST | `/api/comments` | 写一条留言，body `{"name": "...", "body": "..."}` |
| DELETE | `/api/comments/{id}` | 删一条留言（管理页用） |
| GET | `/api/photos` | 当前照片，**按影像页实际会显示的顺序**（= 上传先后，不可调） |
| POST | `/api/photos` | 存一张（multipart 的 `file`），一律裁成正方形，编号接在最大值后面 |
| DELETE | `/api/photos/{name}` | 删一张 |
| GET | `/media/photos/{name}` | 照片本体（管理页的缩略图用它） |

⚠️ **两个写接口（上传 / 删除）返回的都是完整清单**（`gallery.list_photos()`），
不是「刚操作的那一张」。管理页拿它就是一整份 `state.photos`，重画整个网格。
上传曾经只回单张，页面读 `data.photos` 得到 `undefined`，
于是「文件存进去了但页面报保存失败」—— 别再让它们不一致。

**顺序不可调**，这是有意的。照片只有「列 / 传 / 删」三种动作，没有重排接口 ——
顺序就是上传的先后：`save_photo` 给每张编上「已有的最大编号 + 1」，
两边都按这个编号排。多存一份「顺序表」迟早会和文件名对不上
（旧版 `PUT /api/photos/order` 就是干这个的，已删）。

## 留言：SQLite

**库里只有这一样东西**，一张表（结构写在 `db.py` 的 SCHEMA 里）：

```
comment   一条留言一行：id / name / body / created_at
```

### 它不按项目分

曾经叫 `project_comment`、用 `slug` 指向一个项目 —— 那是「留言区塞在项目详情页
底下」留下的形状。留言独立成一页（屋内那叠书点开的 `/guestbook`）之后就没意义了：
一条「网站做得不错」并不属于某个项目。

### 项目正文**不在这里**

正文在前端 `src/data/projects.ts`，是排版不是记录：一句引子 + 一段正文 + 一句旁白，
外加按需出现的数字 / 短句 / 表格（`highlight: 12` 指向的是「整张表只亮这一行」——
它表达的是**版式意图**）。把它拆成五张表、或整块塞进一个 JSON 列，都只是多一份
要维护的状态，什么也没换来。

会增长、要持久化的东西才进库 —— 留言是别人写的。这段取舍写在
`frontend/src/data/projects.ts` 的头部注释里。

**因此也不建 `project` 表**：正文不在库里，留言也不再指向项目，两边没有接缝了。

### 防垃圾

- **留言**：只做三件无需状态的检查 —— 长度（昵称 24 / 正文 500）、非空、
  以及「10 秒内**同样内容**的重复提交」会被挡掉（多半是双击）。
  **不做内容审核**：留言直接上墙，不合适的由管理页删掉。
- **没有点赞了。** 那个功能为了「一个人只算一次」养了一整套东西（cookie、
  随机 id、认人表、前端 localStorage），换来一个没人对账的数字。要恢复它，
  去 `git log -S project_liker` 看当时的实现与取舍。

### 没有 ORM，也没有迁移

只用了标准库 `sqlite3`。**没有迁移机制**：表结构变了就重建。
⚠️ `lizao.db` **不提交**（`.gitignore` 里 `*.db`），但里面的留言是真实数据 ——
要清空就删文件，别顺手把它当缓存删了。

唯一的例外是 `db.init_db()` 里那几行 `DROP TABLE IF EXISTS`：它们清掉的是
**已经不存在的功能**留下的三张旧表（见 `LEGACY_TABLES`）。**那一小段是一向的、
不可逆的**，写成 `IF EXISTS` 所以反复启动是空转。

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

参数在 `gallery.py` 顶部。

## 环境变量

| 变量 | 谁在读 | 说明 |
|---|---|---|
| `PHOTOS_DIR` | `gallery.py` | 覆盖照片目录（`scripts/check_gallery.py` 用它跑临时目录） |
| `DATABASE_URL` | `db.py` | 只认 `sqlite:///...`，相对路径相对 **backend/** 解析。默认 `backend/lizao.db` |
| `CORS_ORIGINS` | `main.py` | 逗号分隔。不配就只允许 `localhost:5173`。走 vite 代理时用不上（同源） |
| `DIST_DIR` | `main.py` | 构建好的前端（`dist`）位置。默认仓库根的 `dist/`；它存在才接管 `/` 与 SPA 回退 |

## 没有的东西（别照着旧规划找）

本文件早先规划过 `app/models/ + database.py + media/` 那一套分层。**仍然没有引入**：

- SQLite 接进来了，但**是平的** —— `db.py`（连接 + 建表）+ `guestbook.py`（读写），
  两个文件放在 backend 根下，没有 `app/` 包、没有 models / schemas / crud 这些层。
  查询就那么几种，分层只会让改一个字段要动三个地方。
- **没有 Pydantic 的响应模型** —— 返回的就是 `gallery.py` / `guestbook.py` 里那个 dict，
  管理页和前端直接读。前端那边有 `types/guestbook.ts` 守着形状，中间再插一层
  schema 是重复劳动。唯一的入参模型是 `CommentPayload`（留言），因为要校验。
- **照片仍然不进库**（理由见开头那段引用）。
- **项目正文曾经进过库**，后来又搬回前端了 —— 要考古去 `git log`。
  别照着那版的 README 找 `projects.py` / `scripts/projects.seed.json`。
