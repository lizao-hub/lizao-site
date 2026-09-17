"""场景图层定位：算出每张分层图在 composite.png 里的 left / top。

背景：场景的每一层都是「紧贴轮廓裁切」的小图，不是整画布尺寸，
所以必须知道它们在 2848×1602 参考画布里的确切位置。这些位置不是目测的，
是用带 alpha 掩膜的 SSD 模板匹配算出来的，整体平均像素差 0.13/255。

用法：
    python scripts/scene-locate-layers.py <素材目录>

然后：把输出的百分比抄进 src/data/scenes.ts。

注意：SSD 对被遮挡的图层会失效（猫压在少年上、草丛压住栅栏底部）。
碰到那种情况要改成「内点率」容错匹配，别硬用这个脚本的结果。
本目录的图层没有互相遮挡，所以这里保持简单。

算完之后还要跑 scene-build-zones.py 才算完 —— 那个负责可点区域。
"""

import sys
import numpy as np, glob, os
from PIL import Image

# 参考画布的尺寸。scenes.ts 里的百分比都是相对它的。
BASE = sys.argv[1] if len(sys.argv) > 1 else '.'
comp = np.asarray(Image.open(os.path.join(BASE, 'composite.png')).convert('RGB'), dtype=np.float32)
H, W, _ = comp.shape
gI = comp.mean(axis=2)

# composite.png 本身不是图层，跳过
SKIP = {'composite.png', 'background.png'}

def match(path):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im, dtype=np.float32)
    t = a[:, :, :3].mean(axis=2)
    m = (a[:, :, 3] > 128).astype(np.float32)
    h, w = t.shape
    tm = t * m
    fh, fw = H + h, W + w
    F_I = np.fft.rfft2(gI, (fh, fw))
    F_T = np.fft.rfft2(tm[::-1, ::-1], (fh, fw))
    corr = np.fft.irfft2(F_I * F_T, (fh, fw))[h-1:h-1+H, w-1:w-1+W]
    F_I2 = np.fft.rfft2(gI * gI, (fh, fw))
    F_M = np.fft.rfft2(m[::-1, ::-1], (fh, fw))
    corr2 = np.fft.irfft2(F_I2 * F_M, (fh, fw))[h-1:h-1+H, w-1:w-1+W]
    t1 = float((tm * tm).sum())
    ssd = t1 - 2 * corr + corr2
    ssd = ssd[:H - h + 1, :W - w + 1]
    idx = int(np.argmin(ssd))
    y, x = divmod(idx, ssd.shape[1])
    best = float(ssd[y, x])
    npx = float(m.sum())
    rmse = (best / npx) ** 0.5
    return x, y, w, h, rmse

for f in sorted(glob.glob(os.path.join(BASE, '*.png'))):
    n = os.path.basename(f)
    if n in ('composite.png', 'background.png'):
        continue
    x, y, w, h, rmse = match(f)
    print(f'{n}\t{x}\t{y}\t{w}\t{h}\trmse={rmse:.2f}'
          f'\tleft={x/W*100:.2f}%\ttop={y/H*100:.2f}%\twidth={w/W*100:.2f}%\theight={h/H*100:.2f}%')
