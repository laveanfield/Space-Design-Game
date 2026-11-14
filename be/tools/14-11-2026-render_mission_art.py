# -*- coding: utf-8 -*-
"""
RENDER_MISSION_ART -- anh nen cho tung nhiem vu (man 01.BRIEF + anh dau trang bao o man REVIEW).

Cach lam (ray tracing don gian bang numpy, khong can engine 3D):
  1. Dat may anh tren quy dao o do cao h phia tren mot diem (lat, lon), nhin chech xuong de thay chan troi cong.
  2. Moi diem anh = mot tia sang; tim giao diem tia voi qua cau ban kinh Re = 6371 km.
  3. Giao diem -> (vi do, kinh do) -> lay mau tu anh Trai Dat fe/public/earth_bluemarble.jpg (anh equirectangular).
  4. Chieu sang theo huong Mat Troi, mo suong xanh o mep chan troi, vien khi quyen, sao tren nen den.
  5. Ve chi tiet rieng cua nhiem vu len mat dat theo (vi do, kinh do): dam chay + khoi, cuc quang, chum methane.

Moi chi tiet tren anh la MINH HOA (kich thuoc khoi/chum khi phong dai cho de thay), khong phai anh ve tinh that.
Chay:  python be/tools/14-11-2026-render_mission_art.py   ->  fe/public/mission_art/<MISSION_ID>.jpg
Can:   numpy, scipy, pillow
"""
import math
import os

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates

HERE = os.path.dirname(os.path.abspath(__file__))
FE_PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "fe", "public"))
OUT = os.path.join(FE_PUBLIC, "mission_art")
RE = 6371.0                     # ban kinh Trai Dat (km)
W, H = 1600, 640                # anh banner ngang


def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def sph(lat, lon):
    la, lo = math.radians(lat), math.radians(lon)
    return np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])


def value_noise(shape, sigma, seed):
    rng = np.random.default_rng(seed)
    a = gaussian_filter(rng.standard_normal(shape), sigma, mode="wrap")
    return (a - a.min()) / (a.max() - a.min() + 1e-9)


