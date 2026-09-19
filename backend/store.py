"""
照片库。管的是**影像页真正读的那个目录** —— `frontend/src/assets/photos/`。

为什么是这个目录，而不是 `backend/media/`：
影像页的照片是 `import.meta.glob` 在**构建期**收进去的（见
`frontend/src/views/GalleryView.vue`），文件名就是顺序。让管理页直接往那个
目录写文件，前端**一行都不用改**，站点也仍然是纯静态的。
代价是传完要重启 dev server / 重新 build 才看得到 —— 这件事在管理页上写明了。

⚠️ 这是全站唯一一处「后端往前端源码目录写文件」的地方。它是个**本机工具**，
不是线上服务：真要上线，照片该挪到 `backend/media/` 由接口发 URL
（见 `backend/README.md` 的讨论），那时前端得改成运行时拉清单。

顺序怎么定：**编号前缀**。`07-foo.jpg` 里的 `07` 就是它在照片墙上的位置。
这和前端的排序规则是同一个约定 —— `GalleryView.vue` 用
`localeCompare(b, 'zh-Hans-CN', { numeric: true })`，本文件的 `natural_key`
是它的 Python 版，两边必须一致，否则管理页看到的顺序和影像页会对不上。
"""

from __future__ import annotations

import io
import os
import re
from pathlib import Path

from PIL import Image, ImageOps

# ---------- 可调参数 ----------

# 长边（这里是正方形的边）上限。和 scripts/optimize_photos.py 的 MAX_SIZE 同值：
# 影像页的格子只有约 286px 见方，1600 已经很富余，再大只是浪费流量。
MAX_SIDE = 1600
# 和 optimize_photos.py 的 QUALITY 同值。85 是清晰度和体积的平衡点。
QUALITY = 85
# 单张上传的体积上限。手机原图十几 MB 是常事，给得宽一点，40MB 兜底。
MAX_UPLOAD_BYTES = 40 * 1024 * 1024

# 前端 glob 认的扩展名（见 GalleryView.vue）。收窄到 jpg 是因为
# 输出一律转成 JPEG —— 照片存 WebP/PNG 只会更大，而这里是照片。
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

# 输出扩展名
OUT_SUFFIX = ".jpg"

# ---------- 目录 ----------

_DEFAULT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "src" / "assets" / "photos"


def photos_dir() -> Path:
    """照片目录。可以用环境变量 PHOTOS_DIR 覆盖（测试时会用）。"""
    override = os.environ.get("PHOTOS_DIR")
    return Path(override).expanduser().resolve() if override else _DEFAULT_DIR


def ensure_dir() -> Path:
    directory = photos_dir()
    directory.mkdir(parents=True, exist_ok=True)
    return directory


# ---------- 文件名 ----------


def natural_key(name: str) -> list:
    """
    自然排序键，`localeCompare(..., { numeric: true })` 的 Python 版。

    数字段按**数值**比，其余按字符比 —— 所以 `2-x` 排在 `10-x` 前面，
    和文件名给人的直觉一致（普通字典序会把 10 排到 2 前面）。

    每段包成 `(0, int)` / `(1, str)` 的元组，是为了让数字段永远排在字符段
    前面（等价于 JS 里数字排在汉字前面），同时避免 int 和 str 直接比较报错。

    ⚠️ **它只对「以 `NN-` 开头」的文件名保证和前端一致**，而本工具产出的
    每一个名字都是这个形状。这不是巧合：编号唯一，所以第一段就把顺序定死了，
    后面那几段根本不参与比较。

    没编号的文件（手动丢进目录的那种）可能对不上。实测：

        ['微信图片_x.jpg', 'photo.jpg']   # node 的 localeCompare(zh-Hans-CN)
        -> ['微信图片_x.jpg', 'photo.jpg']

    中文排序把汉字排在拉丁字母**前面**，而这里按码点比是 `photo` 在前
    （'p' = 112 < '微' = 24558）。这个差异不影响照片墙 —— 只要点一下
    管理页的「统一编号」，所有文件都进编号体系，双方就重新对齐了。
    所以 `list_photos` 会额外回报 `unnumbered`，让管理页把这件事说出来，
    而不是让它悄悄错位。
    """
    parts = re.findall(r"\d+|\D+", name.lower())
    return [(0, int(p)) if p.isdigit() else (1, p) for p in parts]


_PREFIX = re.compile(r"^(\d+)-")
_UNSAFE = re.compile(r'[\\/:*?"<>|\s]+')


def strip_prefix(stem: str) -> str:
    """去掉开头的 `NN-` 编号，留下真正的名字部分。"""
    return _PREFIX.sub("", stem)


def slugify(stem: str) -> str:
    """
    把文件名洗成安全的 slug。

    汉字**保留** —— 这个站的照片本来就是手机里带中文名的图，
    转成拼音或者 `photo` 只会让人认不出哪张是哪张。
    只挡掉路径上不能用的字符和空白。
    """
    cleaned = _UNSAFE.sub("-", strip_prefix(stem)).strip("-._")
    cleaned = re.sub(r"-{2,}", "-", cleaned)
    return cleaned[:48] or "photo"


