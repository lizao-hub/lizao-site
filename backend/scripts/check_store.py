"""
store.py 的自检。**不依赖 FastAPI**，在临时目录里跑，不碰真实的照片目录。

用法：

    cd backend
    uv run python scripts/check_store.py

为什么留这么一个脚本（而不是靠手点管理页）：

1. **顺序是「文件名里的编号」**，而 `natural_key` 是前端
   `localeCompare(..., { numeric: true })` 的 Python 版。两边一旦不一致，
   管理页看到的顺序和影像页看到的就不是一回事 —— 这种错很安静，
   手动测基本撞不到（要正好造出一个中英混排的文件名才会露出来）。
   下面 `test_order` 里的期望值是把同一批文件名丢给 node 的
   `localeCompare(zh-Hans-CN)` 实测出来的，不是猜的。

2. **`reorder` 是两趟改名**（先全改成临时名、再改成最终名）。一趟会撞车：
   `01-a.jpg` 要变 `02-a.jpg`，而 `02-b.jpg` 正占着这个位置。
   这种「改到一半失败」的路径手工点很难覆盖，但它是会真的砸数据的。

3. **EXIF 摆正**决定了裁哪一块。手机竖拍的照片文件里是横的，
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
    print("\n[1] 排序：natural_key 必须和前端 localeCompare 一致")
    import store

    names = ["02-b.jpg", "10-c.jpg", "1-a.jpg", "03-湖.jpg", "07-x.jpg", "100-z.jpg"]
    expected = ["1-a.jpg", "02-b.jpg", "03-湖.jpg", "07-x.jpg", "10-c.jpg", "100-z.jpg"]
    actual = sorted(names, key=store.natural_key)
    check("带编号的名字按数值排（2 在 10 前）", actual == expected, f"得到 {actual}")

    # 前端给的是 ['微信图片_x.jpg', 'photo.jpg']（中文排序把汉字排在拉丁字母前）。
    # 这里是反的 —— 已知差异，也是管理页要有「统一编号」的原因。
    # 把它钉住，免得哪天 quietly 变了却没人知道。
    mixed = ["微信图片_x.jpg", "photo.jpg"]
    check(
        "没编号的中英混排（已知差异，靠统一编号消掉）",
        sorted(mixed, key=store.natural_key) == ["photo.jpg", "微信图片_x.jpg"],
        "差异消失了？那就该同步更新 store.natural_key 的注释",
    )


# ---------------------------------------------------------------------
# 2. 存图：一律正方形
# ---------------------------------------------------------------------


def test_square(tmp: Path) -> None:
    print("\n[2] 存图：横的竖的都得变成方的")
    import store

    saved = store.save_photo(jpeg_bytes((1200, 800)), "横图.jpg")
    with Image.open(tmp / saved["name"]) as image:
        check("4:3 横图 -> 800 x 800", image.size == (800, 800), str(image.size))
        check("输出是 RGB", image.mode == "RGB", image.mode)

    saved = store.save_photo(jpeg_bytes((800, 1200)), "竖图.jpg")
    with Image.open(tmp / saved["name"]) as image:
        check("3:4 竖图 -> 800 x 800", image.size == (800, 800), str(image.size))

    saved = store.save_photo(jpeg_bytes((2400, 3000)), "大图.jpg")
    with Image.open(tmp / saved["name"]) as image:
        check("超限的缩到 1600 x 1600", image.size == (1600, 1600), str(image.size))

    saved = store.save_photo(jpeg_bytes((300, 300)), "小图.jpg")
    with Image.open(tmp / saved["name"]) as image:
        check("小图不放大（只缩不放）", image.size == (300, 300), str(image.size))

    saved = store.save_photo(jpeg_bytes((400, 400)), "已经是方的.png")
    check("文件名带上编号前缀", saved["name"].startswith("0") and "-" in saved["name"], saved["name"])
    check("扩展名统一成 .jpg", saved["name"].endswith(".jpg"), saved["name"])


def test_alpha(tmp: Path) -> None:
    print("\n[3] 带透明的 PNG：垫白底，不能变黑块")
    import store

    saved = store.save_photo(png_bytes((600, 600)), "透明.png")
    with Image.open(tmp / saved["name"]) as image:
        corner = image.getpixel((5, 5))
        check("透明区被垫成白色", min(corner) > 230, str(corner))


def test_exif(tmp: Path) -> None:
    print("\n[4] EXIF 摆正：竖拍的照片不能裁偏")
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

    saved = store.save_photo(buffer.getvalue(), "竖拍.jpg")
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
# 3. 顺序：改名的两趟走法
# ---------------------------------------------------------------------


def test_reorder(tmp: Path) -> None:
    print("\n[5] 重排：两趟改名不能撞车")
    import store

    for path in tmp.iterdir():
        path.unlink()

    for stem in ("a", "b", "c"):
        store.save_photo(jpeg_bytes((400, 400)), f"{stem}.jpg")

    before = [p.name for p in sorted(tmp.iterdir(), key=lambda p: store.natural_key(p.name))]
    check("三张就位", len(before) == 3, str(before))

    # 反转。这是最狠的一种：01->03、03->01，两头都要经过对方的位置
    after = store.reorder(list(reversed(before)))
    check("反转后编号重排", after == [f"{i:02d}-{s}.jpg" for i, s in [(1, "c"), (2, "b"), (3, "a")]], str(after))

    # 往前提一位：01 和 02 互换位置，02 的位置上有文件占着
    swapped = store.reorder([after[1], after[0], after[2]])
    check("相邻互换不撞车", swapped == ["01-b.jpg", "02-c.jpg", "03-a.jpg"], str(swapped))

    check("没有留下临时文件", not any(p.name.startswith(".__staging") for p in tmp.iterdir()))

    # 编号对不上时应该拒绝，而不是乱改
    try:
        store.reorder(["01-b.jpg", "02-不存在.jpg", "03-a.jpg"])
        check("对不上的顺序列表要被拒绝", False, "居然通过了")
    except ValueError:
        check("对不上的顺序列表要被拒绝", True)

    check("下一张的编号接在最大值后面", store.next_index() == 4, str(store.next_index()))


def test_normalize(tmp: Path) -> None:
    print("\n[6] 统一编号：把没编号的旧文件收进编号体系")
    import store

    for path in tmp.iterdir():
        path.unlink()

    for name in ("微信图片_1.jpg", "微信图片_2.jpg"):
        (tmp / name).write_bytes(jpeg_bytes((400, 400)))

    listing = store.list_photos()
    check("没编号的被报出来", listing["unnumbered"] == ["微信图片_1.jpg", "微信图片_2.jpg"], str(listing["unnumbered"]))
    check("它们当时没有编号", all(p["prefix"] is None for p in listing["photos"]))

    store.normalize()

    listing = store.list_photos()
    check("统一之后没有漏网的", listing["unnumbered"] == [], str(listing["unnumbered"]))
    check("顺序没被改掉", [p["name"] for p in listing["photos"]] == ["01-微信图片_1.jpg", "02-微信图片_2.jpg"], str([p["name"] for p in listing["photos"]]))


def test_delete(tmp: Path) -> None:
    print("\n[7] 删除：挡住路径穿越")
    import store

    store.normalize()
    target = store.list_photos()["photos"][0]["name"]
    store.delete(target)
    check("删掉了", store.list_photos()["count"] == 1)

    try:
        store.delete("../../pyproject.toml")
        check("`../` 要被拒绝", False, "居然通过了")
    except ValueError:
        check("`../` 要被拒绝", True)

    try:
        store.delete("根本没有这张.jpg")
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
        test_square(tmp)
        test_alpha(tmp)
        test_exif(tmp)
        test_reorder(tmp)
        test_normalize(tmp)
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
