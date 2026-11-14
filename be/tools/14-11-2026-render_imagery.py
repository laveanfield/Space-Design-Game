# -*- coding: utf-8 -*-
"""
RENDER_IMAGERY -- sinh bo anh "ve tinh chup" (minh hoa) cho man 04.ORBIT.

Moi anh la canh nhin tu tren xuong (nadir) dung bang thuat toan (nhieu fbm, song, ruong, duong, do thi),
khong phai anh ve tinh that. Chat luong anh trong game se bi lam xau o fe tuy thiet ke
(chi huong kem -> nhoe; SEU -> soc nhieu; duong truyen cham -> do phan giai thap / thieu dong).

Chay:  python be/tools/14-11-2026-render_imagery.py
Ra:    fe/public/imagery/*.jpg + manifest.json
Can:   numpy, scipy, pillow
"""
import json
import math
import os

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "fe", "public", "imagery"))
W, H = 640, 420


def fbm(shape, sigmas, seed, weights=None):
    rng = np.random.default_rng(seed)
    out = np.zeros(shape)
    weights = weights or [1.0 / (i + 1) for i in range(len(sigmas))]
    for s, w in zip(sigmas, weights):
        a = gaussian_filter(rng.standard_normal(shape), s, mode="wrap")
        out += w * (a - a.mean()) / (a.std() + 1e-9)
    return (out - out.min()) / (out.max() - out.min() + 1e-9)


def warp(img, seed, amp=18.0):
    """Lam meo nhe toa do -> net tu nhien hon (bo bien, song)."""
    dx = (fbm(img.shape[:2], [30, 70], seed) - 0.5) * amp
    dy = (fbm(img.shape[:2], [30, 70], seed + 1) - 0.5) * amp
    yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]]
    if img.ndim == 2:
        return map_coordinates(img, [yy + dy, xx + dx], order=1, mode="wrap")
    return np.stack([map_coordinates(img[..., c], [yy + dy, xx + dx], order=1, mode="wrap") for c in range(img.shape[2])], -1)


# bang mau theo sinh thai (RGB 0..255): [thap, giua, cao]
BIOMES = {
    "rừng lá kim":            ([34, 58, 32], [52, 78, 44], [110, 104, 88]),
    "rừng mưa nhiệt đới":     ([20, 62, 26], [34, 88, 36], [60, 104, 50]),
    "rừng bạch đàn":          ([70, 84, 52], [104, 110, 70], [150, 136, 96]),
    "rừng taiga":             ([38, 56, 40], [66, 80, 60], [140, 140, 128]),
    "đất than bùn":           ([46, 58, 34], [80, 84, 48], [116, 102, 70]),
    "cây bụi Địa Trung Hải":  ([96, 96, 62], [134, 120, 82], [176, 160, 120]),
    "rừng phương Bắc":        ([30, 50, 36], [50, 70, 50], [120, 124, 112]),
    "rừng tràm trên than bùn": ([40, 70, 38], [62, 96, 50], [96, 112, 66]),
}


def ramp(v, cols):
    c0, c1, c2 = (np.array(c, float) for c in cols)
    v = v[..., None]
    return np.where(v < 0.5, c0 + (c1 - c0) * (v / 0.5), c1 + (c2 - c1) * ((v - 0.5) / 0.5))


