# -*- coding: utf-8 -*-
"""
RENDER_EARTH -- ve lai be mat Trai Dat cho game (nhin tu khong gian): sac net, tuoi tan, co ban dem va may.

Anh goc fe/public/earth_bluemarble.jpg chi 4096x2048, toi, mo, va co mot mang den "thieu du lieu" o Nam Dai Duong.
Script nay KHONG sua anh goc; no sinh bo anh moi vao fe/public/earth/ :

  earth_day_8k.jpg   8192x4096  ban ngay: phan loai nuoc / dat / bang -> to lai tung lop (dai duong chuyen mau theo do sau,
                                dat song mau, bang trang) roi nang len 8K, bo mep bo bien that sac, them chi tiet dia hinh
  earth_day_4k.jpg   4096x2048  ban nhe hon cho may yeu (GPU khong co texture 8K)
  earth_aux.png      4096x2048  3 kenh: R = anh den thanh pho (ban dem), G = mat nuoc (do bong), B = bang / tuyet
  earth_clouds.jpg   4096x2048  mau do day may (xam), sinh bang nhieu 3D tren mat cau (khong co duong noi)

TAT CA CHI TIET THEM VAO LA MINH HOA (sinh bang thuat toan): mau sac, dia hinh nho, may va ranh gioi anh den.
Vi tri thanh pho la toa do dia ly that (lam tron); "do sang" moi thanh pho chi la bac xep hang minh hoa theo quy mo, khong phai so lieu.

Chay:  python be/tools/15-11-2026-render_earth.py [day|lights|clouds|all] [--preview THU_MUC]
Can:   numpy, scipy, pillow
"""
import argparse
import json
import math
import os
import sys
import time

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
FE_PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "fe", "public"))
SRC = os.path.join(FE_PUBLIC, "earth_bluemarble.jpg")
OUT = os.path.join(FE_PUBLIC, "earth")


def log(msg):
    print("[%s] %s" % (time.strftime("%H:%M:%S"), msg), flush=True)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


# ---------------------------------------------------------------- nhieu 3D tren mat cau (hash so nguyen, khong can thu vien)
def _hash(ix, iy, iz, seed):
    h = (ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791) ^ (seed * 1274126177)
    h = (h ^ (h >> 13)) * 1274126177
    h = h ^ (h >> 16)
    return (h & 0xFFFFFF).astype(np.float32) / np.float32(0x1000000)


def noise3(x, y, z, seed=0):
    """Value noise 3D mem (0..1). x, y, z: mang float32 cung kich thuoc."""
    ix, iy, iz = np.floor(x), np.floor(y), np.floor(z)
    fx, fy, fz = x - ix, y - iy, z - iz
    ux, uy, uz = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy), fz * fz * (3 - 2 * fz)
    ix, iy, iz = ix.astype(np.int64), iy.astype(np.int64), iz.astype(np.int64)

    def c(dx, dy, dz):
        return _hash(ix + dx, iy + dy, iz + dz, seed)

    x00 = c(0, 0, 0) * (1 - ux) + c(1, 0, 0) * ux
    x10 = c(0, 1, 0) * (1 - ux) + c(1, 1, 0) * ux
    x01 = c(0, 0, 1) * (1 - ux) + c(1, 0, 1) * ux
    x11 = c(0, 1, 1) * (1 - ux) + c(1, 1, 1) * ux
    y0 = x00 * (1 - uy) + x10 * uy
    y1 = x01 * (1 - uy) + x11 * uy
    return y0 * (1 - uz) + y1 * uz


def fbm3(x, y, z, octaves=5, gain=0.5, lac=2.0, seed=0):
    total = np.zeros_like(x, dtype=np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        total += amp * noise3(x, y, z, seed + o * 17)
        norm += amp
        x, y, z = x * lac, y * lac, z * lac
        amp *= gain
    return total / norm


def sphere_xyz(lat_deg, lon_deg):
    la, lo = np.radians(lat_deg), np.radians(lon_deg)
    return (np.cos(la) * np.cos(lo)).astype(np.float32), np.sin(la).astype(np.float32), (-np.cos(la) * np.sin(lo)).astype(np.float32)


# ---------------------------------------------------------------- phan loai anh goc
def load_src():
    return np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32) / 255.0


def classify(src):
    """Tra (nuoc, bang) mem 0..1. Nuoc = xanh lam hoac den (mang thieu du lieu); bang = sang va gan nhu khong mau."""
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    mx, mn = src.max(-1), src.min(-1)
    sat = (mx - mn) / (mx + 1e-6)
    blue = b - np.maximum(r, g)
    water = smoothstep(0.012, 0.05, blue) * (1 - smoothstep(0.55, 0.75, lum))
    water = np.maximum(water, 1 - smoothstep(0.018, 0.05, lum))          # den thui = khong co du lieu -> coi la nuoc
    ice = smoothstep(0.60, 0.80, lum) * (1 - smoothstep(0.14, 0.32, sat))
    water = water * (1 - ice)
    return water.astype(np.float32), ice.astype(np.float32), lum.astype(np.float32)


def rgb2hsv(img):
    im = Image.fromarray(np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)).convert("HSV")
    return np.asarray(im).astype(np.float32) / 255.0


def hsv2rgb(hsv):
    im = Image.fromarray(np.clip(hsv * 255 + 0.5, 0, 255).astype(np.uint8), "HSV").convert("RGB")
    return np.asarray(im).astype(np.float32) / 255.0


