"""
照片库。管的是**影像页真正读的那个目录** —— 部署上是 `/srv/lizao/data/photos`
（开发期 / 测试可用环境变量 `PHOTOS_DIR` 指到别的目录）。

这个目录经 FastAPI 挂到 `/media/photos/`，影像页（`GalleryView.vue`）在运行时
向 `/api/photos` 拉清单、`/media/photos/...` 取图 —— 后台上传一张、刷新影像页
就能看到，不用重新打包前端。

文件名就是**一个自增 id**：`1.jpg`、`2.jpg`、`3.jpg`…… 编号由 `save_photo`
分配（已有最大编号 +1），所以顺序就是**上传的先后**。

id 是「身份」不是「位置」：删掉 `1.jpg` 之后，下一张仍然是 `3.jpg`，
洞不补 —— 和数据库的自增主键一样。好处是删一张不会让别人的名字跟着变，
一张照片的 URL 一旦发出去就永久有效。

这个顺序**不可调** —— 整套接口只有「列 / 传 / 删」三种动作，没有重排。
文件名是顺序的唯一事实来源：多存一份清单迟早会和它对不上。
影像页（`GalleryView.vue`）也不再自己排序，直接用这里排好的清单，
于是全站只有 `natural_key` 一处决定照片站在哪。

**名字里不带原名** —— 这是有意的：原名（尤其手机相册的中文长名）会带来
一整套清洗、转义、编码的麻烦，而照片墙上认的是图，不是文件名。
"""

from __future__ import annotations

import io
import os
import re
from pathlib import Path

from PIL import Image, ImageOps

# ---------- 可调参数 ----------

# 长边（这里是正方形的边）上限。
# 影像页的格子只有约 286px 见方，1600 已经很富余，再大只是浪费流量。
MAX_SIDE = 1600
# 清晰度和体积的平衡点。
QUALITY = 85
# 单张上传的体积上限。手机原图十几 MB 是常事，给得宽一点，40MB 兜底。
MAX_UPLOAD_BYTES = 40 * 1024 * 1024

# 目录里认哪些扩展名。收窄到 jpg 是因为输出一律转成 JPEG ——
# 照片存 WebP/PNG 只会更大，而这里是照片。
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

# 输出扩展名
OUT_SUFFIX = ".jpg"

# ---------- 目录 ----------

# 部署环境照片真正落地的目录：`backend/` 的上一级 `data/photos`，
# 即服务器上的 `/srv/lizao/data/photos`。这样即使 systemd 漏配 `PHOTOS_DIR`，
# 默认也会写到正确位置，不会和线上照片库分裂。本地开发 / 测试可用 `PHOTOS_DIR`
# 指到别处覆盖它。
_DEFAULT_DIR = Path(__file__).resolve().parent.parent / "data" / "photos"

# Path(__file__).resolve().parent.parent 是相对的、会跟着代码位置走的 
#  - 本地：repo 根部叫 lizao-site → .../lizao-site/data/photos                                                                                           
#  - 服务器：repo 根部叫 lizao（或部署目录就是 /srv/lizao）→ /srv/lizao/data/photos                                                                      
                                                                                                                                                       
#  两处目录名不同（lizao-site vs lizao），是因为同一份代码被 clone/部署到了不同名字的父目录里，而不是代码里写死了某个名字。

# - 磁盘 data/photos/ = 存照片文件（JPEG 图）。                                                                                                         
#  - URL /media/photos/... = 存的是「能访问到那些照片的地址」，本身不是文件夹，是个入口。                                                                
#  - url 这个字符串 = 存在 /api/photos 返回的 JSON 里，不在 /media/photos 下。     
def photos_dir() -> Path:
    """照片目录。默认是 `/srv/lizao/data/photos`，可用环境变量 PHOTOS_DIR 覆盖。"""
    override = os.environ.get("PHOTOS_DIR")
    return Path(override).expanduser().resolve() if override else _DEFAULT_DIR


def ensure_dir() -> Path:
    directory = photos_dir()
    directory.mkdir(parents=True, exist_ok=True)
    return directory


# ---------- 文件名 ----------

# 裸数字：`7.jpg` 的 stem 是 `7`。名字里除了这个数字不该有别的东西，
# 所以正则两端卡死 —— `abc.jpg`、`7-copy.jpg` 都解析不出编号。
_ID = re.compile(r"^\d+$")


