# photos-life/

「我的照片」放这里，对应影像页的第一个分区。

## 怎么加

1. 把图丢进这个文件夹，文件名随便（会自动按文件名排序）
2. 不用改任何代码。`src/data/photos.ts` 里的 `import.meta.glob` 会自动收录

支持 `jpg / jpeg / png / webp / avif`。
页面按 4:3 裁切显示缩略图，点开灯箱看的是完整原图。

## 想让某张照片带一句说明

打开 `src/data/photos.ts`，在 `photoNotes` 里加一行：

```ts
const photoNotes: Record<string, string> = {
  'life/photo-01.jpg': '那天下午，光很好',
}
```

键是「life/文件名」。不加也没有关系，页面不会替你编一句。

## 上线之前

原图不要直接提交。先跑 `backend/scripts/optimize_photos.py` 压一下，
手机拍的一张 4MB，十张就是 40MB。

## 朋友们的照片

放在 `src/assets/photos-ta-all/<相册文件夹名>/`，
文件夹名就是相册名（想改显示名就去 `photos.ts` 的 `albumNames` 里登记）。
