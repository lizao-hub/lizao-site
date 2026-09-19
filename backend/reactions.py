"""
点赞与留言的读写。**这是库里唯一的内容。**

两张表（`db.py` 里有 schema）：

    project_like     slug → 一个累计数
    project_comment  slug → 很多条留言

关于点赞的**防重复**：存在一个诚实的取舍里 ——

- 要真的防住，就得知道「是谁」。记 IP 是最省事的一种，但同一个 WiFi 下
  的人会互相挡掉，而且要在库里存一份能指向人的东西；
  记账号则要登录，为一个点赞入口做登录太重了。
- 所以计数是**服务端累加**、「我点过了」这件事由**浏览器的 localStorage**
  记住（前端 `data/reactions.ts`）。清了缓存或者换个浏览器可以再点一次。

  对个人站来说这个强度是对的：点赞表达的是「有几个人路过觉得不错」，
  不是一个要拿去对账的数字。真到了有人刷的地步，再上 IP 指纹也不迟。

关于留言的**防垃圾**：只做三件无需状态的检查 ——
长度、非空、以及「同一项目下 10 秒内重复提交同样的一句话」会被挡掉
（多半是双击或者网络重试）。**不做内容审核**：留言直接上墙，
不合适的由管理页删掉。这是你在两个选项里选的那一种。
"""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timedelta, timezone

# slug 的**格式**。注意这里不校验「这个项目存在不存在」——
# 名单的权威来源是前端那份数据文件，后端不该再抄一份（见 db.py 顶部）。
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")

MAX_NAME = 24
MAX_BODY = 500

# 同一项目下，这么短时间内重复提交**同样内容**的留言会被挡掉
DUPLICATE_WINDOW = timedelta(seconds=10)


def is_valid_slug(slug: str) -> bool:
    return bool(SLUG_RE.match(slug))


def _now() -> str:
    """当下，ISO 8601，UTC。前端自己转本地时间显示。"""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _row_to_comment(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "slug": row["slug"],
        "name": row["name"],
        "body": row["body"],
        "createdAt": row["created_at"],
    }


def get_reactions(conn: sqlite3.Connection, slug: str) -> dict:
    """一个项目的点赞数与留言。**详情页一次请求就够**，所以合成一个。"""
    likes = conn.execute("SELECT count FROM project_like WHERE slug = ?", (slug,)).fetchone()
    rows = conn.execute(
        "SELECT * FROM project_comment WHERE slug = ? ORDER BY created_at, id", (slug,)
    ).fetchall()
    return {
        "slug": slug,
        "likes": likes["count"] if likes else 0,
        "comments": [_row_to_comment(row) for row in rows],
    }


def add_like(conn: sqlite3.Connection, slug: str) -> int:
    """
    点赞 +1，返回新的累计数。

    一条 UPSERT 而不是「先 SELECT 再 INSERT/UPDATE」：
    两个请求同时进来时后者会算丢一次。项目没人点赞时表里还没有这一行，
    所以默认值要写 0 而不是 1。
    """
    conn.execute(
        """
        INSERT INTO project_like (slug, count) VALUES (?, 1)
        ON CONFLICT(slug) DO UPDATE SET count = count + 1
        """,
        (slug,),
    )
    conn.commit()
    return conn.execute("SELECT count FROM project_like WHERE slug = ?", (slug,)).fetchone()[
        "count"
    ]


def clean_text(value: str, limit: int) -> str:
    """
    留言的文本：去掉首尾空白、压掉连续的空行、截断到上限。

    不碰内容本身（不过滤词、不转义）—— 转义是前端模板的事，
    后端存 HTML 只会让人分不清哪一层该负责。
    """
    trimmed = re.sub(r"\n{3,}", "\n\n", value.strip())
    return trimmed[:limit]


def add_comment(conn: sqlite3.Connection, slug: str, name: str, body: str) -> dict:
    """写一条留言，返回存下来的那一条（带 id 与时间）。"""
    name = clean_text(name, MAX_NAME)
    body = clean_text(body, MAX_BODY)

    # 重复提交：同一个项目下，窗口期内内容完全一样的那条
    recent = conn.execute(
        "SELECT * FROM project_comment WHERE slug = ? AND body = ? ORDER BY id DESC LIMIT 1",
        (slug, body),
    ).fetchone()
    if recent is not None:
        stamp = datetime.fromisoformat(recent["created_at"])
        if datetime.now(timezone.utc) - stamp < DUPLICATE_WINDOW:
            return _row_to_comment(recent)

    cursor = conn.execute(
        "INSERT INTO project_comment (slug, name, body, created_at) VALUES (?, ?, ?, ?)",
        (slug, name, body, _now()),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM project_comment WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    return _row_to_comment(row)


def delete_comment(conn: sqlite3.Connection, comment_id: int) -> bool:
    """删一条留言（管理页用）。返回有没有真的删掉东西。"""
    cursor = conn.execute("DELETE FROM project_comment WHERE id = ?", (comment_id,))
    conn.commit()
    return cursor.rowcount > 0


def all_comments(conn: sqlite3.Connection, limit: int = 200) -> list[dict]:
    """管理页要的那张清单：从新到旧，跨项目。"""
    rows = conn.execute(
        "SELECT * FROM project_comment ORDER BY created_at DESC, id DESC LIMIT ?", (limit,)
    ).fetchall()
    return [_row_to_comment(row) for row in rows]


def counts_by_slug(conn: sqlite3.Connection) -> dict[str, dict]:
    """管理页顶上那两行数：每个项目各有几条留言、几个赞。"""
    likes = {row["slug"]: row["count"] for row in conn.execute("SELECT * FROM project_like")}
    comments: dict[str, int] = {}
    for row in conn.execute("SELECT slug, COUNT(*) AS n FROM project_comment GROUP BY slug"):
        comments[row["slug"]] = row["n"]
    return {
        slug: {"likes": likes.get(slug, 0), "comments": comments.get(slug, 0)}
        for slug in sorted(set(likes) | set(comments))
    }
