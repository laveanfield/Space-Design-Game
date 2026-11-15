"""Mode downlink: ha du lieu ve tram mat dat khi trong cua so. Ops chuyen du lieu; mode theo doi tien do va diem."""
from ..kernels import geometry
from .base import clamp


class Downlink:
    id = "downlink"

    def arm(self, ctx):
        stn = ctx["stations"][0]
        win = [{"t0": a, "t1": b, "target": stn["id"], "name": stn["name"], "el_max": round(el, 1)}
               for a, b, el in geometry.find_passes(ctx["sat_fn"], stn["lat_deg"], stn["lon_deg"],
                                                    stn.get("min_elevation_deg", 10.0), 0.0, ctx["horizon_s"], 30.0)]
        goal = max(ctx["generated_gb_per_day"] * ctx["horizon_s"] / 86400.0, 1e-9)
        return {"windows": win, "station": stn["id"], "goal_gb": goal, "downlinked_gb": 0.0, "science_pts": ctx["science_pts"]}

    def on_action(self, st, action, env):
        return st, []

    def tick(self, st, dt, env):
        return {**st, "downlinked_gb": env["downlinked_gb"]}, []

    def score(self, st):
        frac = clamp(st["downlinked_gb"] / st["goal_gb"])
        return {"science_delivered_pts": st["science_pts"] * frac, "detail": {"downlinked_gb": round(st["downlinked_gb"], 4), "goal_gb": round(st["goal_gb"], 4)}}

    def hud(self, st, t):
        nxt = next((w for w in st["windows"] if w["t1"] >= t), None)
        lines = [f"Downlinked {st['downlinked_gb']:.3f} / {st['goal_gb']:.3f} GB"]
        if nxt:
            lines.append(f"Station {nxt['name']}: " + ("IN VIEW" if nxt["t0"] <= t else f"in {nxt['t0'] - t:,.0f} s"))
        return {"title": "DOWNLINK", "lines": lines, "prompts": [], "windows": st["windows"][:6]}

    def view_hint(self, st, t):
        return {"camera": "orbit"}
