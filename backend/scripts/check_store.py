"""
store.py 的自检。**不依赖 FastAPI**，在临时目录里跑，不碰真实的照片目录。

用法：

    cd backend
    uv run python scripts/check_store.py

为什么留这么一个脚本（而不是靠手点管理页）：

1. **顺序就是文件名里的编号**（`NN.jpg`），`natural_key` 是唯一的排序依据。
   这套顺序**没有接口能改** —— 没有重排、也不要第二份清单，于是「上传的先后
   就是展示的顺序」这条约定只能靠这一处保证。退化成普通字典序的话
   `10.jpg` 会跑到 `2.jpg` 前面，而这种错在只有两三张图时看不出来。

   还有一条：**删掉 `1.jpg` 后下一张仍然是 `3.jpg`**（id 不补洞）。
   要是有人把 `next_index` 改成「取第一个空位」，已发出的 URL 就会串到别人身上。

2. **EXIF 摆正**决定了裁哪一块。手机竖拍的照片文件里是横的，
   只在 EXIF 里写了一句「转 90°」。漏了这一步，裁出来的是偏的，
   而且在管理页上看不出来（前端已经摆正过了，两边观感不同步）。
"""

from __future__ import annotations

import io
import os
import sys
import tempfile
from pathlib import Path

from PIL import Image

# 让 `import store` 能找到上一层的模块
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

failures: list[str] = []
passed = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global passed
    if condition:
        passed += 1
        print(f"  ok   {label}")
    else:
        failures.append(label)
        print(f"  FAIL {label}" + (f"  -> {detail}" if detail else ""))


def jpeg_bytes(size: tuple[int, int], mode: str = "RGB", color: str = "white") -> bytes:
    image = Image.new(mode, size, color)
    buffer = io.BytesIO()
    image.save(buffer, "JPEG")
    return buffer.getvalue()


