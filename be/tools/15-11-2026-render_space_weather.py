# -*- coding: utf-8 -*-
"""
RENDER_SPACE_WEATHER -- bo "khung quan trac bao Mat Troi" cho nhiem vu MP-SC03-SPACE-WEATHER (man 05.ORBIT).

May do tu va may do hat khong chup anh nhu camera. San pham that cua chung la DO THI va BAN DO du lieu
(tu pho, ban do thong luong hat, ban do cuc quang tu dong hat roi xuong). Vi vay moi "anh" o day la mot khung
du lieu ve bang thuat toan, theo 4 loai (be/data/geo/targets/15-11-2026-space_weather_events.yaml):
  magnetogram : 3 thanh phan tu truong theo thoi gian, bao tu 3 pha (khoi phat SSC, pha chinh, hoi phuc)
  belt_map    : mat cat vanh dai buc xa Van Allen (truc tu), bao lam vanh ngoai co lai / lap day khe
  saa_map     : di thuong Nam Dai Tay Duong tren ban do the gioi (lay mau tu earth_bluemarble.jpg)
  aurora_map  : nhin tu tren cuc: vanh cuc quang no rong khi bao (Bac / Nam)

TAT CA LA MINH HOA: hinh dang, do dam, vi tri dinh vanh dai (L ~ 1.5 va ~ 4.6 ban kinh Trai Dat la gia tri dien hinh)
khong ung voi so do that nao, va tren hinh khong ghi so lieu.

Chay:  python be/tools/15-11-2026-render_space_weather.py     ->  fe/public/imagery/sw_<ID>_<0..2>.jpg
Can:   numpy, scipy, pillow
"""
import json
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, map_coordinates

HERE = os.path.dirname(os.path.abspath(__file__))
FE_PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "fe", "public"))
OUT = os.path.join(FE_PUBLIC, "imagery")
W, H = 640, 420
RE_ORBIT = (6371.0 + 20200.0) / 6371.0          # quy dao ORB-MEO-20200 tinh theo ban kinh Trai Dat (~ 4.17)
VARIANTS = 3


def font(size):
    for name in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def fbm(shape, sigmas, seed):
    rng = np.random.default_rng(seed)
    out = np.zeros(shape)
    for i, s in enumerate(sigmas):
        a = gaussian_filter(rng.standard_normal(shape), s, mode="wrap")
        out += (a - a.mean()) / (a.std() + 1e-9) / (i + 1)
    return (out - out.min()) / (out.max() - out.min() + 1e-9)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- thang mau gia (thap -> cao), khong ghi so
STOPS = np.array([[0.00, 4, 6, 20], [0.20, 20, 30, 110], [0.42, 110, 30, 150], [0.62, 220, 50, 80],
                  [0.80, 255, 150, 30], [1.00, 255, 245, 170]])


def heat(v):
    v = np.clip(v, 0, 1)
    return np.stack([np.interp(v, STOPS[:, 0], STOPS[:, c + 1]) for c in range(3)], -1)


def colorbar(img, x0=W - 128, y0=H - 24, bw=108, bh=8):
    img[y0 - 3:y0 + bh + 3, x0 - 4:x0 + bw + 4] = [14, 16, 22]
    img[y0:y0 + bh, x0:x0 + bw] = heat(np.tile(np.linspace(0, 1, bw), (bh, 1)))


def stars(img, seed, n=520):
    rng = np.random.default_rng(seed)
    ys, xs = rng.integers(0, H, n), rng.integers(0, W, n)
    br = rng.uniform(50, 230, n)
    dark = img.sum(-1) < 60
    for y, x, v in zip(ys, xs, br):
        if dark[y, x]:
            img[y, x] = v
    return img


