# -*- coding: utf-8 -*-
"""
BAKE_MODELS3D -- xuat model 3D that (thu vien Python "3D model", tien to 14-11-2026-) ra file nhe cho fe (Three.js).

Vi sao can file nay:
  Game Python (Ursina) dung luoi 3D moi lan khoi dong nen mo rat lau. Ban web chi can TAI file da dung san:
  moi model = 1 file .json (mo ta) + 1 file .bin (toa do int16, phap tuyen int8, mau uint8, chi so tam giac).
  Trang web chi tai dung model dang chon, nen nhe va nhanh.

Chay (can may co ursina + numpy + scipy + pillow, giong game Python):
  python be/tools/14-11-2026-bake_models3d.py --lib "<duong dan thu muc '3D model'>"
Ket qua: fe/public/models/index.json, sat_<BUS>__<COMM>.json/.bin, rocket_<LV>.json/.bin

Chi DOC thu vien goc, khong sua gi trong do. He truc cua model: z huong len (m); fe tu xoay sang y-up.
"""
import argparse
import importlib.util as _iu
import json
import os
import sys

import numpy as np

DEFAULT_LIB = r"C:\Users\OS\Desktop\BKU\Claude Playground\Space App Challenges - 2026\Rocket Flight 3D\3D model"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(HERE, "..", "..", "fe", "public", "models"))
PREFIX = "14-11-2026-"


def load_library(lib_dir):
    """Nap model3d.load() cua thu vien (tu noi cac file dong cap)."""
    spec = _iu.spec_from_file_location("m3d_model3d", os.path.join(lib_dir, PREFIX + "model3d.py"))
    mod = _iu.module_from_spec(spec)
    sys.modules["m3d_model3d"] = mod
    spec.loader.exec_module(mod)
    mod.load()
    return {name[4:]: m for name, m in sys.modules.items() if name.startswith("m3d_")}


# ---------------------------------------------------------------- gom luoi MB -> mang numpy
def mb_arrays(mb, offset=(0.0, 0.0, 0.0)):
    """MB (P, N, C, T theo tung khoi) -> (P float32 [n,3], N [n,3], C [n,3] 0..1, T uint32 [m,3]). Tra None neu rong."""
    if mb is None or not getattr(mb, "n", 0):
        return None
    P = np.concatenate(mb.P).astype(np.float32) + np.asarray(offset, np.float32)
    N = np.concatenate(mb.N).astype(np.float32)
    C = np.concatenate(mb.C).astype(np.float32)[:, :3]
    if C.max() > 1.5:                       # phong khi mau luu theo 0..255
        C = C / 255.0
    T = np.concatenate([np.asarray(t, np.uint32).reshape(-1, 3) for t in mb.T])
    return P, N, C, fix_winding(P, N, T)


def fix_winding(P, N, T):
    """Thu vien goc (Ursina, double_sided=True) khong giu chieu quan tam giac: mat am cua hop dung cung thu tu dinh
    voi mat duong. Three.js cat mat sau (backface culling) nen nua so mat bien mat -> hinh ve tinh 'vo vun'.
    Sua: tam giac nao co phap tuyen hinh hoc (tich co huong) nguoc voi phap tuyen dinh thi dao 2 dinh."""
    a, b, c = T[:, 0], T[:, 1], T[:, 2]
    g = np.cross(P[b] - P[a], P[c] - P[a])
    vn = N[a] + N[b] + N[c]
    flip = np.einsum("ij,ij->i", g, vn) < 0
    T = T.copy()
    T[flip, 1], T[flip, 2] = c[flip], b[flip]
    return T


def merge(arrays):
    """Gop nhieu luoi thanh mot (cong don chi so)."""
    arrays = [a for a in arrays if a is not None]
    if not arrays:
        return None
    base, Ps, Ns, Cs, Ts = 0, [], [], [], []
    for P, N, C, T in arrays:
        Ps.append(P); Ns.append(N); Cs.append(C); Ts.append(T + base)
        base += len(P)
    return np.concatenate(Ps), np.concatenate(Ns), np.concatenate(Cs), np.concatenate(Ts)