def grade_land(src, ice):
    """Dat: tuoi hon (rung xanh ngoc, xavan vang olive, sa mac cam cat), tuyet trang hoi lanh."""
    hsv = rgb2hsv(src)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    green = smoothstep(0.17, 0.24, h) * (1 - smoothstep(0.40, 0.46, h))
    h = h + green * (0.31 - h) * 0.14                                        # xanh la day ve phia xanh ngoc tuoi
    s = np.clip(s * 1.32 + 0.035 * smoothstep(0.08, 0.2, s), 0, 1)
    v = np.clip(np.power(v, 0.78) * 1.16, 0, 1)
    out = hsv2rgb(np.stack([h, s, v], -1))
    snow = np.array([0.93, 0.96, 1.0], np.float32)
    out = out * (1 - 0.55 * ice[..., None]) + snow * 0.55 * ice[..., None]
    # tuong phan dia phuong: lam ro day nui / song / cac dam rung (anh gia lap do nang nhe)
    blur = np.stack([ndi.gaussian_filter(out[..., c], 2.2, mode=("nearest", "wrap")) for c in range(3)], -1)
    out = np.clip(out + 0.85 * (out - blur), 0, 1)
    return out.astype(np.float32)


def grade_ocean(lum, water):
    """Dai duong: do sau (do sang anh goc: them luc dia sang, vung sau toi) -> bang mau xanh den / xanh duong / ngoc."""
    lw = ndi.gaussian_filter(lum, 1.0, mode=("nearest", "wrap"))
    # 1) mang "khong co du lieu do sau" quanh Nam Cuc (hinh chu nhat toi hon xung quanh): dien lai tu vung lan can roi lam mem
    H = lum.shape[0]
    lat = (90 - (np.arange(H, dtype=np.float32) + 0.5) / H * 180)[:, None]
    nodata = (lw < 0.045) & (lat < -56.0) & (water > 0.5)
    if nodata.any():
        idx = ndi.distance_transform_edt(nodata, return_distances=False, return_indices=True)
        lw_fill = ndi.gaussian_filter(lw[idx[0], idx[1]], 10.0, mode=("nearest", "wrap"))
        lw = np.where(nodata, lw_fill, lw)
    t = smoothstep(0.012, 0.42, lw)
    # 2) sat bo / quanh ho va dao nho: nuoc nong -> ngoc nhat (anh goc co vien den do khu rang cua)
    dist = ndi.distance_transform_edt(water > 0.5)
    t = np.maximum(t, 0.62 * np.exp(-dist / 1.5))
    deep = np.array([6, 26, 92], np.float32) / 255
    mid = np.array([10, 76, 170], np.float32) / 255
    shallow = np.array([40, 160, 196], np.float32) / 255
    a = np.clip(t / 0.5, 0, 1)[..., None]
    b = np.clip((t - 0.5) / 0.5, 0, 1)[..., None]
    col = deep * (1 - a) + mid * a
    col = col * (1 - b) + shallow * b
    return col.astype(np.float32)


def fill_nearest(img, invalid):
    """Lap cac diem 'invalid' bang mau cua diem hop le gan nhat (de pha tron mep bo khong bi lem mau)."""
    idx = ndi.distance_transform_edt(invalid, return_distances=False, return_indices=True)
    return img[idx[0], idx[1]]


def upsample_u8(img_f, size):
    im = Image.fromarray(np.clip(img_f * 255 + 0.5, 0, 255).astype(np.uint8))
    return im.resize(size, Image.LANCZOS)


def gauss_noise(shape, sigma, seed):
    rng = np.random.default_rng(seed)
    n = rng.standard_normal(shape).astype(np.float32)
    n = ndi.gaussian_filter(n, sigma, mode=("nearest", "wrap"))
    return n / (n.std() + 1e-9)


# ---------------------------------------------------------------- ban ngay 8K
def stage_day(preview_dir=None):
    os.makedirs(OUT, exist_ok=True)
    src = load_src()
    H0, W0 = src.shape[:2]
    W8, H8 = W0 * 2, H0 * 2
    log("phan loai nuoc / dat / bang")
    water, ice, lum = classify(src)
    land4 = grade_land(src, ice)
    ocean4 = grade_ocean(lum, water)
    log("to lai tung lop va lap day qua mep bo")
    land_fill = fill_nearest(land4, water > 0.5)
    ocean_fill = fill_nearest(ocean4, water < 0.5)
    land8 = np.asarray(upsample_u8(land_fill, (W8, H8)))
    ocean8 = np.asarray(upsample_u8(ocean_fill, (W8, H8)))
    wm = Image.fromarray(water).resize((W8, H8), Image.BICUBIC)
    w8 = smoothstep(0.38, 0.62, np.asarray(wm, np.float32))               # mep bo SAC (~1 diem anh)
    del wm
    # vien bo bien: nuoc nong sang mau ngoc sat bo (bot song / bai can)
    dist4 = ndi.distance_transform_edt(water > 0.5)
    rim8 = np.asarray(Image.fromarray(dist4.astype(np.float32)).resize((W8, H8), Image.BICUBIC), np.float32)
    rim = np.exp(-np.clip(rim8, 0, None) / 3.0).astype(np.float32)
    del rim8, dist4

    log("them chi tiet dia hinh (nhieu nhieu muc)")
    # do "gap ghenh" tu anh goc: cho dat co nui / song / rung thi chi tiet manh, dong bang thi nhe
    hp = np.abs(lum - ndi.gaussian_filter(lum, 3.0, mode=("nearest", "wrap")))
    rough4 = np.clip(ndi.gaussian_filter(hp, 4.0, mode=("nearest", "wrap")) * 18.0, 0, 1)
    rough8 = np.asarray(Image.fromarray(rough4.astype(np.float32)).resize((W8, H8), Image.BICUBIC), np.float32)
    detail = np.zeros((H8, W8), np.float32)
    for sigma, weight, seed in ((14.0, 0.050, 1), (5.0, 0.060, 2), (1.9, 0.055, 3), (0.8, 0.040, 4)):
        detail += weight * gauss_noise((H8, W8), sigma, seed)
    lat8 = (90 - (np.arange(H8, dtype=np.float32) + 0.5) / H8 * 180)
    polar = (1 - smoothstep(66, 84, np.abs(lat8)))[:, None]               # gan cuc anh nhieu bi keo gian -> giam chi tiet
    amp = (0.5 + 1.15 * rough8) * polar

    log("ghep, lam net va xuat JPEG 8K")
    out = np.empty((H8, W8, 3), np.uint8)
    step = 256
    for y0 in range(0, H8, step):
        y1 = min(H8, y0 + step)
        L = land8[y0:y1].astype(np.float32) / 255.0
        O = ocean8[y0:y1].astype(np.float32) / 255.0
        w = w8[y0:y1][..., None]
        d = (detail[y0:y1] * amp[y0:y1])[..., None]
        L = L * (1 + d * (1 - 0.6 * ice_strip(ice, y0, y1, W8, H0)[..., None]))
        O = O * (1 + 0.35 * detail[y0:y1][..., None] * 0.5)
        rm = (rim[y0:y1] * w[..., 0] * 0.22)[..., None]                   # chi vien ben phia nuoc, nhe de khong thanh "vien trang"
        O = O * (1 - rm) + np.array([0.30, 0.74, 0.82], np.float32) * rm
        out[y0:y1] = np.clip((L * (1 - w) + O * w) * 255 + 0.5, 0, 255).astype(np.uint8)
    del land8, ocean8, w8, rim, detail, amp, rough8
    img = Image.fromarray(out)
    sharp = img.filter(ImageFilter_unsharp(1.2, 70))
    sharp.save(os.path.join(OUT, "earth_day_8k.jpg"), quality=88, subsampling=0, optimize=True)
    sharp.resize((W0, H0), Image.LANCZOS).save(os.path.join(OUT, "earth_day_4k.jpg"), quality=90, subsampling=0, optimize=True)
    log("da ghi earth_day_8k.jpg (%.1f MB) va earth_day_4k.jpg" % (os.path.getsize(os.path.join(OUT, "earth_day_8k.jpg")) / 1e6))
    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)
        sharp.resize((2048, 1024), Image.LANCZOS).save(os.path.join(preview_dir, "day_overview.jpg"), quality=88)
        for name, (cx, cy) in {"europe": (4500, 1050), "america": (2200, 1300), "asia": (6300, 1450)}.items():
            sharp.crop((cx - 640, cy - 400, cx + 640, cy + 400)).save(os.path.join(preview_dir, "day_crop_%s.jpg" % name), quality=90)
    return water, ice