class Globe:
    """May anh tren quy dao + tia sang toi tung diem anh."""

    def __init__(self, tex, lat, lon, alt_km, pitch_deg, yaw_deg, fov_deg=62.0):
        self.tex = tex
        up = sph(lat, lon)
        east = unit(np.array([-math.sin(math.radians(lon)), math.cos(math.radians(lon)), 0.0]))
        north = np.cross(up, east)
        yaw, pitch = math.radians(yaw_deg), math.radians(pitch_deg)
        fwd_h = math.cos(yaw) * north + math.sin(yaw) * east
        fwd = math.cos(pitch) * fwd_h - math.sin(pitch) * up            # nhin chech xuong pitch do
        right = unit(np.cross(fwd, up))
        cup = np.cross(right, fwd)
        self.C = (RE + alt_km) * up
        self.up, self.fwd_h, self.east = up, fwd_h, east
        tx = math.tan(math.radians(fov_deg) / 2)
        xs = np.linspace(-1, 1, W) * tx
        ys = np.linspace(1, -1, H) * tx * H / W
        X, Y = np.meshgrid(xs, ys)
        self.d = unit(fwd[None, None, :] + X[..., None] * right + Y[..., None] * cup)
        # giao tia - qua cau
        b = np.einsum("ijk,k->ij", self.d, self.C)
        c = self.C @ self.C - RE * RE
        disc = b * b - c
        self.hit = (disc > 0) & (-b - np.sqrt(np.maximum(disc, 0)) > 0)
        t = -b - np.sqrt(np.maximum(disc, 0))
        P = self.C[None, None, :] + t[..., None] * self.d
        self.n = unit(P)
        self.lat = np.degrees(np.arcsin(np.clip(self.n[..., 2], -1, 1)))
        self.lon = np.degrees(np.arctan2(self.n[..., 1], self.n[..., 0]))
        # khoang cach nho nhat tu tam Trai Dat toi tia (de ve vien khi quyen ngoai mep)
        self.impact = np.sqrt(np.maximum(self.C @ self.C - b * b, 0))
        self.ahead = b < 0

    def sample(self):
        th, tw = self.tex.shape[:2]
        u = (self.lon + 180.0) / 360.0 * (tw - 1)
        v = (90.0 - self.lat) / 180.0 * (th - 1)
        return np.stack([map_coordinates(self.tex[..., c], [v, u], order=1, mode="wrap") for c in range(3)], -1)

    def shade(self, sun, night_lights=0.0, seed=0):
        col = self.sample()
        mu_s = np.einsum("ijk,k->ij", self.n, sun)
        day = smooth(-0.1, 0.15, mu_s)
        lam = 0.55 + 0.45 * np.clip(mu_s, 0, 1)
        img = col * (day * lam)[..., None] + col * 0.07 * (1 - day)[..., None]   # phia dem: chi con anh trang mo
        if night_lights > 0:                                             # den thanh pho phia toi (minh hoa): dat lien sang hon bien
            land = (col[..., 2] < col[..., 0] + 12) & (col.sum(-1) > 90)
            sparkle = value_noise((H, W), 0.7, seed) > 0.86
            img += ((land & sparkle) * (1 - day) * night_lights)[..., None] * np.array([255, 196, 120])
        mu_v = np.clip(-np.einsum("ijk,ijk->ij", self.d, self.n), 0, 1)
        haze = (1 - mu_v) ** 3.2 * (0.25 + 0.75 * day)                   # mo suong xanh khi nhin xien
        img = img * (1 - 0.55 * haze[..., None]) + np.array([120, 175, 255]) * 0.55 * haze[..., None]
        out = np.zeros((H, W, 3))
        out[self.hit] = img[self.hit]
        return out, day

    def atmosphere(self, img, sun, strength=1.0):
        """Vien khi quyen: sang nhat ngay mep, mo dan len khong gian (thang do cao ~ 60 km, phong dai cho de nhin)."""
        h = np.maximum(self.impact - RE, 0)
        glow = np.exp(-h / 60.0) * self.ahead * (~self.hit)            # chi ve o vung troi ngay tren mep
        lit = smooth(-0.35, 0.3, np.einsum("ijk,k->ij", self._limb_dir(), sun))   # mep phia co nang sang hon
        g = (glow * (0.12 + 0.88 * lit) * strength)[..., None]
        return img + g * np.array([95, 160, 255])

    def _limb_dir(self):
        """Huong tu tam Trai Dat toi diem gan nhat cua tia (dung cho tia di qua mep)."""
        b = np.einsum("ijk,k->ij", self.d, self.C)
        closest = self.C[None, None, :] - b[..., None] * self.d
        return unit(closest + 1e-9)

    def stars(self, img, seed=3, n=900):
        rng = np.random.default_rng(seed)
        ys, xs = rng.integers(0, H, n), rng.integers(0, W, n)
        br = rng.uniform(60, 255, n)
        sky = (~self.hit) & (img.sum(-1) < 60)
        for y, x, v in zip(ys, xs, br):
            if sky[y, x]:
                img[y, x] = np.maximum(img[y, x], v)
        return img

    def ang_dist(self, lat, lon):
        """Khoang cach goc (do) tu moi diem mat dat toi (lat, lon)."""
        p = sph(lat, lon)
        return np.degrees(np.arccos(np.clip(np.einsum("ijk,k->ij", self.n, p), -1, 1)))

    def local_xy(self, lat, lon):
        """Toa do phang (do) quanh (lat, lon): x huong Dong, y huong Bac."""
        dlon = (self.lon - lon + 540) % 360 - 180
        return dlon * math.cos(math.radians(lat)), self.lat - lat


def destination(lat, lon, bearing_deg, dist_deg):
    """Di tu (lat, lon) theo huong bearing mot cung dist_deg tren mat cau -> (lat2, lon2)."""
    la, lo, th, de = map(math.radians, (lat, lon, bearing_deg, dist_deg))
    la2 = math.asin(math.sin(la) * math.cos(de) + math.cos(la) * math.sin(de) * math.cos(th))
    lo2 = lo + math.atan2(math.sin(th) * math.sin(de) * math.cos(la), math.cos(de) - math.sin(la) * math.sin(la2))
    return math.degrees(la2), (math.degrees(lo2) + 540) % 360 - 180


def aimed_globe(tex, tlat, tlon, alt_km, bearing_deg, horizon_frac=0.18, target_frac=0.72, fov_deg=72.0):
    """Dat may anh LUI ve phia sau muc tieu sao cho: chan troi o horizon_frac (tinh tu tren xuong),
    muc tieu (tlat, tlon) o target_frac -> anh vua thay Trai Dat cong vua thay vung nhiem vu."""
    vt = math.tan(math.radians(fov_deg) / 2) * H / W                     # tan(nua goc nhin doc)
    dip = math.degrees(math.acos(RE / (RE + alt_km)))                    # goc chan troi chim xuong
    above = math.degrees(math.atan((0.5 - horizon_frac) * 2 * vt))
    pitch = dip + above                                                  # nhin xuong them 'above' do -> chan troi nam tren tam anh
    best = None
    for s in np.linspace(0.2, 30.0, 600):                                 # thu tung khoang lui (do cung)
        clat, clon = destination(tlat, tlon, bearing_deg + 180, s)
        C = (RE + alt_km) * sph(clat, clon)
        T = RE * sph(tlat, tlon)
        v = unit(T - C)
        dep = math.degrees(math.asin(np.clip(-(v @ unit(C)), -1, 1)))      # goc nhin xuong toi muc tieu
        y = 0.5 + math.tan(math.radians(dep - pitch)) / (2 * vt)
        if best is None or abs(y - target_frac) < best[0]:
            best = (abs(y - target_frac), clat, clon)
    _, clat, clon = best
    # huong nhin = phuong vi tu may anh toi muc tieu
    la1, lo1, la2, lo2 = map(math.radians, (clat, clon, tlat, tlon))
    yaw = math.degrees(math.atan2(math.sin(lo2 - lo1) * math.cos(la2), math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(lo2 - lo1)))
    return Globe(tex, clat, clon, alt_km, pitch, yaw, fov_deg)


