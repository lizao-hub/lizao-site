"""
FastAPI 后端。两件事：**影像页的照片管理页**、**项目页的点赞与留言**。

启动：

    cd backend
    uv sync
    uv run uvicorn main:app --reload --port 8000

打开 http://localhost:8000 是照片管理页；接口文档在 http://localhost:8000/docs。

## 它管什么

- **照片**（`store.py`）：上传的图裁成正方形、压到 MAX_SIDE、存进 `data/photos/`
  （运行时由上面的 mount 直接发出去，传完刷新影像页就能看到，不用重新构建）。
  **只有三个接口：列、传、删。** 顺序不可调 —— 它就是上传的先后，
  编码在文件名的编号前缀里（见 store.py 顶部）。
- **点赞与留言**（`reactions.py` + `db.py`）：**进 SQLite**，这是库里唯一的内容。
  它们按 slug 挂在项目上，一个 slug 一行累计数 + 很多条留言。

"""

from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Request, Response, UploadFile
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
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.mount("/media/photos", StaticFiles(directory=ensure_dir(store.photos_dir())), name="photos")


class CommentPayload(BaseModel):
    """一条留言。昵称与正文都必填 —— 留言区不做匿名到连名字都没有的那一种。"""

    name: str
    body: str


# ---------- 点赞的人是谁 ----------
#
# 没有登录，所以认的是**这个浏览器**：一个随机 id，放在 cookie 里。
# 不是账号、不存 IP、不存 UA —— 能指向真人的东西不进库（见 reactions.py 顶部）。
# 换浏览器 / 清 cookie 就是另一个人，能再点一次，这是有意的。
LIKER_COOKIE = "lizao_liker"
LIKER_MAX_AGE = 60 * 60 * 24 * 365  # 一年

# uuid4().hex 的形状。cookie 是客户端能改的东西，只认这个格式，别的当没有。
LIKER_RE = re.compile(r"^[0-9a-f]{32}$")


def liker_id(request: Request, response: Response) -> str:
    """
    读这次请求的点赞人 id；没有（或者格式不对）就现发一个，写进响应。

    所以**第一次进详情页就已经有身份了** —— 不用等他点赞。
    """
    existing = (request.cookies.get(LIKER_COOKIE) or "").strip().lower()
    if LIKER_RE.match(existing):
        return existing

    fresh = uuid4().hex
    response.set_cookie(
        LIKER_COOKIE,
        fresh,
        max_age=LIKER_MAX_AGE,
        path="/",
        httponly=True,  # 前端不需要读它 —— 「我点过没有」由接口回的 liked 说了算
        samesite="lax",
        # 站点现在是 http（没有 TLS），不能加 secure，否则 cookie 根本存不下来；
        # 哪天上了 HTTPS 再打开这一行。
        # secure=True,
    )
    return fresh


# 管理页：本地 dev 在 `/` 与 `/admin` 都能进；生产由下面的 SPA 块接管 `/`，
# 管理页只留在 `/admin`（带删除接口，不该和公开站点抢根路径）。
@app.get("/admin", include_in_schema=False)
def admin_page() -> FileResponse:
    return FileResponse(ADMIN_PAGE, media_type="text/html")


# ---------- 点赞与留言 ----------


@app.get("/api/projects/{slug}/reactions")
def get_reactions(slug: str, request: Request, response: Response) -> dict:
    """
    一个项目的点赞数与留言。**详情页一次请求就够**，所以合成一个返回值：

        { "slug": "...", "likes": 3, "liked": false, "comments": [ ... ] }

    `liked` 是「**你**点过没有」（按 cookie 里那个 id 查 `project_liker`），
    前端拿它决定那颗心画不画成红色。留言按时间从旧到新 ——
    读的顺序就是对话的顺序。
    """
    if not repo.is_valid_slug(slug):
        raise HTTPException(status_code=404, detail="没有这个项目")
    liker = liker_id(request, response)
    conn = db.connect()
    try:
        return repo.get_reactions(conn, slug, liker)
    finally:
        conn.close()


