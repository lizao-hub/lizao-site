"""
FastAPI 后端。两件事：**影像页的照片管理页**、**项目页的点赞与留言**。

启动：

    cd backend
    uv sync
    uv run uvicorn main:app --reload --port 8000

打开 http://localhost:8000 是照片管理页；接口文档在 http://localhost:8000/docs。

## 它管什么

- **照片**（`store.py`）：上传的图裁成正方形、压到 MAX_SIDE、存进
  `frontend/src/assets/photos/`，按拖出来的顺序给文件重编号。
  数据就是目录里那几个文件，**顺序就是文件名里的编号**，不进库。
- **点赞与留言**（`reactions.py` + `db.py`）：**进 SQLite**，这是库里唯一的内容。
  它们按 slug 挂在项目上，一个 slug 一行累计数 + 很多条留言。

## 库里**没有**项目正文

项目内容在前端 `src/data/projects.ts`，是排版不是记录（一句引子 + 一段正文 +
一句旁白 + 按需出现的数字 / 表格）。把它拆成五张表、或整块塞进 JSON 列，
都只是多一份要维护的状态。会增长、要持久化的东西才进库 ——
点赞会和留言就是这种东西。这段取舍写在那个数据文件的头部注释里。

所以 slug 只做**格式**校验，不查「这个项目存不存在」：
名单的权威来源是前端那份数据文件，后端不抄第二份。
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import db
import reactions as repo
import store

ADMIN_PAGE = Path(__file__).resolve().parent / "admin" / "index.html"


def ensure_dir(path: Path) -> Path:
    """StaticFiles 在目录不存在时会直接抛错、服务起不来，所以先建出来。"""
    path.mkdir(parents=True, exist_ok=True)
    return path


@asynccontextmanager
async def lifespan(_: FastAPI):
    """启动时建表。表已经存在就跳过，所以反复重启是安全的。"""
    conn = db.connect()
    try:
        db.init_db(conn)
    finally:
        conn.close()
    yield


app = FastAPI(
    title="lizao-site 后台",
    description="影像页的照片管理，以及项目页的点赞与留言（SQLite）。",
    lifespan=lifespan,
)

# 跨域：走 vite 代理时用不上（同源），但直接把 dev server 指向 8000 时要有。
# CORS_ORIGINS 没配就只允许本机那两个常见端口。
origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.mount("/media/photos", StaticFiles(directory=ensure_dir(store.photos_dir())), name="photos")


class OrderPayload(BaseModel):
    """新的顺序，元素是磁盘上的文件名。"""

    order: list[str]


class CommentPayload(BaseModel):
    """一条留言。昵称与正文都必填 —— 留言区不做匿名到连名字都没有的那一种。"""

    name: str
    body: str


@app.get("/", include_in_schema=False)
def admin_page() -> FileResponse:
    return FileResponse(ADMIN_PAGE, media_type="text/html")


# ---------- 点赞与留言 ----------


@app.get("/api/projects/{slug}/reactions")
def get_reactions(slug: str) -> dict:
    """
    一个项目的点赞数与留言。**详情页一次请求就够**，所以合成一个返回值：

        { "slug": "...", "likes": 3, "comments": [ { id, name, body, createdAt } ] }

    留言按时间从旧到新 —— 读的顺序就是对话的顺序。
    """
    if not repo.is_valid_slug(slug):
        raise HTTPException(status_code=404, detail="没有这个项目")
    conn = db.connect()
    try:
        return repo.get_reactions(conn, slug)
    finally:
        conn.close()


@app.post("/api/projects/{slug}/likes")
def post_like(slug: str) -> dict:
    """
    点赞 +1，返回新的累计数。

    **防重复由浏览器负责**（localStorage，见前端 `data/reactions.ts`）：
    服务端只管累加，不记是谁点的。为什么这么选，写在 `reactions.py` 顶部。
    """
    if not repo.is_valid_slug(slug):
        raise HTTPException(status_code=404, detail="没有这个项目")
    conn = db.connect()
    try:
        return {"slug": slug, "likes": repo.add_like(conn, slug)}
    finally:
        conn.close()


@app.post("/api/projects/{slug}/comments", status_code=201)
def post_comment(slug: str, payload: CommentPayload) -> dict:
    """写一条留言。**直接上墙**，不审核 —— 不合适的由管理页删掉。"""
    if not repo.is_valid_slug(slug):
        raise HTTPException(status_code=404, detail="没有这个项目")

    name = payload.name.strip()
    body = payload.body.strip()
    if not name or not body:
        raise HTTPException(status_code=400, detail="昵称和正文都要写")

    conn = db.connect()
    try:
        return repo.add_comment(conn, slug, name, body)
    finally:
        conn.close()


# ---------- 留言的管理接口（管理页用） ----------


@app.get("/api/comments")
def list_comments() -> dict:
    """全部留言，从新到旧，跨项目。管理页用它列出待删的那些。"""
    conn = db.connect()
    try:
        return {
            "items": repo.all_comments(conn),
            "bySlug": repo.counts_by_slug(conn),
        }
    finally:
        conn.close()


@app.delete("/api/comments/{comment_id}")
def remove_comment(comment_id: int) -> dict:
    conn = db.connect()
    try:
        if not repo.delete_comment(conn, comment_id):
            raise HTTPException(status_code=404, detail="没有这条留言")
    finally:
        conn.close()
    return {"ok": True}


# ---------- 照片 ----------


@app.get("/api/photos")
def get_photos() -> dict:
    """当前照片，按影像页实际会显示的顺序。"""
    return store.list_photos()


@app.post("/api/photos", status_code=201)
async def upload_photo(file: UploadFile = File(...)) -> dict:
    """
    存一张方图，**返回整个清单**（和排序 / 统一编号 / 删除那三个一致）。

    前端已经拖拽裁好了再传（正方形 JPEG），这里还会再兜一道：
    不是正方形就居中裁成正方形。**不信任客户端**这条在图片上尤其要紧 ——
    裁歪一张只影响观感，但存进去一张 4:3 会把影像页的网格撑歪。

    ⚠️ 返回的是 `store.list_photos()` 而不是刚存的那一
    张：管理页上传完要立刻重画整个网格（新图要插在末尾、统计数字要变），
    而它拿 `state.photos` 直接 `.map`。返回单张会让它读到 `undefined`
    ——「上传成功但页面报保存失败」就是这么来的。四个写接口统一回清单，
    管理页就不用区分该读哪一个。
    """
    data = await file.read()
    try:
        store.save_photo(data, file.filename or "photo.jpg")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"这不是一张能读的图片：{exc}") from exc
    return store.list_photos()


@app.put("/api/photos/order")
def reorder_photos(payload: OrderPayload) -> dict:
    """按给定顺序重编号。顺序直接落在文件名上，没有第二份清单。"""
    try:
        store.reorder(payload.order)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return store.list_photos()


@app.post("/api/photos/normalize")
def normalize_photos() -> dict:
    """按当前顺序统一编号（把没有 `NN-` 前缀的旧文件收进编号体系）。"""
    store.normalize()
    return store.list_photos()


@app.delete("/api/photos/{name}")
def delete_photo(name: str) -> dict:
    try:
        store.delete(name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="没有这张照片") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return store.list_photos()
