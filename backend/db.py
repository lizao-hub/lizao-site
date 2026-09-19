"""
SQLite 连接与建表。

**只依赖标准库 `sqlite3`，没有 ORM。** 表结构就写在下面这个 SCHEMA 里。

库里只放**会增长的东西**：一个项目的点赞数，和留言。
项目正文不在这里 —— 它在前端 `src/data/projects.ts`，因为正文是排版
（一句引子 + 一段正文 + 一句旁白 + 按需出现的数字 / 表格）而不是记录：
把它拆成五张表，或者整块塞进一个 JSON 列，除了多一份要维护的状态，
什么也没换来。这段取舍写在那个数据文件的头部注释里。

**为什么不建 project 表**：slug 的权威来源是前端那份数据文件。
后端再存一份名单，等于加一个项目要改两个地方，而且两处迟早会对不上。
所以留言与点赞只存 slug 字符串，写入时校验**格式**（`SLUG_RE`），
不校验存在性 —— 前端的路由守卫已经保证只有真实的 slug 进得来。

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
-- 一个项目一行。count 是一条累计值，不是「谁点了」的流水 ——
-- 「谁点了」在下面那张 project_liker 里。两张表不等价：
-- 早期只有累计数（那阵子记没点过靠浏览器），历史的那几个赞没有身份，
-- count 因此不能由 project_liker 的行数推导。
CREATE TABLE IF NOT EXISTS project_like (
    slug  TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

-- 谁点过赞。一行 = 一个项目的一个点赞人，主键就是去重本身。
--
-- 只存一个**随机 id**（后端发在 cookie 里的那个）：不存 IP、不存 UA、
-- 不存账号 —— 能指向一个真人的东西一概不进库。它识别的是「这个浏览器」，
-- 换浏览器 / 清 cookie 就是另一个人，这是有意的（见 reactions.py 顶部）。
CREATE TABLE IF NOT EXISTS project_liker (
    slug       TEXT NOT NULL,
    liker      TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (slug, liker)
);

CREATE TABLE IF NOT EXISTS project_comment (
    id         INTEGER PRIMARY KEY,
    slug       TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    -- ISO 8601，UTC。前端自己转成当地时间显示
    created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_slug ON project_comment(slug, created_at);
"""


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
    """建表。已经存在就跳过（`IF NOT EXISTS`），所以可以反复跑。"""
    conn.executescript(SCHEMA)
    conn.commit()