def ice_strip(ice, y0, y1, W8, H0):
    """Lat cat theo hang cua mat na bang (nang len 8K bang lap diem, du cho he so giam chi tiet)."""
    ys = (np.arange(y0, y1) // 2).clip(0, H0 - 1)
    xs = (np.arange(W8) // 2).clip(0, ice.shape[1] - 1)
    return ice[np.ix_(ys, xs)]


def ImageFilter_unsharp(radius, percent):
    from PIL import ImageFilter

    return ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=2)


# ---------------------------------------------------------------- anh den thanh pho (ban dem)
# (ten, vi do, kinh do, bac 1..10). Toa do la toa do dia ly that (lam tron); "bac" chi la xep hang MINH HOA theo quy mo do thi,
# khong phai dan so hay do sang do duoc.
CITIES = [
    # Bac My
    ("New York", 40.71, -74.01, 10), ("Los Angeles", 34.05, -118.24, 9), ("Chicago", 41.88, -87.63, 8), ("Houston", 29.76, -95.37, 7),
    ("Dallas", 32.78, -96.80, 7), ("Washington", 38.91, -77.04, 7), ("Philadelphia", 39.95, -75.17, 6), ("Miami", 25.76, -80.19, 7),
    ("Atlanta", 33.75, -84.39, 6), ("Boston", 42.36, -71.06, 6), ("Phoenix", 33.45, -112.07, 6), ("San Francisco", 37.77, -122.42, 7),
    ("Seattle", 47.61, -122.33, 5), ("San Diego", 32.72, -117.16, 5), ("Denver", 39.74, -104.99, 5), ("Minneapolis", 44.98, -93.27, 5),
    ("Detroit", 42.33, -83.05, 5), ("St Louis", 38.63, -90.20, 4), ("Tampa", 27.95, -82.46, 4), ("Orlando", 28.54, -81.38, 4),
    ("Las Vegas", 36.17, -115.14, 4), ("Portland", 45.52, -122.68, 4), ("Salt Lake City", 40.76, -111.89, 3), ("Kansas City", 39.10, -94.58, 3),
    ("Cleveland", 41.50, -81.69, 3), ("Pittsburgh", 40.44, -80.00, 3), ("Cincinnati", 39.10, -84.51, 3), ("Charlotte", 35.23, -80.84, 3),
    ("Nashville", 36.16, -86.78, 3), ("New Orleans", 29.95, -90.07, 3), ("Baltimore", 39.29, -76.61, 3), ("San Antonio", 29.42, -98.49, 3),
    ("Austin", 30.27, -97.74, 3), ("Indianapolis", 39.77, -86.16, 3), ("Columbus", 39.96, -83.00, 3), ("Milwaukee", 43.04, -87.91, 3),
    ("Sacramento", 38.58, -121.49, 3), ("Honolulu", 21.31, -157.86, 3), ("Anchorage", 61.22, -149.90, 2), ("Toronto", 43.65, -79.38, 7),
    ("Montreal", 45.50, -73.57, 5), ("Vancouver", 49.28, -123.12, 4), ("Calgary", 51.05, -114.07, 3), ("Edmonton", 53.55, -113.49, 3),
    ("Ottawa", 45.42, -75.70, 3), ("Winnipeg", 49.90, -97.14, 2), ("Quebec", 46.81, -71.21, 2), ("Mexico City", 19.43, -99.13, 9),
    ("Guadalajara", 20.66, -103.35, 5), ("Monterrey", 25.69, -100.32, 5), ("Puebla", 19.04, -98.20, 3), ("Tijuana", 32.51, -117.04, 3),
    ("Havana", 23.11, -82.37, 4), ("Guatemala City", 14.63, -90.51, 3), ("San Juan", 18.47, -66.10, 3), ("Santo Domingo", 18.49, -69.93, 3),
    ("Panama City", 8.98, -79.52, 3), ("San Jose CR", 9.93, -84.08, 2), ("Kingston", 17.97, -76.79, 2),
    # Nam My
    ("Sao Paulo", -23.55, -46.63, 10), ("Rio de Janeiro", -22.91, -43.17, 8), ("Buenos Aires", -34.60, -58.38, 9), ("Lima", -12.05, -77.04, 7),
    ("Bogota", 4.71, -74.07, 7), ("Santiago", -33.45, -70.67, 6), ("Caracas", 10.48, -66.90, 5), ("Belo Horizonte", -19.92, -43.94, 5),
    ("Brasilia", -15.79, -47.88, 4), ("Porto Alegre", -30.03, -51.23, 4), ("Salvador", -12.97, -38.50, 4), ("Fortaleza", -3.73, -38.52, 4),
    ("Recife", -8.05, -34.88, 4), ("Curitiba", -25.43, -49.27, 4), ("Medellin", 6.24, -75.58, 4), ("Cali", 3.45, -76.53, 3),
    ("Guayaquil", -2.17, -79.92, 3), ("Quito", -0.18, -78.47, 3), ("La Paz", -16.50, -68.15, 3), ("Montevideo", -34.90, -56.16, 3),
    ("Asuncion", -25.26, -57.58, 3), ("Manaus", -3.12, -60.02, 2), ("Belem", -1.46, -48.50, 3), ("Cordoba", -31.42, -64.18, 3),
    ("Rosario", -32.95, -60.64, 3), ("Santa Cruz", -17.78, -63.18, 2), ("Campinas", -22.90, -47.06, 3), ("Goiania", -16.68, -49.25, 3),
    # Chau Au
    ("London", 51.51, -0.13, 10), ("Paris", 48.86, 2.35, 10), ("Moscow", 55.76, 37.62, 9), ("Madrid", 40.42, -3.70, 7), ("Barcelona", 41.39, 2.17, 6),
    ("Rome", 41.90, 12.50, 6), ("Milan", 45.46, 9.19, 7), ("Berlin", 52.52, 13.40, 6), ("Hamburg", 53.55, 9.99, 4), ("Munich", 48.14, 11.58, 4),
    ("Frankfurt", 50.11, 8.68, 5), ("Ruhr", 51.45, 7.0, 6), ("Cologne", 50.94, 6.96, 5), ("Amsterdam", 52.37, 4.90, 5), ("Brussels", 50.85, 4.35, 5),
    ("Vienna", 48.21, 16.37, 5), ("Warsaw", 52.23, 21.01, 5), ("Prague", 50.08, 14.44, 4), ("Budapest", 47.50, 19.04, 4), ("Bucharest", 44.43, 26.10, 4),
    ("Sofia", 42.70, 23.32, 3), ("Athens", 37.98, 23.73, 5), ("Istanbul", 41.01, 28.98, 9), ("Kyiv", 50.45, 30.52, 5), ("St Petersburg", 59.93, 30.34, 6),
    ("Stockholm", 59.33, 18.07, 4), ("Copenhagen", 55.68, 12.57, 4), ("Oslo", 59.91, 10.75, 3), ("Helsinki", 60.17, 24.94, 3), ("Dublin", 53.35, -6.26, 3),
    ("Manchester", 53.48, -2.24, 5), ("Birmingham", 52.49, -1.90, 5), ("Glasgow", 55.86, -4.25, 3), ("Lisbon", 38.72, -9.14, 4), ("Porto", 41.15, -8.61, 3),
    ("Naples", 40.85, 14.27, 4), ("Turin", 45.07, 7.69, 3), ("Lyon", 45.76, 4.84, 4), ("Marseille", 43.30, 5.37, 4), ("Zurich", 47.38, 8.54, 3),
    ("Geneva", 46.20, 6.14, 3), ("Belgrade", 44.79, 20.45, 3), ("Zagreb", 45.81, 15.98, 2), ("Minsk", 53.90, 27.57, 3), ("Riga", 56.95, 24.11, 2),
    ("Vilnius", 54.69, 25.28, 2), ("Tallinn", 59.44, 24.75, 2), ("Nizhny Novgorod", 56.33, 44.00, 3), ("Kazan", 55.79, 49.12, 3),
    ("Yekaterinburg", 56.84, 60.60, 3), ("Novosibirsk", 55.03, 82.92, 3), ("Rostov", 47.24, 39.70, 3), ("Samara", 53.20, 50.15, 3),
    ("Krasnoyarsk", 56.01, 92.85, 2), ("Omsk", 54.99, 73.37, 2), ("Vladivostok", 43.12, 131.89, 2), ("Seville", 37.39, -5.98, 3),
    ("Valencia", 39.47, -0.38, 3), ("Katowice", 50.26, 19.02, 4), ("Lille", 50.63, 3.06, 3), ("Rotterdam", 51.92, 4.48, 4), ("Stuttgart", 48.78, 9.18, 3),
    ("Leeds", 53.80, -1.55, 3), ("Liverpool", 53.41, -2.99, 3), ("Odesa", 46.48, 30.73, 2), ("Kharkiv", 49.99, 36.23, 3), ("Volgograd", 48.71, 44.51, 2),
    # Chau Phi va Trung Dong
    ("Cairo", 30.04, 31.24, 9), ("Lagos", 6.52, 3.38, 8), ("Kinshasa", -4.44, 15.27, 6), ("Johannesburg", -26.20, 28.05, 7), ("Cape Town", -33.92, 18.42, 5),
    ("Nairobi", -1.29, 36.82, 5), ("Addis Ababa", 9.03, 38.74, 4), ("Dar es Salaam", -6.79, 39.21, 4), ("Luanda", -8.84, 13.23, 5), ("Khartoum", 15.50, 32.56, 4),
    ("Algiers", 36.75, 3.06, 5), ("Casablanca", 33.57, -7.59, 5), ("Tunis", 36.81, 10.18, 3), ("Tripoli", 32.89, 13.19, 3), ("Accra", 5.60, -0.19, 4),
    ("Abidjan", 5.36, -4.00, 4), ("Dakar", 14.72, -17.47, 3), ("Kano", 12.00, 8.52, 3), ("Ibadan", 7.38, 3.95, 3), ("Durban", -29.86, 31.03, 4),
    ("Pretoria", -25.75, 28.19, 3), ("Harare", -17.83, 31.05, 2), ("Lusaka", -15.39, 28.32, 2), ("Maputo", -25.97, 32.57, 2), ("Kampala", 0.35, 32.58, 3),
    ("Antananarivo", -18.88, 47.51, 2), ("Alexandria", 31.20, 29.92, 5), ("Abuja", 9.08, 7.40, 3), ("Douala", 4.05, 9.77, 2), ("Yaounde", 3.87, 11.52, 2),
    ("Rabat", 34.02, -6.84, 3), ("Bamako", 12.64, -8.00, 2), ("Ouagadougou", 12.37, -1.52, 2), ("Conakry", 9.64, -13.58, 2), ("Lome", 6.13, 1.22, 2),
    ("Cotonou", 6.37, 2.43, 2), ("Niamey", 13.51, 2.11, 2), ("Mogadishu", 2.05, 45.32, 2), ("Lubumbashi", -11.66, 27.48, 2), ("Mombasa", -4.04, 39.67, 2),
    ("Port Elizabeth", -33.96, 25.60, 2), ("Tehran", 35.69, 51.39, 8), ("Baghdad", 33.31, 44.37, 6), ("Riyadh", 24.71, 46.68, 6), ("Jeddah", 21.54, 39.17, 5),
    ("Dubai", 25.20, 55.27, 6), ("Abu Dhabi", 24.45, 54.38, 4), ("Doha", 25.29, 51.53, 3), ("Kuwait City", 29.38, 47.99, 4), ("Tel Aviv", 32.09, 34.78, 5),
    ("Jerusalem", 31.77, 35.22, 3), ("Amman", 31.95, 35.93, 3), ("Beirut", 33.89, 35.50, 3), ("Damascus", 33.51, 36.29, 3), ("Ankara", 39.93, 32.86, 5),
    ("Izmir", 38.42, 27.14, 4), ("Mashhad", 36.30, 59.60, 3), ("Isfahan", 32.65, 51.67, 3), ("Muscat", 23.59, 58.41, 2), ("Sanaa", 15.37, 44.19, 2),
    ("Basra", 30.51, 47.78, 2), ("Mosul", 36.34, 43.13, 2), ("Dammam", 26.43, 50.10, 3), ("Medina", 24.47, 39.61, 2), ("Mecca", 21.39, 39.86, 3),
    # Chau A
    ("Tokyo", 35.68, 139.69, 10), ("Osaka", 34.69, 135.50, 8), ("Nagoya", 35.18, 136.91, 6), ("Fukuoka", 33.59, 130.40, 4), ("Sapporo", 43.06, 141.35, 3),
    ("Sendai", 38.27, 140.87, 3), ("Hiroshima", 34.39, 132.45, 3), ("Seoul", 37.57, 126.98, 9), ("Busan", 35.18, 129.08, 5), ("Daegu", 35.87, 128.60, 3),
    ("Incheon", 37.46, 126.70, 4), ("Beijing", 39.90, 116.40, 9), ("Shanghai", 31.23, 121.47, 10), ("Guangzhou", 23.13, 113.26, 8), ("Shenzhen", 22.54, 114.06, 8),
    ("Hong Kong", 22.32, 114.17, 8), ("Tianjin", 39.34, 117.36, 6), ("Chongqing", 29.56, 106.55, 6), ("Chengdu", 30.57, 104.07, 6), ("Wuhan", 30.59, 114.31, 6),
    ("Nanjing", 32.06, 118.80, 5), ("Hangzhou", 30.27, 120.16, 5), ("Xian", 34.34, 108.94, 5), ("Shenyang", 41.80, 123.43, 4), ("Harbin", 45.80, 126.53, 4),
    ("Qingdao", 36.07, 120.38, 4), ("Dalian", 38.91, 121.60, 4), ("Zhengzhou", 34.75, 113.62, 4), ("Jinan", 36.65, 117.00, 3), ("Changsha", 28.23, 112.94, 4),
    ("Kunming", 25.04, 102.72, 3), ("Hefei", 31.82, 117.23, 3), ("Fuzhou", 26.07, 119.30, 3), ("Xiamen", 24.48, 118.09, 3), ("Nanchang", 28.68, 115.86, 3),
    ("Taiyuan", 37.87, 112.55, 3), ("Shijiazhuang", 38.04, 114.51, 3), ("Urumqi", 43.83, 87.62, 3), ("Lanzhou", 36.06, 103.83, 3), ("Guiyang", 26.65, 106.63, 3),
    ("Nanning", 22.82, 108.32, 3), ("Changchun", 43.88, 125.32, 3), ("Suzhou", 31.30, 120.59, 4), ("Wuxi", 31.49, 120.31, 3), ("Ningbo", 29.87, 121.54, 3),
    ("Dongguan", 23.02, 113.75, 5), ("Foshan", 23.02, 113.12, 4), ("Taipei", 25.03, 121.57, 7), ("Kaohsiung", 22.63, 120.30, 4), ("Taichung", 24.15, 120.67, 3),
    ("Hanoi", 21.03, 105.85, 6), ("Ho Chi Minh City", 10.82, 106.63, 7), ("Da Nang", 16.05, 108.20, 2), ("Hai Phong", 20.84, 106.69, 3), ("Bangkok", 13.76, 100.50, 8),
    ("Chiang Mai", 18.79, 98.98, 2), ("Phnom Penh", 11.56, 104.92, 3), ("Vientiane", 17.97, 102.60, 2), ("Yangon", 16.87, 96.20, 4), ("Mandalay", 21.97, 96.08, 2),
    ("Kuala Lumpur", 3.14, 101.69, 6), ("Penang", 5.41, 100.33, 3), ("Singapore", 1.35, 103.82, 7), ("Jakarta", -6.21, 106.85, 9), ("Bandung", -6.92, 107.61, 4),
    ("Surabaya", -7.25, 112.75, 5), ("Medan", 3.60, 98.67, 4), ("Semarang", -6.97, 110.42, 3), ("Makassar", -5.15, 119.43, 3), ("Manila", 14.60, 120.98, 8),
    ("Cebu", 10.32, 123.89, 3), ("Davao", 7.07, 125.61, 3), ("Delhi", 28.61, 77.21, 10), ("Mumbai", 19.08, 72.88, 9), ("Kolkata", 22.57, 88.36, 8),
    ("Bangalore", 12.97, 77.59, 7), ("Chennai", 13.08, 80.27, 7), ("Hyderabad", 17.39, 78.49, 7), ("Ahmedabad", 23.02, 72.57, 6), ("Pune", 18.52, 73.86, 5),
    ("Surat", 21.17, 72.83, 4), ("Jaipur", 26.91, 75.79, 4), ("Lucknow", 26.85, 80.95, 4), ("Kanpur", 26.45, 80.35, 4), ("Nagpur", 21.15, 79.09, 3),
    ("Patna", 25.59, 85.14, 4), ("Indore", 22.72, 75.86, 3), ("Bhopal", 23.26, 77.41, 3), ("Visakhapatnam", 17.69, 83.22, 3), ("Coimbatore", 11.00, 76.96, 3),
    ("Kochi", 9.93, 76.27, 3), ("Vadodara", 22.31, 73.18, 3), ("Ludhiana", 30.90, 75.86, 3), ("Agra", 27.18, 78.02, 3), ("Varanasi", 25.32, 82.97, 3),
    ("Amritsar", 31.63, 74.87, 3), ("Chandigarh", 30.73, 76.78, 3), ("Karachi", 24.86, 67.00, 8), ("Lahore", 31.52, 74.36, 7), ("Islamabad", 33.68, 73.05, 4),
    ("Faisalabad", 31.42, 73.08, 4), ("Peshawar", 34.01, 71.58, 3), ("Dhaka", 23.81, 90.41, 9), ("Chittagong", 22.36, 91.78, 4), ("Colombo", 6.93, 79.86, 4),
    ("Kathmandu", 27.72, 85.32, 3), ("Kabul", 34.53, 69.17, 3), ("Tashkent", 41.30, 69.24, 4), ("Almaty", 43.24, 76.89, 3), ("Baku", 40.41, 49.87, 4),
    ("Tbilisi", 41.72, 44.79, 3), ("Yerevan", 40.18, 44.51, 3), ("Ulaanbaatar", 47.89, 106.91, 3), ("Astana", 51.17, 71.43, 2), ("Samarkand", 39.65, 66.96, 2),
    # Chau Dai Duong
    ("Sydney", -33.87, 151.21, 7), ("Melbourne", -37.81, 144.96, 7), ("Brisbane", -27.47, 153.03, 5), ("Perth", -31.95, 115.86, 4), ("Adelaide", -34.93, 138.60, 4),
    ("Auckland", -36.85, 174.76, 4), ("Wellington", -41.29, 174.78, 2), ("Canberra", -35.28, 149.13, 2), ("Gold Coast", -28.00, 153.40, 3),
    ("Newcastle", -32.93, 151.78, 3), ("Christchurch", -43.53, 172.64, 2), ("Hobart", -42.88, 147.33, 2), ("Darwin", -12.46, 130.84, 2), ("Port Moresby", -9.44, 147.18, 2),
]

# Vung do thi day dac ("sieu do thi / hanh lang do thi"): (vi do, kinh do, ban kinh km, cuong do 0..1) -- dang MINH HOA
REGIONS = [
    (40.2, -75.4, 380, 0.50), (42.0, -85.0, 420, 0.30), (34.2, -118.0, 260, 0.30), (30.4, -97.5, 330, 0.22), (27.5, -81.0, 300, 0.20),
    (37.6, -122.2, 200, 0.22), (47.0, -122.3, 180, 0.15), (43.7, -79.6, 220, 0.25), (19.5, -99.0, 300, 0.30), (-23.2, -46.5, 300, 0.35),
    (-22.8, -43.5, 450, 0.30), (-34.6, -58.5, 300, 0.32), (-33.4, -70.6, 220, 0.22), (4.8, -74.2, 300, 0.18), (-12.0, -77.0, 180, 0.2),
    (51.3, 6.0, 330, 0.50), (52.0, -1.0, 380, 0.42), (48.8, 2.5, 260, 0.34), (45.2, 9.5, 300, 0.38), (50.5, 19.0, 260, 0.22), (40.4, -3.7, 220, 0.18),
    (52.5, 13.4, 220, 0.2), (55.7, 37.6, 320, 0.32), (50.0, 30.0, 300, 0.15), (59.9, 30.3, 200, 0.18), (41.0, 29.0, 260, 0.32), (37.9, 23.7, 200, 0.2),
    (35.5, 137.0, 460, 0.55), (36.5, 127.3, 320, 0.42), (33.0, 116.0, 650, 0.36), (31.0, 120.6, 260, 0.55), (23.0, 113.5, 220, 0.55), (30.6, 104.5, 260, 0.26),
    (39.5, 116.6, 320, 0.42), (26.5, 80.0, 700, 0.34), (31.0, 74.5, 320, 0.30), (21.0, 73.0, 320, 0.28), (13.0, 78.0, 340, 0.24), (23.7, 90.3, 220, 0.40),
    (-7.2, 109.0, 470, 0.42), (14.3, 121.0, 260, 0.26), (14.0, 100.6, 200, 0.28), (21.0, 106.0, 150, 0.28), (10.6, 106.5, 170, 0.28), (3.3, 101.7, 180, 0.22),
    (28.5, 31.1, 380, 0.34), (32.4, 35.0, 150, 0.32), (26.0, 51.0, 150, 0.2), (25.2, 55.3, 150, 0.2), (7.0, 4.5, 360, 0.28), (5.6, -0.5, 300, 0.2),
    (-26.1, 28.1, 210, 0.34), (-33.9, 18.5, 140, 0.18), (-1.3, 36.8, 140, 0.15), (-33.7, 151.0, 280, 0.28), (-37.8, 145.0, 200, 0.24), (-27.5, 153.0, 200, 0.2),
    (35.7, 51.4, 220, 0.25), (24.7, 46.7, 150, 0.2), (33.3, 44.4, 190, 0.2), (30.0, 69.0, 200, 0.08),
]


def stage_lights(water, ice, preview_dir=None):
    os.makedirs(OUT, exist_ok=True)
    H, W = water.shape
    lat = (90 - (np.arange(H, dtype=np.float32) + 0.5) / H * 180)
    lon = ((np.arange(W, dtype=np.float32) + 0.5) / W * 360 - 180)
    px_deg = 360.0 / W
    land = (water < 0.5) & (ice < 0.5)
    land_d = ndi.binary_dilation(land, iterations=3)                    # thanh pho ven bien khong bi mat khi toa do roi sat mep nuoc
    field = np.zeros((H, W), np.float32)
    km_deg = 111.2

    def add_blob(la, lo, sigma_km, strength):
        s_lat = sigma_km / km_deg
        s_lon = s_lat / max(0.2, math.cos(math.radians(la)))
        wy, wx = int(4 * s_lat / px_deg) + 2, int(4 * s_lon / px_deg) + 2
        cy = int((90 - la) / 180 * H)
        cx = int((lo + 180) / 360 * W)
        ys = np.arange(cy - wy, cy + wy + 1)
        xs = np.arange(cx - wx, cx + wx + 1)
        yy = np.clip(ys, 0, H - 1)
        xx = np.mod(xs, W)
        dy = (90 - lat[yy] - (90 - la))[:, None] / s_lat
        dx = (((lon[xx] - lo + 540) % 360) - 180)[None, :] / s_lon
        g = np.exp(-0.5 * (dx * dx + dy * dy)).astype(np.float32) * strength
        field[np.ix_(yy, xx)] += g

    log("ve %d thanh pho + %d vung do thi" % (len(CITIES), len(REGIONS)))
    for name, la, lo, tier in CITIES:
        sigma = 6.5 + 3.4 * tier                                         # km: loi sang gon (bac cao -> rong hon)
        add_blob(la, lo, sigma, 1.25 * (tier / 10.0) ** 1.1)
        add_blob(la, lo, sigma * 2.6, 0.20 * (tier / 10.0))             # quang vang rong bao quanh
    for la, lo, rad, st in REGIONS:
        add_blob(la, lo, rad * 0.55, st * 0.55)

    # hanh lang noi cac do thi gan nhau (cao toc / do thi lien ke): net mong, mo
    log("noi cac do thi gan nhau")
    big = [(la, lo, t) for _, la, lo, t in CITIES if t >= 4]
    corridor = np.zeros((H, W), np.float32)
    for i, (la1, lo1, t1) in enumerate(big):
        for la2, lo2, t2 in big[i + 1:]:
            dist = math.hypot((la2 - la1) * km_deg, (lo2 - lo1) * km_deg * math.cos(math.radians((la1 + la2) / 2)))
            if dist > 520 or abs(lo2 - lo1) > 90:
                continue
            n = int(dist / 6) + 2
            ys = ((90 - np.linspace(la1, la2, n)) / 180 * H).astype(int).clip(0, H - 1)
            xs = (((np.linspace(lo1, lo2, n)) + 180) / 360 * W).astype(int) % W
            corridor[ys, xs] = np.maximum(corridor[ys, xs], 0.10 * min(t1, t2) / 10.0)
    corridor = ndi.gaussian_filter(corridor, 0.8, mode=("nearest", "wrap")) * 1.8
    field += corridor

    # cau truc "xoe ra" (sprawl) khong deu quanh loi sang + diem sang rieng le
    n_big = gauss_noise((H, W), 7.0, 11) * 0.45 + gauss_noise((H, W), 2.6, 12) * 0.55
    mod = np.clip(0.82 + 0.38 * n_big, 0.35, 1.35)
    lights = field * mod
    rng = np.random.default_rng(5)
    speck = (rng.random((H, W)) < np.clip(np.power(field, 1.4) * 0.45, 0, 0.30)).astype(np.float32)
    speck = ndi.gaussian_filter(speck, 0.7) * 3.2                          # diem sang le: mem, khong thanh bui hat
    lights = lights + 0.38 * speck * np.clip(field * 2.0, 0, 1)
    lights = np.where(land_d, lights, 0.0)
    lights = np.clip(np.power(np.clip(lights * 1.25, 0, 1.6), 0.9), 0, 1)
    ice_f = np.clip(ice, 0, 1)
    lights *= (1 - ice_f)

    aux = np.stack([lights, water, ice_f], -1)
    Image.fromarray(np.clip(aux * 255 + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(OUT, "earth_aux.png"), optimize=True)
    log("da ghi earth_aux.png (%.1f MB)" % (os.path.getsize(os.path.join(OUT, "earth_aux.png")) / 1e6))
    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)
        night = np.clip(lights * 1.4, 0, 1)[..., None] * np.array([1.0, 0.72, 0.38]) + 0.012
        Image.fromarray(np.clip(night * 255, 0, 255).astype(np.uint8)).resize((2048, 1024), Image.LANCZOS).save(os.path.join(preview_dir, "lights_overview.jpg"), quality=90)
        for name, (cx, cy) in {"europe": (2250, 525), "usa": (1100, 650), "asia": (3150, 725)}.items():
            Image.fromarray(np.clip(night * 255, 0, 255).astype(np.uint8)).crop((cx - 400, cy - 250, cx + 400, cy + 250)).resize((1200, 750), Image.NEAREST).save(
                os.path.join(preview_dir, "lights_crop_%s.jpg" % name), quality=90)


# ---------------------------------------------------------------- may
def stage_clouds(preview_dir=None):
    os.makedirs(OUT, exist_ok=True)
    W, H = 4096, 2048
    lat = (90 - (np.arange(H, dtype=np.float32) + 0.5) / H * 180)
    lon = ((np.arange(W, dtype=np.float32) + 0.5) / W * 360 - 180)
    out = np.empty((H, W), np.float32)
    # cac con bao xoay (vi do, kinh do, ban kinh do goc rad, chieu xoay): vi tri minh hoa
    storms = [(18, -52, 0.26, -1), (-14, 75, 0.22, 1), (30, 148, 0.25, -1), (-47, -30, 0.34, 1), (55, -28, 0.36, -1), (-38, 120, 0.28, 1), (12, 130, 0.19, -1),
              (-52, 170, 0.32, 1), (46, 160, 0.28, -1), (-24, -88, 0.17, 1), (9, -140, 0.16, -1)]
    log("sinh may bang nhieu 3D (4 dai)")
    step = 512
    for y0 in range(0, H, step):
        la = lat[y0:y0 + step][:, None] * np.ones((1, W), np.float32)
        lo = lon[None, :] * np.ones((min(step, H - y0), 1), np.float32)
        x, y, z = sphere_xyz(la, lo)
        # bien dang mien (domain warp) de may cuon xoan thay vi dam noi tron
        wx = fbm3(x * 1.7 + 11.0, y * 1.7, z * 1.7, 3, seed=101) - 0.5
        wy = fbm3(x * 1.7, y * 1.7 + 23.0, z * 1.7, 3, seed=102) - 0.5
        wz = fbm3(x * 1.7, y * 1.7, z * 1.7 + 37.0, 3, seed=103) - 0.5
        qx, qy, qz = x + 0.55 * wx, y + 0.55 * wy, z + 0.55 * wz
        base = fbm3(qx * 4.4, qy * 4.4, qz * 4.4, 6, gain=0.55, seed=7)
        fine = fbm3(qx * 20.0, qy * 20.0, qz * 20.0, 4, gain=0.55, seed=31)
        wisp = fbm3(qx * 8.0 + 3.0, qy * 8.0 + 9.0, qz * 8.0 + 5.0, 3, gain=0.5, seed=57)
        # do phu may theo vi do: ITCZ (dai may xich dao), bao ve ca (cap trung), it may o cac vanh dai ap cao 20-30 do
        a = np.abs(la)
        cover = 0.12 * np.exp(-((la - 4.0) / 7.0) ** 2) - 0.10 * np.exp(-((a - 26.0) / 9.0) ** 2) + 0.11 * np.exp(-((a - 52.0) / 12.0) ** 2) + 0.04 * np.exp(-((a - 82.0) / 8.0) ** 2)
        n = base + 0.30 * (fine - 0.5) + cover
        # bao xoay
        sp = np.zeros_like(n)
        for sla, slo, rad, sense in storms:
            cx, cy, cz = sphere_xyz(np.float32(sla), np.float32(slo))
            dot = np.clip(x * cx + y * cy + z * cz, -1, 1)
            d = np.arccos(dot)
            # huong tu tam bao toi diem: dung goc phuong vi tren tiep tuyen
            east = np.array([-math.sin(math.radians(slo)), 0.0, -math.cos(math.radians(slo))], np.float32)
            north = np.array([-math.sin(math.radians(sla)) * math.cos(math.radians(slo)), math.cos(math.radians(sla)), math.sin(math.radians(sla)) * math.sin(math.radians(slo))], np.float32)
            px_, py_, pz_ = x - dot * cx, y - dot * cy, z - dot * cz
            ang = np.arctan2(px_ * north[0] + py_ * north[1] + pz_ * north[2], px_ * east[0] + py_ * east[1] + pz_ * east[2])
            arms = 0.5 + 0.5 * np.cos(2.0 * (ang * sense - 1.7 * np.log(np.maximum(d, 1e-3) / 0.05)))
            env = np.exp(-np.power(d / rad, 1.5))
            eye = 1 - 0.85 * np.exp(-np.power(d / (rad * 0.08), 2.0))
            sp += 0.36 * env * (0.4 + 0.6 * arms) * eye
        n = n + sp
        dens = smoothstep(0.42, 0.82, n)
        cirrus = smoothstep(0.52, 0.80, wisp) * 0.30                         # may ti (cirrus) mong phu them
        out[y0:y0 + step] = np.clip(dens + (1 - dens) * cirrus, 0, 1)
    # mat do 0..1: nguong mem de co khoang troi trong, may day o loi, may mong (ti) o ria
    out = np.power(out, 1.05)
    img = Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8), "L")
    img.save(os.path.join(OUT, "earth_clouds.jpg"), quality=90, optimize=True)
    log("da ghi earth_clouds.jpg (%.1f MB), do phu may trung binh %.0f%%" % (os.path.getsize(os.path.join(OUT, "earth_clouds.jpg")) / 1e6, 100 * float(out.mean())))
    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)
        img.resize((2048, 1024), Image.LANCZOS).save(os.path.join(preview_dir, "clouds_overview.jpg"), quality=88)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("stage", nargs="?", default="all", choices=["day", "lights", "clouds", "all"])
    ap.add_argument("--preview", default=None, help="thu muc luu anh xem truoc")
    args = ap.parse_args()
    water = ice = None
    if args.stage in ("day", "all"):
        water, ice = stage_day(args.preview)
    if args.stage in ("lights", "all"):
        if water is None:
            water, ice, _ = classify(load_src())
        stage_lights(water, ice, args.preview)
    if args.stage in ("clouds", "all"):
        stage_clouds(args.preview)


if __name__ == "__main__":
    main()
