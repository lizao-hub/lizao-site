"""
留言的读写。**这是库里唯一的内容。**

一张表（`db.py` 里有 schema）：

    comment   一条留言一行：谁、写了什么、什么时候

## 它为什么不再按项目分

这两样东西曾经挂在项目上（`project_comment.slug`），是因为留言区当初是
**塞在项目详情页底下**的一块。留言独立成一页（屋里那叠书点开的 `/guestbook`）
之后，那个外键就没有意义了 —— 一条「网站做得不错」并不属于某个项目，
而为了它去维护一张「slug → 项目」的对照表，等于加一个项目要改两个地方。

## 点赞为什么没了

原来这里还有 `project_like`（累计数）+ `project_liker`（谁点过）。
那是全站最重的一块小功能：一个 httponly cookie、一个随机 id、一张认人表、
前端一份 localStorage 兜底，全都为了「一个人只算一次」。而它换来的
只是一个没人会去对账的数字。2026-09-23 按 owner 的要求整块删掉，
三张旧表在 `db.init_db()` 里一并 DROP（不可逆，见那里的说明）。

## 防垃圾

只做三件无需状态的检查 —— 长度、非空、以及「10 秒内重复提交同样的一句话」
会被挡掉（多半是双击或者网络重试）。**不做内容审核**：留言直接上墙，
不合适的由管理页删掉。这是你在两个选项里选的那一种。
"""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timedelta, timezone

MAX_NAME = 24
MAX_BODY = 500

# 这么短时间内重复提交**同样内容**的留言会被挡掉
DUPLICATE_WINDOW = timedelta(seconds=10)


def _now() -> str:
    """当下，ISO 8601，UTC。前端自己转本地时间显示。"""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _row_to_comment(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "body": row["body"],
        "createdAt": row["created_at"],
    }


def list_comments(conn: sqlite3.Connection, limit: int = 200) -> list[dict]:
    """
    全部留言，**从旧到新** —— 读的顺序就是对话的顺序，留言页要的就是它。

    管理页要的是反过来（最近的多半才是要处理的那条），它自己在渲染时倒一下：
    顺序只有这一个出口，别在这里再开一个「按需倒序」的参数。
    """
    rows = conn.execute(
        "SELECT * FROM comment ORDER BY created_at, id LIMIT ?", (limit,)
    ).fetchall()
    return [_row_to_comment(row) for row in rows]


def clean_text(value: str, limit: int) -> str:
    """
    留言的文本：去掉首尾空白、压掉连续的空行、截断到上限。

    不碰内容本身（不过滤词、不转义）—— 转义是前端模板的事，
    后端存 HTML 只会让人分不清哪一层该负责。
    """
    trimmed = re.sub(r"\n{3,}", "\n\n", value.strip())
    return trimmed[:limit]


def add_comment(conn: sqlite3.Connection, name: str, body: str) -> dict:
    """写一条留言，返回存下来的那一条（带 id 与时间）。"""
    name = clean_text(name, MAX_NAME)
    body = clean_text(body, MAX_BODY)

    # 重复提交：窗口期内内容完全一样的那条
    recent = conn.execute(
        "SELECT * FROM comment WHERE body = ? ORDER BY id DESC LIMIT 1", (body,)
    ).fetchone()
    if recent is not None:
        stamp = datetime.fromisoformat(recent["created_at"])
        if datetime.now(timezone.utc) - stamp < DUPLICATE_WINDOW:
            return _row_to_comment(recent)

    cursor = conn.execute(
        "INSERT INTO comment (name, body, created_at) VALUES (?, ?, ?)",
        (name, body, _now()),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM comment WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return _row_to_comment(row)


def delete_comment(conn: sqlite3.Connection, comment_id: int) -> bool:
    """删一条留言（管理页用）。返回有没有真的删掉东西。"""
    cursor = conn.execute("DELETE FROM comment WHERE id = ?", (comment_id,))
    conn.commit()
    return cursor.rowcount > 0