def to_image(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


# ---------------------------------------------------------------- 1) tu pho: 3 thanh phan theo thoi gian
def magnetogram(seed, phase):
    """phase: ssc (khoi phat), main (pha chinh), rec (hoi phuc). Ve bang PIL o do phan giai gap doi roi thu nho (khu rang cua)."""
    rng = np.random.default_rng(seed)
    S = 2
    im = Image.new("RGB", (W * S, H * S), (6, 9, 14))
    d = ImageDraw.Draw(im)
    pad_l, pad_r, pad_t, pad_b = 56 * S, 18 * S, 20 * S, 30 * S
    n = 700
    t = np.linspace(0, 1, n)
    t0 = {"ssc": 0.42, "main": 0.12, "rec": -0.15}[phase]               # luc bao bat dau (co the nam truoc cua so)

    def storm(tt, amp, lag):
        """Tu truong bao: buoc nhay SSC, tut sau (pha chinh), roi hoi phuc theo ham mu (hinh dang dien hinh, minh hoa)."""
        x = tt - t0 - lag
        step = smooth(0, 0.012, x) * 0.22                                 # SSC: tang dot ngot
        main = smooth(0.03, 0.2, x) * np.exp(-np.clip(x - 0.2, 0, None) / 0.34) * -1.0
        return amp * (step + main)

    comps = [("Bx", (90, 220, 255), 0.95, 0.0), ("By", (255, 190, 80), 0.6, 0.03), ("Bz", (255, 110, 200), 1.5, 0.06)]
    rows = len(comps)
    ph = (H * S - pad_t - pad_b) / rows
    gx = (W * S - pad_l - pad_r)
    for i in range(0, 11):                                               # luoi doc
        x = pad_l + gx * i / 10
        d.line([(x, pad_t), (x, H * S - pad_b)], fill=(24, 30, 42), width=S)
    for r, (name, col, amp, lag) in enumerate(comps):
        y0 = pad_t + r * ph
        d.rectangle([pad_l, y0 + 3 * S, pad_l + gx, y0 + ph - 3 * S], outline=(30, 38, 52), width=S)
        mid = y0 + ph / 2
        d.line([(pad_l, mid), (pad_l + gx, mid)], fill=(34, 42, 58), width=S)
        noise = gaussian_filter(rng.standard_normal(n), 1.6) * 0.04 + gaussian_filter(rng.standard_normal(n), 9) * 0.02
        wob = gaussian_filter(rng.standard_normal(n), 3) * 0.16 * smooth(0.0, 0.2, t - t0 - lag) * np.exp(-np.clip(t - t0 - lag - 0.2, 0, None) / 0.5)   # rung manh khi dang bao, lang dan
        sig = storm(t, amp, lag) * (-1 if name == "By" else 1) + noise + wob
        pts = [(pad_l + gx * ti, mid - sig_i * (ph * 0.42)) for ti, sig_i in zip(t, sig)]
        pts = [(x, min(max(y, y0 + 4 * S), y0 + ph - 4 * S)) for x, y in pts]
        d.line(pts, fill=col, width=2 * S, joint="curve")
        d.text((10 * S, mid - 8 * S), name, fill=col, font=font(15 * S))
    if 0.04 < t0 < 0.96:                                                 # danh dau luc khoi phat bao
        x = pad_l + gx * t0
        d.line([(x, pad_t), (x, H * S - pad_b)], fill=(255, 255, 255), width=S)
        d.polygon([(x - 6 * S, pad_t), (x + 6 * S, pad_t), (x, pad_t + 9 * S)], fill=(255, 255, 255))
    d.text((pad_l, H * S - 24 * S), "thoi gian  ->", fill=(150, 160, 180), font=font(13 * S))
    img = np.asarray(im.resize((W, H), Image.LANCZOS)).astype(float)
    return img


# ---------------------------------------------------------------- 2) vanh dai buc xa: mat cat truc tu
def belt_map(seed, kind):
    """Mat cat trong mat phang kinh tuyen tu (truc tu thang dung). Truc dai: R = L cos^2(lam). kind: out (vanh ngoai co lai), slot (khe bi lap)."""
    rng = np.random.default_rng(seed)
    ext_x = 7.4
    ext_y = ext_x * H / W
    xs = np.linspace(-ext_x, ext_x, W)
    ys = np.linspace(ext_y, -ext_y, H)
    X, Z = np.meshgrid(xs, ys)
    R = np.hypot(X, Z) + 1e-9
    sinlam = Z / R
    cos2 = 1 - sinlam ** 2                                               # cos^2(lam)
    L = R / np.maximum(cos2, 1e-3)
    lam = np.degrees(np.arcsin(np.clip(sinlam, -1, 1)))
    # tham so bao (minh hoa): vanh ngoai dich vao trong va manh len, khe giua bi lap day
    out_c, out_w, out_a = (3.5, 0.65, 1.0) if kind == "out" else (4.5, 0.85, 0.75)
    slot_fill = 0.55 if kind == "slot" else 0.12
    inner = 0.8 * np.exp(-((L - 1.5) / 0.30) ** 2)
    outer = out_a * np.exp(-((L - out_c) / out_w) ** 2)
    slot = slot_fill * np.exp(-((L - 2.55) / 0.38) ** 2)
    flux = (inner + outer + slot) * np.exp(-(lam / 42.0) ** 4)           # chi sat xich dao tu: len vi do cao thi duong suc cat dat
    flux *= 0.82 + 0.36 * fbm((H, W), [2, 7], seed)                      # roi loan nho
    flux *= (R > 1.04) * (L < 8.5)
    img = heat(flux ** 0.75 * 1.05)
    img *= (0.35 + 0.65 * smooth(0.0, 0.25, flux ** 0.75 * 1.4))[..., None]  # tha nen toi o noi khong co hat
    img = np.maximum(img, np.array([5, 7, 16]) * np.ones((H, W, 1)))
    # duong suc tu (L = 2, 4, 6): net mong
    for Lv in (2.0, 4.0, 6.0):
        r_line = np.abs(R - Lv * cos2) < 0.025 * Lv * 0.35 + 0.012
        img[r_line & (np.abs(lam) < 60)] = img[r_line & (np.abs(lam) < 60)] * 0.45 + np.array([110, 130, 170]) * 0.55
    # Trai Dat
    earth = R <= 1.0
    sh = np.clip(0.62 + 0.45 * X, 0.15, 1.0)                            # chieu sang tu phia +x (R <= 1 nen X in [-1, 1])
    img[earth] = (np.array([28, 78, 150]) * sh[earth][..., None] + np.array([8, 14, 30]))
    limb = (R > 1.0) & (R < 1.05)
    img[limb] = img[limb] * 0.4 + np.array([110, 170, 255]) * 0.6
    # quy dao ve tinh ORB-MEO-20200 (net dut) + ve tinh
    ring = np.abs(R - RE_ORBIT) < 0.022
    dash = (np.floor(np.degrees(np.arctan2(Z, X)) / 5) % 2) == 0
    img[ring & dash] = [235, 250, 255]
    ang = math.radians({"out": 28, "slot": -35}[kind] + rng.uniform(-6, 6))
    sx, sz = RE_ORBIT * math.cos(ang), RE_ORBIT * math.sin(ang)
    px, py = (sx + ext_x) / (2 * ext_x) * (W - 1), (ext_y - sz) / (2 * ext_y) * (H - 1)
    yy, xx = np.mgrid[0:H, 0:W]
    img += np.exp(-((xx - px) ** 2 + (yy - py) ** 2) / (2 * 3.2 ** 2))[..., None] * np.array([255, 255, 255]) * 1.2
    img += np.exp(-((xx - px) ** 2 + (yy - py) ** 2) / (2 * 14.0 ** 2))[..., None] * np.array([120, 200, 255]) * 0.35
    colorbar(img)
    return stars(img, seed)


# ---------------------------------------------------------------- 3) Di thuong Nam Dai Tay Duong
def saa_map(seed, strength):
    tex = np.asarray(Image.open(os.path.join(FE_PUBLIC, "earth_bluemarble.jpg")).convert("RGB")).astype(np.float32)
    th, tw = tex.shape[:2]
    lon0, lon1, lat1, lat0 = -118.0, 22.0, -68.0, 26.0                   # lat0 la mep tren
    lon = np.linspace(lon0, lon1, W)[None, :] * np.ones((H, 1))
    lat = np.linspace(lat0, lat1, H)[:, None] * np.ones((1, W))
    u = (lon + 180) / 360 * (tw - 1)
    v = (90 - lat) / 180 * (th - 1)
    base = np.stack([map_coordinates(tex[..., c], [v, u], order=1) for c in range(3)], -1) * 0.5     # toi di de nhin lop phu
    rng = np.random.default_rng(seed)
    cx, cy = -52.0 + rng.uniform(-6, 6), -27.0 + rng.uniform(-4, 4)
    sx, sy = 24.0 * strength, 13.0 * strength
    ang = math.radians(-25 + rng.uniform(-8, 8))
    dx, dy = lon - cx, lat - cy
    a = dx * math.cos(ang) + dy * math.sin(ang)
    b = -dx * math.sin(ang) + dy * math.cos(ang)
    f = np.exp(-((a / sx) ** 2 + (b / sy) ** 2))
    f *= 0.8 + 0.4 * fbm((H, W), [6, 18], seed + 3)
    f = np.clip(f * 1.1, 0, 1)
    al = (np.clip((f - 0.06) / 0.6, 0, 1) ** 0.8 * 0.9)[..., None]
    img = base * (1 - al) + heat(f ** 0.8) * al
    # duong dong muc (iso) + luoi kinh vi 15 do
    for lv in (0.2, 0.4, 0.6, 0.8):
        img[np.abs(f - lv) < 0.012] = [240, 240, 250]
    for g in range(-120, 30, 15):
        img[:, np.abs(np.linspace(lon0, lon1, W) - g) < 0.18] = img[:, np.abs(np.linspace(lon0, lon1, W) - g) < 0.18] * 0.7 + 25
    for g in range(-60, 30, 15):
        img[np.abs(np.linspace(lat0, lat1, H) - g) < 0.18, :] = img[np.abs(np.linspace(lat0, lat1, H) - g) < 0.18, :] * 0.7 + 25
    # ve tinh bay qua vung di thuong (duong cheo)
    yy, xx = np.mgrid[0:H, 0:W]
    s0 = (0.12, 0.78)
    for k in np.linspace(0, 1, 60):
        px, py = (s0[0] + 0.7 * k) * W, (s0[1] - 0.55 * k) * H
        img += np.exp(-((xx - px) ** 2 + (yy - py) ** 2) / (2 * 1.6 ** 2))[..., None] * np.array([255, 255, 255]) * 0.4
    colorbar(img)
    return img


# ---------------------------------------------------------------- 4) Cuc quang nhin tu tren cuc
def aurora_map(seed, hemisphere, storm):
    tex = np.asarray(Image.open(os.path.join(FE_PUBLIC, "earth_bluemarble.jpg")).convert("RGB")).astype(np.float32)
    th, tw = tex.shape[:2]
    rng = np.random.default_rng(seed)
    R = 196.0                                                            # ban kinh dia cau (px), phu den 50 do cach cuc
    colat_max = 50.0
    cx, cy = W / 2, H / 2
    yy, xx = np.mgrid[0:H, 0:W]
    dx, dy = xx - cx, cy - yy
    rho = np.hypot(dx, dy) / R
    inside = rho <= 1.0
    colat = rho * colat_max
    az = np.degrees(np.arctan2(dx, dy))                                  # 0 = huong "dem" (tren man hinh)
    lat = (90 - colat) * (1 if hemisphere == "N" else -1)
    lon = az * (1 if hemisphere == "N" else -1) - 20.0
    lon = (lon + 540) % 360 - 180
    u = (lon + 180) / 360 * (tw - 1)
    v = (90 - lat) / 180 * (th - 1)
    land = np.stack([map_coordinates(tex[..., c], [v, u], order=1, mode="wrap") for c in range(3)], -1)
    night = 0.5 + 0.5 * np.cos(np.radians(az))                          # nua tren man hinh la phia dem
    land = np.minimum(land, 150.0)                                      # bang/tuyet cuc rat sang: chan lai khong de chay sang
    img = land * (0.07 + 0.30 * (1 - night))[..., None]
    img[~inside] = 4
    # vanh cuc quang: tam lech ve phia dem, no rong khi bao (colat ~ 17 -> 27 do)
    ring_c = (22.0 if storm else 16.5) + 1.2 * np.cos(np.radians(az - 180 + 20))
    wd = 2.4 if storm else 1.6
    band = np.exp(-((colat - ring_c) / wd) ** 2)
    mlt = 0.35 + 0.65 * smooth(-30, 70, 90 - np.abs(((az - 0 + 180) % 360) - 180) + 0)   # manh nhat ve phia dem
    rays = 0.4 + 0.6 * fbm((H, W), (1.0, 7.0), seed)
    a = band * mlt * rays * inside
    a = np.clip(a * (1.4 if storm else 0.9), 0, 1.3)
    up = gaussian_filter(a, (1.5, 1.5))
    img += a[..., None] * np.array([70, 255, 150]) * 0.8 + up[..., None] * np.array([40, 200, 120]) * 0.6
    img += (np.clip(a - 0.7, 0, None) ** 1.5)[..., None] * np.array([210, 60, 190]) * 1.2
    # luoi vi do (30/60/80 do) va vanh bien
    for lat_c in (80, 70, 60):
        r_px = (90 - lat_c) / colat_max * R
        ring = np.abs(np.hypot(dx, dy) - r_px) < 0.8
        img[ring & inside] = img[ring & inside] * 0.6 + 40
    edge = (np.abs(np.hypot(dx, dy) - R) < 1.2)
    img[edge] = [110, 170, 255]
    img = stars(img, seed)
    # chi dan huong "phia dem" va "phia ngay" (ASCII, nho)
    im = to_image(img)
    d = ImageDraw.Draw(im)
    d.text((cx - 16, 8), "dem", fill=(170, 185, 210), font=font(13))
    d.text((cx - 16, H - 22), "ngay", fill=(170, 185, 210), font=font(13))
    return np.asarray(im).astype(float)                                  # khong ve thanh mau: cuc quang giu mau xanh that


# ---------------------------------------------------------------- tong hop
def targets():
    """(id, ham ve, tham so) -- id khop be/data/geo/targets/15-11-2026-space_weather_events.yaml."""
    return [
        ("SW-MAG-SSC", lambda s, v: magnetogram(s, "ssc")),
        ("SW-MAG-MAIN", lambda s, v: magnetogram(s, "main")),
        ("SW-MAG-REC", lambda s, v: magnetogram(s, "rec")),
        ("SW-BELT-OUT", lambda s, v: belt_map(s, "out")),
        ("SW-BELT-SLOT", lambda s, v: belt_map(s, "slot")),
        ("SW-SAA", lambda s, v: saa_map(s, 0.85 + 0.2 * v)),
        ("SW-AURORA-N", lambda s, v: aurora_map(s, "N", True)),
        ("SW-AURORA-S", lambda s, v: aurora_map(s, "S", True)),
    ]


def main():
    os.makedirs(OUT, exist_ok=True)
    entries = []
    for i, (tid, fn) in enumerate(targets()):
        for v in range(VARIANTS):
            name = f"sw_{tid}_{v}.jpg"
            to_image(fn(9000 + i * 53 + v * 11, v)).save(os.path.join(OUT, name), quality=90)
            entries.append(dict(file=name, theme="space_weather", target=tid, band="data-frame"))
    mpath = os.path.join(OUT, "manifest.json")                           # gop vao manifest co san (khong ghi de anh cua script khac)
    manifest = {"images": []}
    if os.path.exists(mpath):
        with open(mpath, encoding="utf-8") as fh:
            manifest = json.load(fh)
    manifest["images"] = [e for e in manifest.get("images", []) if e.get("theme") != "space_weather"] + entries
    with open(mpath, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    print("da ghi %d khung quan trac bao vao %s" % (len(entries), OUT))


if __name__ == "__main__":
    main()