def add(img, mask, color, alpha):
    a = np.clip(alpha, 0, 1)[..., None] * mask[..., None]
    return img * (1 - a) + np.array(color) * a


def wildfire_scene(tex):
    g = aimed_globe(tex, 38.2, -120.6, alt_km=900, bearing_deg=20)          # nhin ve day Sierra Nevada, California
    sun = unit(g.up * 0.75 - g.fwd_h * 0.35 + g.east * 0.45)
    img, day = g.shade(sun)
    rng = np.random.default_rng(11)
    noise = value_noise((H, W), 2.0, 5)
    fires = [(39.6, -121.2), (38.4, -120.4), (36.8, -118.9), (40.6, -122.4), (34.4, -118.3), (41.3, -120.0)]
    wind = math.radians(35)                                              # gio thoi ve phia Dong-Bac (minh hoa)
    for la, lo in fires:
        x, y = g.local_xy(la, lo)
        along = x * math.cos(wind) + y * math.sin(wind)
        across = -x * math.sin(wind) + y * math.cos(wind)
        L = rng.uniform(2.5, 4.5)
        a = np.clip(along, 0, None)
        smoke = np.exp(-(across / (0.12 + 0.28 * a)) ** 2) * np.exp(-a / L) * (along > -0.05)
        smoke *= 0.55 + 0.6 * noise
        img = add(img, g.hit, [214, 210, 202], 0.85 * smoke)
        core = np.exp(-(x ** 2 + y ** 2) / (2 * 0.07 ** 2))
        img = img + (core * g.hit)[..., None] * np.array([255, 120, 30]) * 2.2
        img = img + (np.exp(-(x ** 2 + y ** 2) / (2 * 0.025 ** 2)) * g.hit)[..., None] * np.array([255, 230, 170]) * 2.0
    img = swath(g, img, 39.0, -123.5, 33.0, -116.0)
    img = g.atmosphere(img, sun, 1.0)
    return g.stars(img)


def swath(g, img, lat1, lon1, lat2, lon2, half_deg=1.1):
    """Dai quet cua ve tinh (hai duong song song mo) giua hai diem tren mat dat."""
    a, b = sph(lat1, lon1), sph(lat2, lon2)
    pole = unit(np.cross(a, b))
    off = np.degrees(np.arcsin(np.clip(np.einsum("ijk,k->ij", g.n, pole), -1, 1)))
    # chi trong doan giua 2 diem
    mid = unit(a + b)
    span = np.degrees(np.arccos(np.clip(a @ b, -1, 1))) / 2
    inside = g.ang_dist(*np.degrees([math.asin(mid[2]), math.atan2(mid[1], mid[0])])) < span + 1.5
    line = (np.abs(np.abs(off) - half_deg) < 0.03) & inside & g.hit
    return add(img, line, [120, 255, 200], 0.4)


