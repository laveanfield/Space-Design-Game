"""Constraint la DU LIEU (ruleset.yaml + mission pack), kernel chi cung cap so."""
from dataclasses import dataclass, field
from ..errors import PackInvalid
from ..mission import expr

_KEYS = ("metric", "op", "limit", "unit", "kind", "critical", "fault", "scale", "drivers", "why")


@dataclass(frozen=True)
class Constraint:
    id: str
    metric: str
    op: str
    limit: float
    unit: str = ""
    kind: str = "hard"             # hard | soft
    critical: bool = False         # "nut that" cua mission
    fault: str | None = None       # id su co khi truot
    scale: float = 1.0             # thang do muc truot / bien tuong doi
    drivers: tuple = ()            # cac khoa metric giai thich ket qua
    why: dict = field(default_factory=dict)


def build(ruleset, mission, ctx):
    base = {c["id"]: dict(c) for c in ruleset["constraints"]}
    order = list(base)
    for ov in mission.raw.get("constraints", []):
        cid = ov["id"]
        patch = {k: v for k, v in ov.items() if k in _KEYS or k == "value"}
        if "value" in patch:
            patch["limit"] = patch.pop("value")
        if cid not in base:                                    # constraint tu them trong pack
            if not all(k in patch for k in ("metric", "op", "limit")):
                raise PackInvalid(f"constraint moi '{cid}' can metric, op, value", mission=mission.id)
            base[cid] = {"id": cid, "kind": "hard"}
            order.append(cid)
        base[cid].update(patch)
    out = []
    for cid in order:
        c = base[cid]
        limit = expr.evaluate(c["limit"], ctx)
        scale = expr.evaluate(c.get("scale", None), ctx) if c.get("scale") is not None else max(abs(limit), 1.0)
        out.append(Constraint(cid, c["metric"], c["op"], float(limit), c.get("unit", ""), c.get("kind", "hard"),
                              bool(c.get("critical", False)), c.get("fault"), max(abs(float(scale)), 1e-9),
                              tuple(c.get("drivers", ())), c.get("why", {})))
    return out


def check(c, metrics):
    v = metrics[c.metric]
    ok = v >= c.limit if c.op == ">=" else v <= c.limit
    margin = (v - c.limit) if c.op == ">=" else (c.limit - v)
    return {"id": c.id, "pass": bool(ok), "value": v, "limit": c.limit, "unit": c.unit, "margin": margin,
            "kind": c.kind, "critical": c.critical, "op": c.op}
