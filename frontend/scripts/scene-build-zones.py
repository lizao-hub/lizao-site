"""场景热点可点区域：算出压在物件上的透明小块（zone）。

为什么要这个东西：物件的轮廓是不规则的，透明的部分不该接鼠标。
试过用 clip-path 抠轮廓，实测 elementFromPoint 完全无视 clip-path，
电脑的透明处会把压在它下面的书抢走。所以最后做成：
物件本体 .art 不接鼠标，上面压几个互不重叠的透明矩形 .zone。

做法：把每张图的 alpha 掩膜膨胀 +14px，按 z 序从上往下取
「未被占用区域内的最大全 1 矩形」（柱状图法），每层最多 3 块。

用法：
    python scripts/scene-build-zones.py <素材目录>

物件的画布坐标由 scene-locate-layers.py 算出，两边必须一致。
改素材之后两个脚本都要重跑，并把结果抄进 src/data/scenes.ts。

注意：这里只算 room 场景。湖景只有一个热点（小木屋），
它形状方正、面积又小，直接用整图当可点区域就够了。
"""

import sys
import numpy as np, os
from PIL import Image, ImageFilter

# 参考画布尺寸。scenes.ts 里的百分比都是相对它的。
CW, CH = 2848, 1602
BASE = sys.argv[1] if len(sys.argv) > 1 else '.'

# 物件的左上角画布坐标（由 scene-locate-layers.py 得出）。
# 键要和 scenes.ts 里的 hotspot id 对得上，方便对账。
layers = {
    'camera': ('复古旁轴相机.png', 832, 1209),
    'laptop': ('笔记本电脑.png', 1227, 1036),
    'books-right': ('右侧横叠书籍.png', 2279, 1111),
    'books-left':  ('左侧横叠书籍.png', 1055, 1144),
    'books-tall':  ('右侧竖排书籍.png', 1900, 965),
}
BOX, MASK = {}, {}
for k, (fn, x, y) in layers.items():
    im = Image.open(os.path.join(BASE, fn)).convert('RGBA')
    a = im.getchannel('A')
    BOX[k] = (x, y, im.width, im.height)
    MASK[k] = np.asarray(a.filter(ImageFilter.MaxFilter(29))) > 128   # +14px slack


def max_rect(mask):
    h, w = mask.shape
    heights = np.zeros(w, dtype=np.int32)
    best = (0, 0, 0, 0, 0)
    for r in range(h):
        heights = np.where(mask[r], heights + 1, 0)
        stack = []
        for c in range(w + 1):
            cur = heights[c] if c < w else 0
            start = c
            while stack and stack[-1][1] >= cur:
                idx, hgt = stack.pop()
                area = hgt * (c - idx)
                if area > best[0]:
                    best = (area, idx, r - hgt + 1, c, hgt)
                start = idx
            stack.append((start, cur))
    _, x0, y0, x1, hgt = best
    return x0, y0, x1, y0 + hgt, best[0]


occ = np.zeros((CH, CW), dtype=bool)
ZONES = {}
for k in layers:                      # top-most first
    x, y, w, h = BOX[k]
    local = MASK[k].copy()
    found = []
    for _ in range(3):
        free = local & ~occ[y:y + h, x:x + w]
        if free.sum() < 4000:
            break
        rx0, ry0, rx1, ry1, area = max_rect(free)
        if area < 4000:
            break
        occ[y + ry0:y + ry1, x + rx0:x + rx1] = True
        found.append((rx0, ry0, rx1, ry1))
    ZONES[k] = found
    for z in found:
        print(f'{k:8s} zone canvas ({x+z[0]},{y+z[1]})-({x+z[2]},{y+z[3]}) size '
              f'{z[2]-z[0]}x{z[3]-z[1]}')
    print()

print('--- zones（直接抄进 scenes.ts 的 zones 字段）---')
for k, zs in ZONES.items():
    x, y, w, h = BOX[k]
    parts = []
    for (rx0, ry0, rx1, ry1) in zs:
        parts.append(
            '{ left: %.1f, top: %.1f, right: %.1f, bottom: %.1f }'
            % (rx0 / w * 100, ry0 / h * 100, (1 - rx1 / w) * 100, (1 - ry1 / h) * 100)
        )
    print(f"  {k}: [{', '.join(parts)}],")

# union coverage per layer + overlap check
tot = {}
for k, zs in ZONES.items():
    x, y, w, h = BOX[k]
    m = MASK[k]
    u = np.zeros((h, w), bool)
    for rx0, ry0, rx1, ry1 in zs:
        u[ry0:ry1, rx0:rx1] = True
    tot[k] = (x, y, w, h, u)
    print(f'{k:8s} core coverage {u.sum()/m.sum()*100:5.1f}% of object (slack included)')

print()
print('--- pairwise overlaps in canvas ---')
keys = list(tot)
cv = {}
for k in keys:
    x, y, w, h, u = tot[k]
    a = np.zeros((CH, CW), bool)
    a[y:y + h, x:x + w] = u
    cv[k] = a
bad = 0
for i in range(len(keys)):
    for j in range(i + 1, len(keys)):
        n = int((cv[keys[i]] & cv[keys[j]]).sum())
        if n:
            bad += 1
            print(f'  OVERLAP {keys[i]} x {keys[j]} = {n}')
print('  clean' if not bad else '  !! fix needed')

# what fraction of each object is still NOT clickable because a higher layer owns it
print()
for k, (x, y, w, h, u) in tot.items():
    m = MASK[k]
    print(f'{k:8s} clickable {u.sum()/m.sum()*100:5.1f}%')