def aurora_scene(tex):
    g = aimed_globe(tex, 64.0, -98.0, alt_km=1200, bearing_deg=8, horizon_frac=0.26, target_frac=0.66)   # Bac Canada ban dem
    sun = unit(g.fwd_h * 1.0 - g.up * 0.62)                            # Mat Troi vua khuat sau chan troi -> binh minh o mep
    img, day = g.shade(sun, night_lights=90, seed=9)
    # cuc quang: mot dai sang chay ngang qua vung muc tieu (vi do tu tinh quanh cuc tu ~80N 72W, lay gan dung -- minh hoa)
    pole = sph(80.0, -72.0)
    mlat = 90 - np.degrees(np.arccos(np.clip(np.einsum("ijk,k->ij", g.n, pole), -1, 1)))
    lonn = np.degrees(np.arctan2(g.n[..., 1], g.n[..., 0]))
    m0 = 90 - math.degrees(math.acos(float(np.clip(sph(64.0, -98.0) @ pole, -1, 1))))   # vi do tu tai muc tieu
    wav = 0.9 * np.sin(np.radians(lonn) * 9) + 0.5 * np.sin(np.radians(lonn) * 23 + 1.0)
    band = np.exp(-((mlat - m0 - wav) / 0.55) ** 2) + 0.45 * np.exp(-((mlat - m0 - 2.2 - wav) / 0.5) ** 2)
    rays = 0.35 + 0.65 * value_noise((H, W), (10.0, 1.2), 21)            # vet sang doc (rem cuc quang)
    a = np.clip(band * rays * (1 - day) * g.hit, 0, 1.2)
    # rem sang vuon LEN TREN man hinh: diem anh o hang y nhan anh sang tu dai cuc quang o cac hang ben duoi (y + k)
    up_g = np.zeros_like(a)
    up_r = np.zeros_like(a)
    for k in range(1, 90):
        sh = np.roll(a, -k, axis=0)
        sh[-k:] = 0
        up_g += sh * math.exp(-k / 14.0)
        up_r += sh * math.exp(-k / 38.0) * (k > 10)
    up_g /= 14.0
    up_r /= 38.0
    img = img + a[..., None] * np.array([80, 255, 150]) * 0.55
    img = img + up_g[..., None] * np.array([50, 230, 125]) * 0.85
    img = img + up_r[..., None] * np.array([140, 40, 170]) * 0.55
    img = g.atmosphere(img, sun, 1.6)
    img = g.stars(img, seed=4, n=1400)
    # chop sang Mat Troi o mep chan troi + vet bao (CME) minh hoa
    yy, xx = np.mgrid[0:H, 0:W]
    limb_rows = np.where(g.hit.any(axis=1))[0]
    sy = (limb_rows.min() if len(limb_rows) else H // 3) - 4
    sx = int(W * 0.72)
    r2 = (xx - sx) ** 2 + (yy - sy) ** 2
    img = img + (np.exp(-r2 / (2 * 22.0 ** 2)) * 3.0 + np.exp(-r2 / (2 * 140.0 ** 2)) * 0.6)[..., None] * np.array([255, 214, 150])
    streak = np.exp(-((yy - sy) / 3.0) ** 2) * np.exp(-np.abs(xx - sx) / 420.0)
    img = img + streak[..., None] * np.array([255, 200, 140]) * 0.9
    return img


def methane_scene(tex):
    g = aimed_globe(tex, 38.6, 56.0, alt_km=900, bearing_deg=-15)           # bo bien Caspi, Turkmenistan
    sun = unit(g.up * 0.8 + g.fwd_h * -0.2 + g.east * -0.4)
    img, day = g.shade(sun)
    noise = value_noise((H, W), 1.6, 17)
    sites = [(39.5, 53.8, 40), (38.2, 56.6, 120), (37.0, 54.4, 300), (40.6, 57.9, 70), (36.2, 59.8, 200)]
    for la, lo, wdeg in sites:
        x, y = g.local_xy(la, lo)
        w = math.radians(wdeg)
        along = x * math.cos(w) + y * math.sin(w)
        across = -x * math.sin(w) + y * math.cos(w)
        a = np.clip(along, 0, None)
        conc = np.exp(-(across / (0.05 + 0.22 * a)) ** 2) * np.exp(-a / 1.6) * (along > -0.04)
        conc = np.clip(conc * (0.4 + 0.9 * noise), 0, 1)
        colr = np.stack([np.interp(conc, [0, 0.4, 0.75, 1], [255, 255, 230, 170]),
                         np.interp(conc, [0, 0.4, 0.75, 1], [235, 170, 60, 30]),
                         np.interp(conc, [0, 0.4, 0.75, 1], [110, 40, 70, 160])], -1)
        al = (np.clip((conc - 0.08) / 0.7, 0, 1) ** 0.8 * 0.85 * g.hit)[..., None]
        img = img * (1 - al) + colr * al
    img = swath(g, img, 42.5, 52.0, 34.5, 60.5, half_deg=1.4)
    img = g.atmosphere(img, sun, 1.0)
    return g.stars(img, seed=6)


def finish(img):
    img = np.clip(img, 0, 255)
    # vignette nhe + giam nhe do bao hoa cho hop nen giao dien toi
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.35 * (((xx - W / 2) / (W / 2)) ** 2 * 0.6 + ((yy - H / 2) / (H / 2)) ** 2 * 0.4)
    img = img * v[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def main():
    os.makedirs(OUT, exist_ok=True)
    tex = np.asarray(Image.open(os.path.join(FE_PUBLIC, "earth_bluemarble.jpg")).convert("RGB")).astype(np.float32)
    scenes = {
        "MP-SC01-FIRST-EYES": wildfire_scene,
        "MP-SC03-SPACE-WEATHER": aurora_scene,
        "MP-SC04-GHG": methane_scene,
    }
    for mid, fn in scenes.items():
        finish(fn(tex)).save(os.path.join(OUT, f"{mid}.jpg"), quality=86)
        print("da ghi", mid)


if __name__ == "__main__":
    main()
