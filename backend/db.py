"""
SQLite 连接与建表。

**只依赖标准库 `sqlite3`，没有 ORM。** 表结构就写在下面这个 SCHEMA 里。

库里只放**会增长的东西**：留言。

连接怎么开：`connect()` 每次新建（SQLite 在本地就是开个文件，开销可以忽略），
`PRAGMA foreign_keys` 现在库里没有外键所以用不上，但建表时顺手开着，
以后加关联表不会漏。
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

# 数据库文件。DATABASE_URL 只认 `sqlite:///...` 这一种写法；
# 相对路径相对 **backend/** 解析，不跟着当前工作目录跑。
_DEFAULT_DB = Path(__file__).resolve().parent / "lizao.db"


def db_path() -> Path:
    """数据库文件的位置。环境变量 `DATABASE_URL` 可以覆盖。"""
    url = os.environ.get("DATABASE_URL", "").strip()
    if url.startswith("sqlite:///"):
        raw = url[len("sqlite:///") :]
        # sqlite:///:memory: 是特例，测试时用
        if raw == ":memory:":
            return Path(":memory:")
        path = Path(raw)
        return path if path.is_absolute() else Path(__file__).resolve().parent / path
    return _DEFAULT_DB


SCHEMA = """
-- 留言。**站点级的一池**，不按项目分。
--
-- 曾经叫 project_comment、用 `slug` 指向一个项目：那是「留言区顺手塞进项目详情页」
-- 留下的形状。留言独立成一页之后那个外键就没了意义 —— 一条「网站做得不错」
-- 并不属于某个项目（见 guestbook.py 顶部）。
CREATE TABLE IF NOT EXISTS comment (
    id         INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    -- ISO 8601，UTC。前端自己转成当地时间显示
    created_at TEXT    NOT NULL
);

-- 这张表只按时间读一次（页面从旧到新、管理页从新到旧，是同一个查询的两个方向），
-- 所以这一条是唯一有用的索引。
CREATE INDEX IF NOT EXISTS idx_comment_created ON comment(created_at);
"""

# 已经废掉的表。它们没有读者也没有写者了，启动时顺手清掉。
#
#   project_like    一个项目的点赞累计数
#   project_liker   谁点过（cookie 里那个随机 id）
#   project_comment 按 slug 挂在项目上的留言
#
# ⚠️ **删了就找不回来。** 这是 owner 明确要的：点赞整个功能下线，旧的留言也不要了
# （新页面是全新的一池）。写成 DROP IF EXISTS，所以反复重启是安全、空转的。
# 这段是**一次性迁移**，生产库跑过一次之后就永远什么也不做 —— 但别删：
# 部署时可能从旧版本升上来。
LEGACY_TABLES = ("project_like", "project_liker", "project_comment")


def connect() -> sqlite3.Connection:
    """开一个连接。行工厂每次都要设，SQLite 不记这些。"""
    path = db_path()
    if str(path) != ":memory:":
        path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """建表 + 清掉废掉的表。已经存在就跳过（`IF NOT EXISTS`），所以可以反复跑。"""
    conn.executescript(SCHEMA)
    for table in LEGACY_TABLES:
        conn.execute(f"DROP TABLE IF EXISTS {table}")
    conn.commit()
