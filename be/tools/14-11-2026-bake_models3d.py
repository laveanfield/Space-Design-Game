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
    return P, N, C, T


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
def bake_satellite(L, bus_id, comm_id):
    """Ve tinh = than (trang + tam pin) + adapter + cac bo phan co khop (canh pin, roi, can chao)."""
    if bus_id in ("BUS-3U", "BUS-6U"):
        model = L["model_cubesat"].build(3 if bus_id == "BUS-3U" else 6, comm_id)      # ban ve theo kich thuoc NASA
    else:
        model = L["model_satellite_buses"].build(bus_id, comm_id)
    W = BinWriter()
    meshes = []
    for key, solar in (("w", False), ("t", True)):
        a = mb_arrays(getattr(model["body"], key))
        if a is not None:
            meshes.append(W.mesh("body_" + key, a, role="body", part=-1, solar=solar))
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
    stem = "sat_%s__%s" % (bus_id, comm_id)
    size = W.save(os.path.join(OUT_DIR, stem + ".bin"))
    info = dict(kind="sat", id=stem, bus=bus_id, comm=comm_id, dims=r5(model["dims"]), bin=stem + ".bin", meshes=meshes, parts=parts)
    with open(os.path.join(OUT_DIR, stem + ".json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, separators=(",", ":"))
    return stem, size, sum(m["nv"] for m in meshes)


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
    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, indent=1)
    print("da ghi %s  (tong .bin %.2f MB)" % (OUT_DIR, total / 1e6))


if __name__ == "__main__":
    main()