class BinWriter:
    """Ghi cac mang vao mot file .bin, moi mang can le 4 byte; tra ve vi tri (offset) de fe doc lai."""

    def __init__(self):
        self.chunks, self.size = [], 0

    def add(self, arr):
        raw = arr.tobytes()
        off = self.size
        pad = (-len(raw)) % 4
        self.chunks.append(raw + b"\0" * pad)
        self.size += len(raw) + pad
        return off

    def mesh(self, name, arrays, **meta):
        """Luong tu hoa 1 luoi: toa do -> int16 trong hop bao, phap tuyen -> int8, mau -> uint8."""
        P, N, C, T = arrays
        lo, hi = P.min(0), P.max(0)
        span = np.maximum(hi - lo, 1e-6)
        q = np.round((P - lo) / span * 65535.0 - 32768.0).astype(np.int16)
        n8 = np.clip(np.round(N * 127.0), -127, 127).astype(np.int8)
        c8 = np.clip(np.round(C * 255.0), 0, 255).astype(np.uint8)
        idx16 = len(P) <= 65535
        idx = T.astype(np.uint16 if idx16 else np.uint32).ravel()
        return dict(name=name, nv=int(len(P)), ni=int(idx.size), idx16=bool(idx16),
                    lo=[round(float(v), 5) for v in lo], span=[round(float(v), 5) for v in span],
                    p=self.add(q), n=self.add(n8), c=self.add(c8), i=self.add(idx), **meta)

    def save(self, path):
        with open(path, "wb") as fh:
            for chunk in self.chunks:
                fh.write(chunk)
        return self.size


def r5(v):
    return [round(float(x), 5) for x in v]


# ---------------------------------------------------------------- ve tinh
def stowed_envelope(L, model):
    """Hop bao cua ve tinh o trang thai GAP (f = 0) kem adapter/dispenser: dung de kiem tra co lot fairing khong.
    Tra {width_m, depth_m, height_m, diag_m}; diag = duong cheo mat cat ngang = duong kinh toi thieu de lot fairing tron."""
    SC = L["model_sat_common"]
    W, T = SC.flatten(model, 0.0)
    pts = [np.concatenate(m.P) for m in (W, T, model["adapter"].w) if m.n]
    P = np.concatenate(pts)
    lo, hi = P.min(0), P.max(0)
    w, d, h = (hi - lo).tolist()
    return dict(width_m=round(w, 4), depth_m=round(d, 4), height_m=round(h, 4), diag_m=round(float(np.hypot(w, d)), 4))


def bake_satellite(L, bus_id, comm_id):
    """Ve tinh = than (trang + tam pin) + adapter + cac bo phan co khop (canh pin, roi, can chao)."""
    if bus_id in ("BUS-3U", "BUS-6U"):
        model = L["model_cubesat"].build(3 if bus_id == "BUS-3U" else 6, comm_id)      # ban ve theo kich thuoc NASA
    else:
        model = L["model_satellite_buses"].build(bus_id, comm_id)
    W, meshes, parts = model_meshes(model, with_adapter=True)
    stem = "sat_%s__%s" % (bus_id, comm_id)
    return write_model_dict(L, model, stem, dict(kind="sat", bus=bus_id, comm=comm_id, envelope=stowed_envelope(L, model)), W, meshes, parts)


def model_meshes(model, with_adapter=True):
    """Luoi than + adapter + bo phan co khop cua mot model dict (ve tinh / thiet bi / ang-ten)."""
    W = BinWriter()
    meshes = []
    for key, solar in (("w", False), ("t", True)):
        a = mb_arrays(getattr(model["body"], key))
        if a is not None:
            meshes.append(W.mesh("body_" + key, a, role="body", part=-1, solar=solar))
    if with_adapter:
        a = mb_arrays(model["adapter"].w)
        if a is not None:
            meshes.append(W.mesh("adapter", a, role="adapter", part=-1, solar=False))
    parts = []
    for i, p in enumerate(model["parts"]):
        parts.append(dict(name=p["name"], parent=int(p["parent"]), pivot=r5(p["pivot"]), axis=r5(p["axis"]),
                          a0=round(float(p["a0"]), 6), a1=round(float(p["a1"]), 6), ts=float(p["ts"]), te=float(p["te"]),
                          sol=p["name"][:2] in ("wR", "wL")))
        for key, solar in (("w", False), ("t", True)):
            a = mb_arrays(getattr(p["B"], key))
            if a is not None:
                meshes.append(W.mesh(p["name"] + "_" + key, a, role="part", part=i, solar=solar))
    return W, meshes, parts