def natural_key(name: str) -> tuple:
    """
    排序键：文件名里的那个数字。

    必须是**按数值**比而不是按字典序 —— 字典序会把 `10.jpg` 排到 `2.jpg`
    前面，而这套顺序就是「上传的先后」，错了照片墙的顺序就乱了。

    解析不出数字的（手动丢进来的杂文件）排到最后：返回 `(1, 0)`，
    正常文件返回 `(0, id)`，元组首元素就把两拨分开了。
    这种情况不该出现 —— 照片只该由 `save_photo` 产生 —— 但真漏进来一个
    也不该让整个列表挂掉，更不该把它混进正常照片中间。
    """
    match = _ID.match(Path(name).stem)
    return (0, int(match.group())) if match else (1, 0)


def final_name(index: int, suffix: str = OUT_SUFFIX) -> str:
    """`7` -> `7.jpg`。"""
    return f"{index}{suffix}"


def _parse_index(name: str) -> int | None:
    """文件名里的编号；不是 `NN.jpg` 这种形状就返回 None。"""
    stem = Path(name).stem
    return int(stem) if _ID.match(stem) else None


def _is_photo(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in ALLOWED_SUFFIXES


def _existing_files() -> list[Path]:
    directory = photos_dir()
    if not directory.is_dir():
        return []
    return sorted((p for p in directory.iterdir() if _is_photo(p)), key=lambda p: natural_key(p.name))


# ---------- 读 ----------


def list_photos() -> dict:
    """
    当前照片，**按影像页实际会显示的顺序**返回，也就是上传的先后。

    `index` 是排好序之后的位置（1 起）。正常情况下它**就等于文件名的编号**
    —— 名字本就是自增 id，顺序就是 id 序。两者会分开的唯一情形是目录里混进了
    解析不出编号的杂文件（见 `natural_key`），那种垫到最后，
    这时它的 index 才是「它实际会出现在第几张」。
    """
    files = _existing_files()
    photos = []
    total = 0
    for position, path in enumerate(files, start=1):
        size = path.stat().st_size
        total += size
        photos.append(
            {
                "name": path.name,
                "index": position,
                "bytes": size,
                "url": f"/media/photos/{path.name}",
            }
        )
    return {
        "dir": str(photos_dir()),
        "photos": photos,
        "count": len(photos),
        "total_bytes": total,
        "max_side": MAX_SIDE,
        "quality": QUALITY,
    }


def next_index() -> int:
    """下一张该用的编号：已有的最大编号 + 1。一个都没有就从 1 开始。"""
    numbers = [i for i in (_parse_index(p.name) for p in _existing_files()) if i is not None]
    return max(numbers, default=0) + 1


# ---------- 写 ----------


def _to_rgb_square(img: Image.Image) -> Image.Image:
    """
    转成正方形 RGB。**这是「限制正方形」的兜底那一道** ——
    管理页已经在前端裁好了方图，这里是防它没裁或者裁歪。

    顺序要紧：先按 EXIF 摆正，再裁。手机竖拍的照片在文件里是横的，
    只在 EXIF 里写了一句「转 90°」；不先摆正就去裁中心，
    裁出来是偏的。
    """
    img = ImageOps.exif_transpose(img)

    if img.mode in ("RGBA", "LA", "P"):
        # 贴到白底上再转 RGB —— 直接 convert("RGB") 会把透明区变成黑块
        rgba = img.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        img = background
    else:
        img = img.convert("RGB")

    width, height = img.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    img = img.crop((left, top, left + side, top + side))

    # 只缩不放：原图比 MAX_SIDE 小就保持原样，放大只会变糊还变大
    if side > MAX_SIDE:
        img = img.resize((MAX_SIDE, MAX_SIDE), Image.LANCZOS)

    return img


def save_photo(data: bytes) -> dict:
    """存一张。`data` 是原始字节 —— 文件名由这里的编号决定，不取原名。"""
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError(f"文件超过 {MAX_UPLOAD_BYTES // 1024 // 1024}MB")
    if not data:
        raise ValueError("空文件")

    directory = ensure_dir()

    with Image.open(io.BytesIO(data)) as raw:
        img = _to_rgb_square(raw)
        index = next_index()
        name = final_name(index)
        target = directory / name
        img.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    return {
        "name": name,
        "index": index,
        "bytes": target.stat().st_size,
        "url": f"/media/photos/{name}",
    }


def delete_photo(name: str) -> None:
    """删一张。`name` 必须是目录里的裸文件名 —— 挡掉 `../` 这类穿越。"""
    if Path(name).name != name:
        raise ValueError("文件名不合法")

    target = photos_dir() / name
    if not target.is_file() or not _is_photo(target):
        raise FileNotFoundError(name)

    target.unlink()