def final_name(index: int, stem: str, suffix: str = OUT_SUFFIX) -> str:
    """`7` + `foo` -> `07-foo.jpg`。两位起步，超过 99 自然变三位。"""
    return f"{index:02d}-{slugify(stem)}{suffix}"


def _parse_index(name: str) -> int | None:
    match = _PREFIX.match(name)
    return int(match.group(1)) if match else None


def _is_photo(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in ALLOWED_SUFFIXES


def _existing_files() -> list[Path]:
    directory = photos_dir()
    if not directory.is_dir():
        return []
    return sorted((p for p in directory.iterdir() if _is_photo(p)), key=lambda p: natural_key(p.name))


# ---------- 读 ----------


def _dimensions(path: Path) -> tuple[int | None, int | None]:
    """只读文件头拿宽高，不解码整张图。读不出来就返回空，不让列表整个挂掉。"""
    try:
        with Image.open(path) as img:
            return img.size
    except Exception:
        return None, None


def list_photos() -> dict:
    """
    当前照片，**按影像页实际会显示的顺序**返回。

    `index` 是排好序之后的位置（1 起），不是文件名里那个编号 ——
    没编号的旧文件（比如直接丢进来的 `微信图片_xxx.jpg`）会排在最后，
    它的 index 才是「它实际会出现在第几张」。
    """
    files = _existing_files()
    photos = []
    unnumbered = []
    total = 0
    for position, path in enumerate(files, start=1):
        size = path.stat().st_size
        total += size
        width, height = _dimensions(path)
        prefix = _parse_index(path.name)
        if prefix is None:
            unnumbered.append(path.name)
        photos.append(
            {
                "name": path.name,
                "index": position,
                "prefix": prefix,
                "bytes": size,
                "width": width,
                "height": height,
                # 照片挂在 /media/photos/ 下 —— /media/ 这个前缀现在分给了
                # 照片与项目素材两个目录，见 main.py 的两处挂载。
                "url": f"/media/photos/{path.name}",
            }
        )
    return {
        "dir": str(photos_dir()),
        "photos": photos,
        "count": len(photos),
        # 没有编号的那些：顺序可能和影像页对不上，管理页要提示「统一编号」
        "unnumbered": unnumbered,
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


def save_photo(data: bytes, original_name: str) -> dict:
    """存一张。`data` 是原始字节，`original_name` 只用来取名字。"""
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError(f"文件超过 {MAX_UPLOAD_BYTES // 1024 // 1024}MB")
    if not data:
        raise ValueError("空文件")

    directory = ensure_dir()

    with Image.open(io.BytesIO(data)) as raw:
        img = _to_rgb_square(raw)
        index = next_index()
        name = final_name(index, Path(original_name).stem)
        target = directory / name
        img.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    return {
        "name": name,
        "index": index,
        "bytes": target.stat().st_size,
        "width": min(MAX_SIDE, img.width),
        "height": min(MAX_SIDE, img.height),
        "url": f"/media/photos/{name}",
    }


def reorder(names: list[str]) -> list[str]:
    """
    按给定顺序重排，方法**就是给文件重编编号**。

    没有第二份「顺序表」——文件名是顺序的唯一事实来源，
    因为前端只认文件名。多存一份清单迟早会和文件名对不上。

    改名分两趟：先全部改成临时名，再改成最终名。
    直接一趟会撞车 —— `01-a.jpg` 要变成 `02-a.jpg`，而 `02-b.jpg`
    正占着这个位置，系统会拒绝或者覆盖。
    """
    directory = ensure_dir()
    current = {p.name for p in _existing_files()}

    if sorted(names) != sorted(current):
        raise ValueError("顺序列表和目录里的文件对不上（可能刚被别处改过）")
    if len(set(names)) != len(names):
        raise ValueError("顺序列表里有重复")

    staged: list[tuple[Path, int, str, str]] = []
    try:
        for position, name in enumerate(names, start=1):
            source = directory / name
            # 临时名用 .tmp 后缀：它不在 ALLOWED_SUFFIXES 里，
            # 万一这中间正好有人跑构建，前端不会把半成品收进去
            temp = directory / f".__staging_{position:03d}.tmp"
            source.rename(temp)
            staged.append((temp, position, strip_prefix(source.stem), source.suffix.lower()))
    except Exception:
        for temp, position, stem, suffix in staged:
            temp.rename(directory / final_name(position, stem, suffix))
        raise

    for temp, position, stem, suffix in staged:
        temp.rename(directory / final_name(position, stem, suffix))

    return [p.name for p in _existing_files()]


def normalize() -> list[str]:
    """
    把目录里的文件按**当前顺序**统一编号。

    主要给「直接丢进来的旧文件」用：它们没有 `NN-` 前缀，会排在最后。
    点一下这个，它们就各自拿到自己实际位置上的编号。
    """
    return reorder([p.name for p in _existing_files()])


def delete(name: str) -> None:
    """删一张。`name` 必须是目录里的裸文件名 —— 挡掉 `../` 这类穿越。"""
    if Path(name).name != name:
        raise ValueError("文件名不合法")

    target = photos_dir() / name
    if not target.is_file() or not _is_photo(target):
        raise FileNotFoundError(name)

    target.unlink()