def write_model_dict(L, model, stem, extra, W=None, meshes=None, parts=None):
    if W is None:
        W, meshes, parts = model_meshes(model, with_adapter=extra.get("kind") == "sat")
    size = W.save(os.path.join(OUT_DIR, stem + ".bin"))
    info = dict(id=stem, dims=r5(model["dims"]), bin=stem + ".bin", meshes=meshes, parts=parts, **extra)
    with open(os.path.join(OUT_DIR, stem + ".json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, separators=(",", ":"))
    return stem, size, sum(m["nv"] for m in meshes)


def bake_parts_library(L, index):
    """Thiet bi chup anh (nhung cai da co ban ve) va 8 kieu ang-ten lien lac, dung rieng (khong co than ve tinh)."""
    index["instruments"], index["comms"] = {}, {}
    INS = L["model_payload_instruments"]
    for ins_id in sorted(INS.INSTRUMENTS):
        m = INS.build(ins_id)
        if m is None:
            continue
        stem, size, nv = write_model_dict(L, m, "ins_" + ins_id, dict(kind="ins", ins=ins_id))
        index["instruments"][ins_id] = stem
    CM = L["model_comms"]
    for comm_id in CM.COMM_TAG:
        m = CM.build(comm_id, with_host=False)
        stem, size, nv = write_model_dict(L, m, "comm_" + comm_id, dict(kind="comm", comm=comm_id))
        index["comms"][comm_id] = stem
    print("  thiet bi: %s | ang-ten: %d" % (", ".join(index["instruments"]), len(index["comms"])))


# ---------------------------------------------------------------- ten lua
def bake_rocket(L, vid):
    """Ten lua = cac tang (than + chi tiet), booster (da dat dung vi tri), 2 nua fairing, tai trong, phan phu."""
    V = L["model_rocket_vehicles"].build(vid)
    W = BinWriter()
    meshes, stages, boosters = [], [], []
    for i, s in enumerate(V["stages"]):
        a = merge([mb_arrays(s["body"]), mb_arrays(s["det"])])
        if a is not None:
            meshes.append(W.mesh("stage%d" % i, a, role="stage", index=i))
        stages.append(dict(z0=float(s["z0"]), z1=float(s["z1"]), kind=str(s.get("kind", "")), nozzles=[r5(n) for n in s.get("nozzles", [])]))
    for i, b in enumerate(V["boosters"]):
        a = merge([mb_arrays(b["body"], b["pos"]), mb_arrays(b["det"], b["pos"])])
        if a is not None:
            meshes.append(W.mesh("booster%d" % i, a, role="booster", index=i))
        px, py, pz = b["pos"]
        boosters.append(dict(pos=r5(b["pos"]), L=float(b["L"]), nozzles=[r5((n[0] + px, n[1] + py, n[2] + pz, n[3])) for n in b.get("nozzles", [])]))
    for i, f in enumerate(V["fairing"]):
        a = mb_arrays(f)
        if a is not None:
            meshes.append(W.mesh("fairing%d" % i, a, role="fairing", index=i))
    a = mb_arrays(V["payload"])
    if a is not None:
        meshes.append(W.mesh("payload", a, role="payload", index=0))
    for i, e in enumerate(V["extras"]):
        a = merge([mb_arrays(e["body"], e.get("pos", (0, 0, 0))), mb_arrays(e["det"], e.get("pos", (0, 0, 0)))])
        if a is not None:
            meshes.append(W.mesh("extra%d" % i, a, role="extra", index=i, label=str(e.get("name", ""))))
    stem = "rocket_%s" % vid
    size = W.save(os.path.join(OUT_DIR, stem + ".bin"))
    info = dict(kind="rocket", id=stem, vehicle=vid, name=V["name"], H=float(V["H"]), R=float(V["R"]), bin=stem + ".bin",
                meshes=meshes, stages=stages, boosters=boosters)
    with open(os.path.join(OUT_DIR, stem + ".json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, separators=(",", ":"))
    return stem, size, sum(m["nv"] for m in meshes)


# ---------------------------------------------------------------- bai phong (lay tu model_launch_sites cua game Ursina)
SITE_KEYS = ('concrete', 'steel', 'paint', 'grass', 'sand', 'gravel', 'asphalt', 'brick', 'build', 'dark', 'water', 'shadow', 'foliage')
# (texture, do bong) giong bang LOOK cua 14-11-2026-model_viewer.py
SITE_LOOK = dict(concrete=('concrete', .05), steel=('steel', .45), paint=(None, .15), grass=('grass', 0), sand=('sand', 0), gravel=('gravel', 0),
                 asphalt=('asphalt', .08), brick=('brick', .05), build=('build', .1), dark=(None, .3), water=(None, .9), foliage=(None, 0), shadow=(None, 0))
SUN = (0.55, 0.42, -0.72)


def bake_textures(L):
    """Texture thu tuc cua gfx_core (cung thuat toan voi game Ursina) -> PNG trong fe/public/models/tex/."""
    from PIL import Image
    G = L["gfx_core"]
    real_mk = G.mk_tex
    G.mk_tex = lambda arr, mip=True, aniso=8: arr          # chi lay mang numpy, khong tao Texture Ursina
    out = os.path.join(OUT_DIR, "tex")
    os.makedirs(out, exist_ok=True)
    try:
        for name, fn, size in (("concrete", G.tex_concrete, 256), ("steel", G.tex_steel, 128), ("grass", G.tex_grass, 512), ("sand", G.tex_sand, 256),
                               ("gravel", G.tex_gravel, 256), ("asphalt", G.tex_asphalt, 256), ("brick", G.tex_brick, 256), ("build", G.tex_building, 256)):
            arr = np.clip(np.asarray(fn(size) if fn.__code__.co_argcount else fn()), 0, 255).astype(np.uint8)
            Image.fromarray(arr[..., :3]).save(os.path.join(out, name + ".jpg"), quality=86)
        for name, fn in (("puff", G.tex_puff), ("glow", G.tex_glow)):
            arr = np.clip(np.asarray(fn()), 0, 255).astype(np.uint8)
            Image.fromarray(arr, "RGBA").save(os.path.join(out, name + ".png"))
    finally:
        G.mk_tex = real_mk


def site_arrays(mb):
    """Nhu mb_arrays nhung giu UV + alpha (bong do la tam trong suot)."""
    if mb is None or not getattr(mb, "n", 0):
        return None
    P = np.concatenate(mb.P).astype(np.float32)
    N = np.concatenate(mb.N).astype(np.float32)
    UV = np.concatenate(mb.UV).astype(np.float32)
    C = np.concatenate(mb.C).astype(np.float32)
    if C.max() > 1.5:
        C = C / 255.0
    T = np.concatenate([np.asarray(t, np.uint32).reshape(-1, 3) for t in mb.T])
    return P, N, UV, C, fix_winding(P, N, T)


def bake_site(L, site_id, vid):
    """Bai phong (toa do y-up, met) cho ten lua vid tai site_id: luoi theo tung texture + can noi + thong tin dat ten lua."""
    V = L["model_rocket_vehicles"].build(vid)
    S, arms, PI = L["model_launch_sites"].build_pad(SUN, V, site_id)
    W = BinWriter()
    meshes = []
    for key in SITE_KEYS:
        a = site_arrays(S.get(key))
        if a is None:
            continue
        P, N, UV, C, T = a
        m = W.mesh(key, (P, N, C[:, :3], T), role="site", tex=SITE_LOOK[key][0], gloss=SITE_LOOK[key][1])
        m["uv"] = W.add(UV.astype(np.float32))
        m["a"] = W.add(np.clip(np.round(C[:, 3] * 255), 0, 255).astype(np.uint8))
        meshes.append(m)
    pad_mod = L["model_launch_pad_classic"]
    arm_info = []
    for i, arm in enumerate(arms):
        a = mb_arrays(pad_mod.build_arm(arm["L"]))
        if a is not None:
            meshes.append(W.mesh("arm%d" % i, a, role="arm", index=i))
            arm_info.append(dict(y=float(arm["y"]), L=float(arm["L"])))
    stem = "site_%s__%s" % (site_id, vid)
    size = W.save(os.path.join(OUT_DIR, stem + ".bin"))
    info = dict(kind="site", id=stem, site=site_id, vehicle=vid, bin=stem + ".bin", meshes=meshes, arms=arm_info,
                pad={k: (float(v) if isinstance(v, (int, float, np.floating)) and not isinstance(v, bool) else v) for k, v in PI.items()})
    with open(os.path.join(OUT_DIR, stem + ".json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, separators=(",", ":"))
    return stem, size, sum(m["nv"] for m in meshes)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--lib", default=DEFAULT_LIB, help="thu muc '3D model' chua cac file 14-11-2026-model_*.py")
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    L = load_library(args.lib)
    buses = ["BUS-3U", "BUS-6U"] + [b for b in L["model_satellite_buses"].BUS_IDS if b not in ("BUS-3U", "BUS-6U")]
    comms = list(L["model_satellite_buses"].COMM_IDS)
    index = dict(note="Sinh boi be/tools/14-11-2026-bake_models3d.py tu thu vien 3D model 14-11-2026. Dung sua tay.", sats={}, rockets={})
    total = 0
    for bus in buses:
        for comm in comms:
            try:
                stem, size, nv = bake_satellite(L, bus, comm)
            except Exception as exc:                      # to hop khong dung duoc -> bo qua, fe se dung model du phong
                print("  bo qua %s + %s: %s" % (bus, comm, exc))
                continue
            index["sats"]["%s__%s" % (bus, comm)] = stem
            total += size
    print("ve tinh: %d to hop" % len(index["sats"]))
    for vid in ("LV-ELECTRON", "LV-VEGAC", "LV-ARIANE62", "LV-ARIANE64", "LV-LVM3", "LV-VULCAN-VC6", "LV-NEWGLENN", "LV-H3-24L"):
        stem, size, nv = bake_rocket(L, vid)
        index["rockets"][vid] = stem
        total += size
        print("  %-14s %6d dinh  %7.1f KB" % (vid, nv, size / 1024))
    bake_parts_library(L, index)
    # bai phong: moi cap (bai, ten lua) theo compatible_site_ids cua catalog
    bake_textures(L)
    index["sites"] = {}
    cat_path = os.path.normpath(os.path.join(HERE, "..", "build", "catalog.json"))
    with open(cat_path, encoding="utf-8") as fh:
        lvs = json.load(fh)["tables"]["launch_vehicles"]
    for vid, lv in lvs.items():
        for site in lv.get("compatible_site_ids", []):
            stem, size, nv = bake_site(L, site, vid)
            index["sites"]["%s__%s" % (site, vid)] = stem
            total += size
            print("  %-34s %7d dinh  %7.1f KB" % (stem, nv, size / 1024))
    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, indent=1)
    print("da ghi %s  (tong .bin %.2f MB)" % (OUT_DIR, total / 1e6))

    # Kich thuoc gap that cua tung to hop (bus, ang-ten) -> backend dung de kiem tra "co lot fairing khong".
    # Ang-ten cung tinh: mot chao 2,2 m gap tren CubeSat se lam ca khoi khong con nho nua.
    env = {}
    for key, stem in index["sats"].items():
        with open(os.path.join(OUT_DIR, stem + ".json"), encoding="utf-8") as fh:
            env[key] = json.load(fh)["envelope"]
    env_path = os.path.normpath(os.path.join(HERE, "..", "data", "rules", "payload_envelope.json"))
    os.makedirs(os.path.dirname(env_path), exist_ok=True)
    with open(env_path, "w", encoding="utf-8") as fh:
        json.dump(dict(note="Sinh boi be/tools/14-11-2026-bake_models3d.py: hop bao ve tinh GAP (f=0) kem adapter/dispenser, lay tu model 3D 14-11-2026. Khoa = BUS__COMM. Dung sua tay.",
                       unit="m", payloads=env), fh, indent=1)
    for key in ("BUS-3U__COM-UHF", "BUS-6U__COM-S-CUBE", "BUS-3U__COM-KA-GEO", "BUS-ESPA__COM-X-SMALL", "BUS-SMALL500__COM-X-SMALL", "BUS-LARGE-LEO__COM-KA-LEO", "BUS-GEO__COM-KA-GEO"):
        e = env.get(key)
        if e:
            print("  %-26s gap: %.2f x %.2f x %.2f m (cheo %.2f m)" % (key, e["width_m"], e["depth_m"], e["height_m"], e["diag_m"]))


if __name__ == "__main__":
    main()
