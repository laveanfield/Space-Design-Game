"""Chon mode tu du lieu (missions/mode_resolver.yaml). Luat dau tien khop thang; mode chua cai -> roi ve imaging + canh bao."""
from ..mission import expr
from .registry import REGISTRY


def _get(ctx, path):
    cur = ctx
    for k in path.split("."):
        if isinstance(cur, dict) and k in cur:
            cur = cur[k]
        else:
            return None
    return cur


def _match(spec, val, ctx):
    if isinstance(spec, dict):
        for op, rhs in spec.items():
            rhs = expr.evaluate(rhs, ctx)
            ok = {"not": lambda: val != rhs, "lt": lambda: val is not None and val < rhs,
                  "gt": lambda: val is not None and val > rhs}[op]()
            if not ok:
                return False
        return True
    if isinstance(spec, list):
        vals = val if isinstance(val, list) else [val]
        return any(v in spec for v in vals)
    return val == spec


def resolve_mode(rules, mission, it, m):
    """Tra ve (mode_id, overlays, warnings)."""
    ctx = {"mission": {"gameplay": mission.gameplay, "life_years": mission.life_years},
           "design": {"instrument": {"kind": [i.get("kind") for i in it["instruments"]]}},
           "orbit": it["orbit"], "metrics": {"orbit_lifetime_years": m["lifetime.years"]}}
    mode = rules.get("default", "imaging")
    for r in rules.get("rules", []):
        if all(_match(spec, _get(ctx, path), ctx) for path, spec in r["when"].items()):
            mode = expr.evaluate(r["use"], ctx)
            break
    overlays = list(mission.gameplay.get("overlays", []))
    for r in rules.get("overlays", []):
        if all(_match(spec, _get(ctx, path), ctx) for path, spec in r["when"].items()) and r["add"] not in overlays:
            overlays.append(r["add"])
    warnings = []
    if mode not in REGISTRY:
        warnings.append(f"mode '{mode}' chua cai dat -> dung imaging")
        mode = "imaging"
    return mode, overlays, warnings