def land(seed, cols, water=True, fields=0.0, town=0.0):
    rng = np.random.default_rng(seed)
    h = fbm((H, W), [3, 10, 30, 80], seed, [0.25, 0.4, 0.6, 0.9])
    img = ramp(h, cols)
    img *= (0.88 + 0.24 * fbm((H, W), [1.2, 3], seed + 5))[..., None]                 # tan cay / ket cau nho
    if fields > 0:                                                                    # ruong o vuong
        for _ in range(int(40 * fields)):
            x, y = rng.integers(0, W - 60), rng.integers(0, H - 40)
            w_, h_ = rng.integers(18, 70), rng.integers(12, 44)
            tint = np.array(rng.choice([[150, 140, 80], [110, 130, 60], [170, 150, 110], [90, 110, 50]]), float)
            img[y:y + h_, x:x + w_] = img[y:y + h_, x:x + w_] * 0.35 + tint * 0.65
    if water:                                                                         # song uon luon
        r = fbm((H, W), [40, 90], seed + 9)
        river = np.exp(-((r - 0.5) / 0.018) ** 2)
        img = img * (1 - river[..., None] * 0.9) + np.array([38, 70, 96]) * river[..., None] * 0.9
    if town > 0:                                                                      # khu dan cu + duong
        cx, cy = rng.integers(W // 4, 3 * W // 4), rng.integers(H // 4, 3 * H // 4)
        for _ in range(int(160 * town)):
            x, y = int(cx + rng.normal(0, 40)), int(cy + rng.normal(0, 28))
            if 0 <= x < W - 4 and 0 <= y < H - 4:
                img[y:y + 3, x:x + 4] = rng.choice([[200, 196, 190], [160, 150, 140], [180, 90, 70]])
        img[cy - 1:cy + 1, :] = img[cy - 1:cy + 1, :] * 0.3 + 150
        img[:, cx - 1:cx + 1] = img[:, cx - 1:cx + 1] * 0.3 + 150
    return warp(img, seed + 3, 10)


def wildfire(seed, biome, thermal=False):
    rng = np.random.default_rng(seed)
    img = land(seed, BIOMES[biome], water=rng.random() < 0.7, fields=rng.random() * 0.6, town=rng.random() * 0.5)
    yy, xx = np.mgrid[0:H, 0:W]
    ang = rng.uniform(0, 2 * math.pi)                                                 # huong gio
    ux, uy = math.cos(ang), math.sin(ang)
    cx, cy = rng.uniform(0.3, 0.7) * W, rng.uniform(0.3, 0.7) * H
    along = (xx - cx) * ux + (yy - cy) * uy
    across = -(xx - cx) * uy + (yy - cy) * ux
    shape = fbm((H, W), [8, 25], seed + 21)
    front_d = along - 30 * (shape - 0.5) * 3 - 0.0004 * across ** 2 * rng.uniform(0.6, 1.4) * 60
    scar = front_d < 0
    scar_area = scar & (front_d > -rng.uniform(140, 260))
    front = np.exp(-(front_d / 4.0) ** 2) * (np.abs(across) < rng.uniform(120, 200))
    spots = (fbm((H, W), [1.5], seed + 33) > 0.82) & scar_area & (front_d > -40)
    if thermal:                                                                       # anh hong ngoai nhiet: mau gia (lanh = xanh tim, nong = vang trang)
        t = 0.25 + 0.15 * fbm((H, W), [6, 20], seed + 4) + 0.18 * scar_area + 0.9 * front + 0.6 * spots
        t = np.clip(t, 0, 1)
        img = np.stack([np.clip(t * 2.2 - 0.6, 0, 1), np.clip(t * 1.6 - 0.75, 0, 1), np.clip(0.55 - t * 0.4 + (t > 0.85) * 0.6, 0, 1)], -1) * 255
        return img
    img[scar_area] = img[scar_area] * 0.22 + np.array([34, 26, 22]) * 0.78                # vet chay
    glow = gaussian_filter(front.astype(float) + spots * 0.6, 2.0)
    img = img + glow[..., None] * np.array([255, 150, 40]) * 1.8
    core = gaussian_filter(front.astype(float), 0.8)
    img = img + core[..., None] * np.array([255, 235, 160]) * 1.2
    # khoi theo gio: dai dan, mo dan, mau trang xam
    plume_along = along - 10
    plume = np.clip(plume_along / 380, 0, 1) * (plume_along > 0)
    width = 30 + 0.55 * plume_along.clip(0)
    dens = np.exp(-(across / np.maximum(width, 1)) ** 2) * (1 - plume) * (plume_along > -10)
    dens *= 0.5 + 0.7 * fbm((H, W), [4, 12, 30], seed + 44)
    dens = np.clip(gaussian_filter(dens, 3), 0, 1) * rng.uniform(0.6, 0.9)
    img = img * (1 - dens[..., None]) + np.array([218, 214, 206]) * dens[..., None]
    return img


def coast(seed):
    rng = np.random.default_rng(seed)
    img = land(seed, ([60, 96, 54], [96, 120, 70], [150, 140, 100]), water=True, fields=0.8, town=0.6)
    yy, xx = np.mgrid[0:H, 0:W]
    edge = 0.45 * W + 60 * (fbm((H, W), [20, 60], seed + 2) - 0.5) * 3 + rng.uniform(-80, 80)
    sea = xx > edge
    depth = np.clip((xx - edge) / 220, 0, 1)
    seacol = np.array([46, 130, 150]) * (1 - depth[..., None]) + np.array([20, 60, 96]) * depth[..., None]
    img[sea] = seacol[sea]
    sand = np.abs(xx - edge) < 5
    img[sand] = [214, 200, 160]
    sed = np.exp(-((yy - H * rng.uniform(0.3, 0.7)) / 50) ** 2) * np.exp(-np.clip(xx - edge, 0, None) / 120) * sea
    img = img * (1 - 0.5 * sed[..., None]) + np.array([170, 140, 90]) * 0.5 * sed[..., None]   # phu sa cua song
    return img


def ghg(seed, kind):
    rng = np.random.default_rng(seed)
    img = land(seed, ([120, 110, 80], [150, 136, 100], [190, 176, 140]), water=False, fields=0.4, town=0.3)
    cx, cy = rng.uniform(0.3, 0.6) * W, rng.uniform(0.3, 0.7) * H
    yy, xx = np.mgrid[0:H, 0:W]
    for _ in range(14 if kind == "oil" else 4):                                       # gieng dau / ong khoi
        x, y = int(cx + rng.normal(0, 60)), int(cy + rng.normal(0, 40))
        if 2 <= x < W - 8 and 2 <= y < H - 8:
            img[y:y + 6, x:x + 6] = [60, 60, 64]
    ang = rng.uniform(0, 2 * math.pi)
    along = (xx - cx) * math.cos(ang) + (yy - cy) * math.sin(ang)
    across = -(xx - cx) * math.sin(ang) + (yy - cy) * math.cos(ang)
    conc = np.exp(-(across / (20 + 0.4 * along.clip(0))) ** 2) * np.exp(-along.clip(0) / 300) * (along > -15)
    conc = gaussian_filter(conc * (0.6 + 0.6 * fbm((H, W), [6, 18], seed + 7)), 3)
    col = np.array([255, 60, 160]) if kind == "methane" else np.array([255, 150, 40])
    a = np.clip(conc, 0, 1)[..., None] * 0.75
    return img * (1 - a) + col * a                                                     # lop phu nong do (anh do pho -> mau gia)


def save(img, name, meta, manifest):
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name), quality=88)
    manifest.append(dict(file=name, **meta))


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = []
    fires = [("FIRE-CALIFORNIA", "rừng lá kim"), ("FIRE-AMAZON", "rừng mưa nhiệt đới"), ("FIRE-NSW", "rừng bạch đàn"), ("FIRE-SIBERIA", "rừng taiga"),
             ("FIRE-KALIMANTAN", "đất than bùn"), ("FIRE-MEDITERRANEAN", "cây bụi Địa Trung Hải"), ("FIRE-CANADA", "rừng phương Bắc"), ("FIRE-UMINHTHUONG", "rừng tràm trên than bùn")]
    k = 0
    for tid, biome in fires:
        for v in range(3):
            k += 1
            save(wildfire(1000 + k * 17, biome), f"fire_{tid}_{v}.jpg", dict(theme="wildfire", target=tid, biome=biome, band="rgb"), manifest)
            save(wildfire(1000 + k * 17, biome, thermal=True), f"fire_{tid}_{v}_ir.jpg", dict(theme="wildfire", target=tid, biome=biome, band="thermal"), manifest)
    for v in range(6):
        save(coast(3000 + v * 31), f"coast_{v}.jpg", dict(theme="coast", band="rgb"), manifest)
    for v in range(4):
        save(ghg(5000 + v * 13, "methane"), f"ghg_methane_{v}.jpg", dict(theme="ghg", gas="CH4", band="spectral"), manifest)
        save(ghg(6000 + v * 13, "co2"), f"ghg_co2_{v}.jpg", dict(theme="ghg", gas="CO2", band="spectral"), manifest)
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(note="Anh minh hoa sinh bang thuat toan (be/tools/14-11-2026-render_imagery.py), khong phai anh ve tinh that.", size=[W, H], images=manifest), fh, ensure_ascii=False, indent=1)
    print("da ghi %d anh vao %s" % (len(manifest), OUT))


if __name__ == "__main__":
    main()