def png_bytes(size: tuple[int, int], color=(255, 0, 0, 0)) -> bytes:
    """带透明的 PNG：中间不透明，四周全透。"""
    image = Image.new("RGBA", size, color)
    inner = Image.new("RGBA", (size[0] // 2, size[1] // 2), (0, 128, 0, 255))
    image.paste(inner, (size[0] // 4, size[1] // 4))
    buffer = io.BytesIO()
    image.save(buffer, "PNG")
    return buffer.getvalue()


# ---------------------------------------------------------------------
# 1. 顺序契约
# ---------------------------------------------------------------------


def test_order() -> None:
    print("\n[1] 排序：natural_key 决定照片墙的顺序")
    import store

    names = ["2.jpg", "10.jpg", "1.jpg", "3.jpg", "7.jpg", "100.jpg"]
    expected = ["1.jpg", "2.jpg", "3.jpg", "7.jpg", "10.jpg", "100.jpg"]
    actual = sorted(names, key=store.natural_key)
    check("按数值排（2 在 10 前，100 在最后）", actual == expected, f"得到 {actual}")

    # 手动丢进来的杂文件（不该发生，但真漏进来时不能让列表挂掉）。
    # 它们排在最后、不参与编号分配，也不影响正常照片之间的顺序。
    junk = ["微信图片_x.jpg", "Thumbs.jpg", "2.jpg", "10.jpg"]
    actual = sorted(junk, key=store.natural_key)
    check(
        "没编号的文件垫到最后",
        actual[:2] == ["2.jpg", "10.jpg"],
        f"得到 {actual}",
    )


def test_next_index(tmp: Path) -> None:
    print("\n[2] 编号：自增，删了不补洞")
    import store

    for path in tmp.iterdir():
        path.unlink()

    for _ in range(3):
        store.save_photo(jpeg_bytes((400, 400)))
    names = [p["name"] for p in store.list_photos()["photos"]]
    check("三张的编号是 1 2 3", names == ["1.jpg", "2.jpg", "3.jpg"], str(names))

    store.delete_photo("1.jpg")
    saved = store.save_photo(jpeg_bytes((400, 400)))
    check("删掉 1.jpg 之后新图是 4.jpg（不是 1.jpg）", saved["name"] == "4.jpg", saved["name"])

    names = [p["name"] for p in store.list_photos()["photos"]]
    check("剩下的顺序是 2 3 4", names == ["2.jpg", "3.jpg", "4.jpg"], str(names))


# ---------------------------------------------------------------------
# 3. 存图：一律正方形
# ---------------------------------------------------------------------


def test_square(tmp: Path) -> None:
    print("\n[3] 存图：横的竖的都得变成方的")
    import store

    for path in tmp.iterdir():
        path.unlink()

    saved = store.save_photo(jpeg_bytes((1200, 800)))
    with Image.open(tmp / saved["name"]) as image:
        check("4:3 横图 -> 800 x 800", image.size == (800, 800), str(image.size))
        check("输出是 RGB", image.mode == "RGB", image.mode)

    saved = store.save_photo(jpeg_bytes((800, 1200)))
    with Image.open(tmp / saved["name"]) as image:
        check("3:4 竖图 -> 800 x 800", image.size == (800, 800), str(image.size))

    saved = store.save_photo(jpeg_bytes((2400, 3000)))
    with Image.open(tmp / saved["name"]) as image:
        check("超限的缩到 1600 x 1600", image.size == (1600, 1600), str(image.size))

    saved = store.save_photo(jpeg_bytes((300, 300)))
    with Image.open(tmp / saved["name"]) as image:
        check("小图不放大（只缩不放）", image.size == (300, 300), str(image.size))

    saved = store.save_photo(jpeg_bytes((400, 400)))
    check("文件名就是编号 + .jpg", saved["name"] == "5.jpg", saved["name"])


def test_alpha(tmp: Path) -> None:
    print("\n[4] 带透明的 PNG：垫白底，不能变黑块")
    import store

    saved = store.save_photo(png_bytes((600, 600)))
    with Image.open(tmp / saved["name"]) as image:
        corner = image.getpixel((5, 5))
        check("透明区被垫成白色", min(corner) > 230, str(corner))


def test_exif(tmp: Path) -> None:
    print("\n[5] EXIF 摆正：竖拍的照片不能裁偏")
    import store

    # 1000x400 的横图，中间三分之一是黑的（x 150~350）。
    # EXIF 说「转 90°」，摆正后它变成 400x1000，那条黑带跟着转成**横的**。
    # 于是居中裁 400x400 之后，黑应该贴在上边或下边，而不是左边。
    image = Image.new("RGB", (1000, 400), "white")
    image.paste(Image.new("RGB", (200, 400), "black"), (150, 0))

    exif = Image.Exif()
    exif[0x0112] = 6  # 6 = 顺时针 90°
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", exif=exif.tobytes())

    saved = store.save_photo(buffer.getvalue())
    with Image.open(tmp / saved["name"]) as result:
        size = result.size
        left = result.getpixel((5, 200))
        top = result.getpixel((200, 5))
        bottom = result.getpixel((200, size[1] - 6))
        middle = result.getpixel((200, 200))

    check("摆正后裁成 400 x 400", size == (400, 400), str(size))
    check("左侧是白的（没摆正的话黑带会留在左边）", min(left) > 230, str(left))
    check("黑带跑到上边或下边去了", min(top) < 60 or min(bottom) < 60, f"上 {top} 下 {bottom}")
    check("中间是白的", min(middle) > 230, str(middle))


# ---------------------------------------------------------------------
# 4. 删一张：挡住路径穿越
# ---------------------------------------------------------------------


def test_delete(tmp: Path) -> None:
    print("\n[6] 删除：挡住路径穿越")
    import store

    # 自己造两张 —— 不依赖前一个用例留在目录里的东西
    for path in tmp.iterdir():
        path.unlink()
    for _ in range(2):
        store.save_photo(jpeg_bytes((400, 400)))

    target = store.list_photos()["photos"][0]["name"]
    store.delete_photo(target)
    check("删掉了", store.list_photos()["count"] == 1, str(store.list_photos()["count"]))

    try:
        store.delete_photo("../../pyproject.toml")
        check("`../` 要被拒绝", False, "居然通过了")
    except ValueError:
        check("`../` 要被拒绝", True)

    try:
        store.delete_photo("根本没有这张.jpg")
        check("不存在的文件要报 FileNotFoundError", False, "居然通过了")
    except FileNotFoundError:
        check("不存在的文件要报 FileNotFoundError", True)

    check("pyproject.toml 还在", (Path(__file__).resolve().parent.parent / "pyproject.toml").is_file())


# ---------------------------------------------------------------------


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="lizao-check-") as folder:
        tmp = Path(folder)
        os.environ["PHOTOS_DIR"] = str(tmp)

        print(f"临时照片目录：{tmp}")
        test_order()
        test_next_index(tmp)
        test_square(tmp)
        test_alpha(tmp)
        test_exif(tmp)
        test_delete(tmp)

    print()
    if failures:
        print(f"{len(failures)} 项没过：")
        for name in failures:
            print(f"  - {name}")
        return 1

    print(f"全部通过（{passed} 项）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
