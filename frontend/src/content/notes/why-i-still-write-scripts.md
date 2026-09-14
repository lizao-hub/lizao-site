前端和脚本不冲突，因为它们解决的不是同一类问题。

前端要处理的是「怎么让人看懂」，脚本要处理的是「怎么把一件事做完」。前者有无数种正确答案，后者通常只有一种：跑完就行。

下面这三件是我现在还在用脚本解决的事。

## 批量压图

网站用的照片不能是原图。手机拍一张 4MB，十张就是 40MB，首屏直接废掉。

```python
from pathlib import Path
from PIL import Image

for src in sorted(Path("photos_raw").glob("*.jpg")):
    with Image.open(src) as img:
        img.thumbnail((1600, 1600), Image.LANCZOS)
        img.convert("RGB").save(f"photos/{src.name}", quality=85, optimize=True)
```

这段代码没有一行是「前端」的，但它决定了前端能不能在两秒内打开。它后来长成了项目里的 `optimize_photos.py`。

## 给站点生成 RSS

在前端框架里做这件事很别扭：RSS 是一个静态 XML 文件，而我的构建流程是给浏览器用的。用 Python 读一遍文章元信息，拼出 XML，写进 `public/`，构建的时候它就已经在那儿了。

## 重命名

`IMG_20260814_231204.jpg` 这种文件名不能上网站。原因有三个：中文和空格在 URL 里要转义、排序不可控、看不出是哪一卷。

脚本做的是把目录里的图按修改时间排序，重命名成 `photo-01.jpg`，顺便留一份对照表。听着很笨，但每次都省事。

## 结论

写脚本这件事不需要理由。它就是在你别扭的时候，让你不用继续别扭。

前端让我把东西给别人看，Python 让我把东西弄完。这两件事我都还想继续做。
