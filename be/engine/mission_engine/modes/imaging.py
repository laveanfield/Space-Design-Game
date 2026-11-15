"""Mode imaging: bay qua muc tieu trong cua so (du anh sang) -> vao nadir -> chup. Chat luong theo lech tam va nhoe."""
import math
import numpy as np
from ..kernels import geometry
from .base import clamp

FOV_HALF_DEG = 5.0
MIN_EL_DEG = 45.0          # goc ngang toi thieu de coi la gan nadir
STEP_S = 15.0              # buoc lay mau cua so; cua so duoc dem them 1 buoc moi dau


def sun_elevation_deg(tg, t):
    r = geometry.station_eci(tg["lat_deg"], tg["lon_deg"], t)
    return math.degrees(math.asin(float(r @ geometry.SUN_HAT) / np.linalg.norm(r)))


class Imaging:
    id = "imaging"

    def arm(self, ctx):
        tset = ctx["params"].get("target_set", "coast")
        tgs = [t for t in ctx["targets"] if tset in t.get("mission_tags", [])] or ctx["targets"][:3]
        win = []
        for tg in tgs:
            for a, b, el in geometry.find_passes(ctx["sat_fn"], tg["lat_deg"], tg["lon_deg"], MIN_EL_DEG, 0.0, ctx["horizon_s"], STEP_S):
                if sun_elevation_deg(tg, 0.5 * (a + b)) > 10.0:           # du anh sang
                    win.append({"t0": a - STEP_S, "t1": b + STEP_S, "target": tg["id"], "name": tg.get("name", tg["id"]), "el_max": round(el, 1)})
        win.sort(key=lambda w: w["t0"])
        return {"windows": win, "captures": [], "best_quality": 0.0, "science_pts": ctx["science_pts"]}

    def on_action(self, st, action, env):
        if action.get("type") != "capture":
            return st, []
        t = env["t"]
        w = next((w for w in st["windows"] if w["t0"] <= t <= w["t1"]), None)
        if w is None or not env["capture_allowed"]:
            return st, [{"t": t, "name": "CAPTURE_DENIED", "payload": {"reason": "no_window" if w is None else "fault"}}]
        q = clamp(1 - float(action.get("offset_deg", 0.0)) / FOV_HALF_DEG) * (1 - 0.6 * env["blur"])
        cap = {"t": t, "target": w["target"], "quality": round(q, 3)}
        return {**st, "captures": st["captures"] + [cap], "best_quality": max(st["best_quality"], q)}, \
               [{"t": t, "name": "CAPTURE", "payload": cap}]

    def tick(self, st, dt, env):
        return st, []

    def score(self, st):
        return {"science_delivered_pts": st["science_pts"] * st["best_quality"],
                "detail": {"captures": len(st["captures"]), "best_quality": round(st["best_quality"], 3)}}

    def hud(self, st, t):
        nxt = next((w for w in st["windows"] if w["t1"] >= t), None)
        lines = [f"Captured frames: {len(st['captures'])}  ·  best {st['best_quality']:.0%}"]
        prompts = []
        if nxt and nxt["t0"] <= t:
            prompts.append(f"In window: {nxt['name']} — press CAPTURE")
        elif nxt:
            lines.append(f"Next window: {nxt['name']} in {nxt['t0'] - t:,.0f} s")
        else:
            lines.append("No remaining windows in horizon")
        return {"title": "IMAGING", "lines": lines, "prompts": prompts, "windows": st["windows"][:6]}

    def view_hint(self, st, t):
        inside = any(w["t0"] <= t <= w["t1"] for w in st["windows"])
        return {"camera": "nadir" if inside else "orbit"}