@app.post("/api/projects/{slug}/likes")
def post_like(slug: str, request: Request, response: Response) -> dict:
    """
    点赞 +1，返回 `{ likes, liked }`。

    **同一个人只算一次**：认的是 cookie 里那个 id，重复提交不再加分
    （`project_liker` 的主键就是 `(slug, liker)`），但依然回 `liked: true` ——
    前端要把心画成红的。为什么这么选，写在 `reactions.py` 顶部。
    """
    if not repo.is_valid_slug(slug):
        raise HTTPException(status_code=404, detail="没有这个项目")
    liker = liker_id(request, response)
    conn = db.connect()
    try:
        return {"slug": slug, "likes": repo.add_like(conn, slug, liker), "liked": True}
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


# 在 FastAPI 中，file: UploadFile = File(...) 这个写法其实是由类型提示（Type Hint）、默认参数（Default Value）和参数验证（Validation）三部分组成的。
# 我们可以把它拆解开来，一步步解释它的作用：
# 1. File(...) —— 告诉 FastAPI 这是一个文件（表单字段）
# 在 FastAPI 的路径操作函数中，参数的默认值决定了 FastAPI 如何解析它：
# 如果参数没有默认值，或者默认值是 None，FastAPI 默认会从 URL 路径、查询字符串（?key=value）或 JSON 请求体 中寻找这个参数。
# File(...) 是一个特殊的类，当把它作为参数的默认值时，是在明确告诉 FastAPI：
# “这个参数 file 需要从 multipart/form-data（表单数据）中获取，并且它是一个文件。”
# FastAPI 看到它后，会自动处理上传文件的解析，并把二进制数据读取为 UploadFile 对象。
# 2. UploadFile —— 告诉 FastAPI 返回什么类型的对象
# UploadFile 是 FastAPI 内部封装的一个对象（基于 Starlette 框架），它代表了一个上传的文件。
# 它提供了一些非常方便的方法，比如：
# await file.read()：异步读取文件的所有二进制内容（比如你代码里用到的）。
# file.filename：获取原始文件名。
# file.content_type：获取文件的 MIME 类型（如 image/jpeg）。
# 3. = ...（三个点） —— 声明这个参数是【必填】的
# 在 Python 的 typing 和 pydantic（FastAPI 底层用的验证库）中，...（即 Python 内置的省略号 Ellipsis）代表这是一个必填项，不允许为空或缺失。
# File(...) 的意思是：这个文件是必须上传的，不能没有。如果请求中没有上传文件，FastAPI 会直接拦截并返回 422 Unprocessable Entity 错误。
# 如果写成 File(None)，那就表示文件是可选的，可以不传。



@app.post("/api/photos", status_code=201)
async def upload_photo(file: UploadFile = File(...)) -> dict:
    """
    存一张方图，**返回整个清单**（和删除那个一致）。

    """
    data = await file.read()
    try:
        store.save_photo(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"这不是一张能读的图片：{exc}") from exc
    return store.list_photos()


@app.delete("/api/photos/{name}")
def delete_photo(name: str) -> dict:
    try:
        store.delete_photo(name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="没有这张照片") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return store.list_photos()


# ---------- 生产托管：构建好的前端（dist） ----------
# 只在 dist 目录存在时接管根路径与未匹配路由（SPA 回退到 index.html）。
# 本地 dev 没有 dist，仍走上面的 `/admin` 管理页。
# 可用环境变量 DIST_DIR 指向任意位置的 dist（部署时把 dist 放到别处用得上）。
_DIST_RAW = os.environ.get("DIST_DIR")
DIST_DIR = (
    Path(_DIST_RAW).expanduser().resolve()
    if _DIST_RAW
    else Path(__file__).resolve().parent.parent / "dist"
)

if DIST_DIR.is_dir():
    _spa_assets = DIST_DIR / "assets"
    if _spa_assets.is_dir():
        # 构建产物里的 JS/CSS/图片都在 /assets 下，直接按文件发（不走回退）。
        app.mount("/assets", StaticFiles(directory=_spa_assets), name="spa-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_index(full_path: str) -> FileResponse:
        # history 模式下刷新 /projects/foo 这类深链接要回 index.html，
        # 否则会 404。/api、/media、/assets、/admin 都已先被上面的路由/mount 接走。
        return FileResponse(DIST_DIR / "index.html", media_type="text/html")
else:
    @app.get("/", include_in_schema=False)
    def admin_index() -> FileResponse:
        return FileResponse(ADMIN_PAGE, media_type="text/html")
