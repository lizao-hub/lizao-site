我把过去半年写过的布局翻了一遍，数了一下什么时候用了 Flex，什么时候用了 Grid。结论比我预想的简单。

## 一句话标准

一维用 Flex，二维用 Grid。

「一维」指的是我只关心一个方向：一行按钮、一条导航、一张卡片内部的上下排列。哪怕它会换行，我关心的还是「排成一排」，换行是副作用。

「二维」指的是行和列同时要对齐：一个三行四列的相册，边距要一致，跨列的图要能跨过去。

## Flex 的三种常见误用

**误用一：用 Flex 做二维网格。**

```css
.wall {
  display: flex;
  flex-wrap: wrap;
}
.wall > * {
  width: calc(33.33% - 1rem);
  margin: 0.5rem;
}
```

能跑，但每个间距都要手算。少一个像素就换行，多一个像素就留缝。改成 `display: grid` 加 `gap` 之后，这段 CSS 会短一半。

**误用二：为了居中开一个 Flex。**

```css
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

这其实不算错，只是现在有更短的写法：

```css
.center {
  display: grid;
  place-items: center;
}
```

两行的活，一行干完。

**误用三：嵌套三层 Flex 只为了对齐文字。**

文字对齐用 `line-height` 通常就够了。嵌套的 Flex 会带来一堆 `min-width: 0` 之类的副作用，最后自己也说不清为什么要这么写。

## Grid 确实更好的地方

- 需要 `gap` 而且不想手算 `margin`
- 需要子元素跨行跨列
- 需要「列宽由内容决定，但不超过某个值」，也就是 `minmax()`

```css
.wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
```

这一行顶掉了过去写的十几行媒体查询。

## 剩下的都是习惯

真正需要判断的情况比想象中少。多数时候两种都能做，区别只是哪个更顺手。

我现在的默认动作是：先写 Grid。如果发现只有一维，再改回 Flex。
