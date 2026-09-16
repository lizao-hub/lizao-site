# 标题字体：霞鹜文楷 Light（子集）

本目录的 `lxgw-wenkai-light-subset.woff2` 是 **LXGW WenKai Light**（霞鹜文楷）的子集，
由本仓库的脚本从官方字体生成，不是原字体文件。

## 授权

**SIL Open Font License 1.1 (OFL-1.1)**。允许免费商用、修改、嵌入网页与再分发。
唯一禁止的是**单独出售字体文件本身**。

版权声明（取自字体文件自身的 name 表，随字体一起分发）：

```
Copyright 2021-2025 LXGW (https://github.com/lxgw/LxgwWenKai)
Copyright 2020 The Klee Project Authors (https://github.com/fontworks-fonts/Klee)
This Font Software is licensed under the SIL Open Font License, Version 1.1.
```

上游：<https://github.com/lxgw/LxgwWenKai>
版本：v1.520（2025-06-14），Light 字重（300）

## 为什么是子集

上游 Light 字重的完整 TTF 是 27 MB，woff2 压缩后仍有 8.8 MB。
中文字体无法整包上线，所以只保留本站在用到的字。

当前子集：**904 个字符、约 228 KB**（含拉丁字母、数字与标点）。

## 重新生成

改了标题文案、引入了新字之后要重跑，否则新字会回落到系统字体：

```sh
cd frontend
npm run subset-font
```

脚本会扫描 `src/` 下所有 `.vue / .ts / .md / .css` 中出现的中日韩字符，
生成 `glyph-set.txt`，再调用 `pyftsubset` 产出子集并覆盖本目录的 woff2。

依赖：`fonttools` 与 `brotli`（`pip install fonttools brotli`）。

`glyph-set.txt` 是脚本产物，可以随时删掉重生成。
