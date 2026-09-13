"""
用法：

    python scripts/optimize_photos.py "原图文件夹的路径"

例如：

    python scripts/optimize_photos.py "C:/Users/24436/Desktop/照片原图"

如果不传参数，默认读取项目根目录下的 photos_raw/ 文件夹。

做了什么：
  1. 把长边限制到 MAX_SIZE 像素以内
  2. 压缩画质到 QUALITY
  3. 重命名为 photo-01.jpg、photo-02.jpg...（避免中文名和空格）
  4. 可选转成 WebP 格式（见 USE_WEBP）

依赖：
    pip install Pillow
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

# ============ 可调参数 ============

MAX_SIZE = 1600  # 长边最大像素。网格展示用 1600 足够，再大只是浪费流量
QUALITY = 85  # 压缩画质，1-100。85 是清晰度和体积的平衡点
USE_WEBP = False  # True = 输出 .webp（体积小 25%~35%），False = 输出 .jpg
START_INDEX = 1  # 从 photo-01 开始编号

# ==================================

# 项目根目录 = 本文件所在目录(scripts/) 的上一级
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = PROJECT_ROOT / "photos_raw"
OUTPUT_DIR = PROJECT_ROOT / "photos"

SUPPORTED = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}


def collect_images(folder: Path) -> list[Path]:
    """递归收集文件夹里所有支持的图片，按文件名排序。"""
    files = [p for p in folder.rglob("*") if p.suffix.lower() in SUPPORTED]
    return sorted(files, key=lambda p: p.name.lower())


def optimize(src: Path, dst: Path) -> tuple[int, int]:
    """压缩单张图片，返回 (原始字节, 处理后字节)。"""
    original_size = src.stat().st_size

    with Image.open(src) as img:
        img = img.convert("RGB") if img.mode in ("RGBA", "P", "LA") else img

        if max(img.size) > MAX_SIZE:
            img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)

        if USE_WEBP:
            img.save(dst, "WEBP", quality=QUALITY, method=6)
        else:
            img.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    return original_size, dst.stat().st_size


def human(num_bytes: int) -> str:
    """把字节数格式化成易读的 KB / MB。"""
    if num_bytes < 1024:
        return f"{num_bytes} B"
    if num_bytes < 1024 * 1024:
        return f"{num_bytes / 1024:.0f} KB"
    return f"{num_bytes / 1024 / 1024:.1f} MB"


def main() -> int:
    if len(sys.argv) > 1:
        source_dir = Path(sys.argv[1]).expanduser().resolve()
    else:
        source_dir = DEFAULT_INPUT

    if not source_dir.is_dir():
        print(f"[错误] 找不到文件夹: {source_dir}")
        print()
        print("用法: python scripts/optimize_photos.py \"原图文件夹路径\"")
        print(f"或者把原图放进: {DEFAULT_INPUT}")
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    images = collect_images(source_dir)

    if not images:
        print(f"[错误] {source_dir} 里没有找到图片")
        print(f"支持的格式: {', '.join(sorted(SUPPORTED))}")
        return 1

    ext = ".webp" if USE_WEBP else ".jpg"
    total_before = 0
    total_after = 0
    index = START_INDEX

    print(f"输入: {source_dir}")
    print(f"输出: {OUTPUT_DIR}")
    print(f"共 {len(images)} 张，长边限制 {MAX_SIZE}px，画质 {QUALITY}")
    print("-" * 56)

    for src in images:
        dst = OUTPUT_DIR / f"photo-{index:02d}{ext}"
        try:
            before, after = optimize(src, dst)
        except Exception as exc:  # 单张失败不影响其他图片
            print(f"  [跳过] {src.name} -> {exc}")
            continue

        total_before += before
        total_after += after
        saved = (1 - after / before) * 100 if before else 0
        print(f"  photo-{index:02d}{ext}  {human(before):>8} -> {human(after):>8}  (省 {saved:.0f}%)")
        index += 1

    done = index - START_INDEX
    print("-" * 56)
    if done:
        print(f"完成 {done} 张: {human(total_before)} -> {human(total_after)}", end="")
        if total_before:
            print(f"  总体节省 {(1 - total_after / total_before) * 100:.0f}%")
        else:
            print()
    else:
        print("没有任何图片被处理")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
