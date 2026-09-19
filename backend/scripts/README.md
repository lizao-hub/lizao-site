# scripts/

放开发辅助脚本，**不参与任何构建**（既不进 Vite，也不进 FastAPI）。

## optimize_photos.py

把原图批量压缩、重命名，输出到 `backend/photos/`。

```bash
pip install Pillow
```

### 用法

方式一：直接指定原图文件夹

```bash
python scripts/optimize_photos.py "C:/Users/24436/Desktop/照片原图"
```

方式二：先把原图放进 `backend/photos_raw/`，然后不带参数运行

```bash
python scripts/optimize_photos.py
```

### 输出

```
backend/photos/
├── index.html        一个预览页，按顺序把下面这些图排开
├── photo-01.jpg
└── photo-02.jpg
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

- `backend/photos_raw/` 已加入 `.gitignore`，原图不会被提交
- 重复运行会**覆盖** `backend/photos/` 里的同名文件
- 图片转换后无法恢复原图，原始照片请自行备份
- 脚本依赖 Pillow，不是 Python 标准库，需要先 `pip install`

## check_store.py

`store.py` 的自检。**不依赖 FastAPI**，在临时目录里跑，不碰真实的照片目录。

```bash
cd backend
uv run python scripts/check_store.py
```

改过 `store.py`（尤其是排序、改名、裁切那几处）之后跑一遍。三件事是被钉住的：

1. **排序键必须和前端一致** —— `natural_key` 是
   `localeCompare(..., { numeric: true })` 的 Python 版，期望值是把文件名丢给
   node 实测出来的。两边一旦不一致，管理页看到的顺序和影像页就不是一回事，
   而这种错很安静（要正好造出中英混排的文件名才会露）。
2. **改名的两趟走法** —— 反转、相邻互换、对不上的列表要拒绝。这类路径手工点很难覆盖，
   但它会真的砸数据。
3. **EXIF 摆正** —— 用一条「黑带夹在中间」的图验证：摆正后黑带该转到横向去。
   漏了这一步只会裁偏，而且前端已经摆正过，两边观感不同步，肉眼看不出来。

---

## 往影像页加图，现在有三条路

先记住一件事：**影像页的照片是构建期打进前端的**
（`frontend/src/assets/photos/`，`import.meta.glob` 自动收录，
**文件名就是顺序**，见 `frontend/README.md`「加一张照片」）。
不管走哪条路，最后都是把文件放进那个目录。

### 一、管理页（推荐）

```bash
cd backend && uv run uvicorn main:app --reload --port 8000
```

打开 http://localhost:8000 —— 拖图进去，界面上拖拽裁成正方形，
调顺序也是拖。压图、改方形、加编号、命名全都自动做掉。
详见 `backend/README.md`。

传完要**重启 dev server 或重新 build**，影像页才会变（照片是构建期收的）。

### 二、直接丢文件

压好的文件丢进 `frontend/src/assets/photos/`，**不用跑任何脚本**。
压图参数照上表（长边 1600 / 质量 85）。文件名即顺序，想指定顺序就加 `01-` 前缀。

这是文件最少的一条路 —— 手上只有一两张图、已经压好了的时候最省事。

### 三、跑这个脚本（批量）

来源是一整个文件夹、要一次性重命名 + 顺手拿个预览页时用它。

```
backend/photos_raw/   ──optimize_photos.py──>   backend/photos/
（原图，不提交）                                  （脚本产物 + index.html 预览）
```

⚠️ **它的输出目录不是前端读的那个**。跑完还得手动把
`backend/photos/` 里的成品拷到 `frontend/src/assets/photos/`。

> 从前这里写过「这个脚本接不上前端」—— 现在接得上了，但**要手动拷**这一步还在。
> 要的是「丢进去就完事」，用管理页那条路。

