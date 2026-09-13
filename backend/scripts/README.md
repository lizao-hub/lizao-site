# scripts/

放开发辅助脚本，**不参与前端构建**，不会被 Vite 打包进网站。

## optimize_photos.py

把原图批量压缩、重命名，输出到 `src/assets/photos-ta-all/`，供 `FriendsView.vue` 的照片墙使用。

### 准备

```bash
pip install Pillow
```

### 用法

方式一：直接指定原图文件夹

```bash
python scripts/optimize_photos.py "C:/Users/24436/Desktop/照片原图"
```

方式二：先把原图放进项目根目录的 `photos_raw/`，然后不带参数运行

```bash
python scripts/optimize_photos.py
```

### 输出

```
src/assets/photos-ta-all/
├── photo-01.jpg
├── photo-02.jpg
└── photo-03.jpg
```

顺序按原文件名排序。想调整顺序，就在运行前重命名原图（例如加 `01-`、`02-` 前缀）。

### 可调参数

打开 `scripts/optimize_photos.py`，顶部有一段配置：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `MAX_SIZE` | `1600` | 长边最大像素。网格展示够用，再大只是浪费流量 |
| `QUALITY` | `85` | 画质 1-100，85 是清晰度和体积的平衡点 |
| `USE_WEBP` | `False` | 改成 `True` 输出 `.webp`，体积小 25%~35% |
| `START_INDEX` | `1` | 起始编号，改成 `10` 就从 `photo-10` 开始 |

### 注意事项

- `photos_raw/` 已加入 `.gitignore`，原图不会被提交到 Git
- 重复运行会**覆盖** `src/assets/photos-ta-all/` 里的同名文件
- 图片转换后无法恢复原图，原始照片请自行备份
- 脚本依赖 Pillow，不是 Python 标准库，需要先 `pip install`

## 对应关系

```
photos_raw/          scripts/optimize_photos.py         src/assets/photos-ta-all/
（你的原图，不提交）  ────────  压缩重命名  ────────>    （网站实际用的图，提交）
                                                              │
                                                              ▼
                                                    FriendsView.vue 读取展示
```
