# notes-cover/

笔记封面放这里，对应笔记列表卡片的一半。

## 怎么加

把图丢进这个文件夹即可，**文件名必须等于文章 slug**：

```
python-to-vue-first-week.jpg   ->  /notes/python-to-vue-first-week
css-layout-notes.png           ->  /notes/css-layout-notes
```

不用改任何代码，`src/data/postCovers.ts` 里的 `import.meta.glob` 会自动收录，
匹配到 slug 就显示图片。支持 `jpg / jpeg / png / webp / avif`。

## 没有封面会怎样

不会报错，也不会塌。卡片会画一个浅色像素网格占位块，
右下角一个小图标说明「暂无封面」。补上图之后它会自己满。

## 建议尺寸

卡片按 16:10 裁切显示，宽度占卡片一半（桌面约 320px，2x 屏约 640px）。
**推荐 1280x800 左右、300KB 以内**，超出的部分会被居中裁掉。

## 上线之前

和照片一样，原图不要直接提交。可以用 `backend/scripts/optimize_photos.py` 压一下
（脚本目前输出到 `backend/photos/`，手工挪过来即可）。
