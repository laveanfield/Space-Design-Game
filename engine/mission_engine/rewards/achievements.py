"""Thuong: thanh tich + XP tinh tu ket qua (dieu kien la du lieu trong missions/rewards.yaml)."""
from ..mission import expr
from ..mission.pack import load_yaml


def load(path):
    return load_yaml(path)


def build_result(debrief, report, room=None):
    """Gom cac so dung cho dieu kien thuong. `room` (dict) co thi la choi dong doi."""
    hard = [c for c in report["constraints"] if c["kind"] == "hard"]
    min_rel = min((c["margin"] / c["scale"] for c in hard), default=0.0)
    budget = debrief.get("budget_musd") or 0
    r = {"score": debrief["score"], "design_ok": bool(debrief["design_ok"]), "faults": len(debrief["faults"]),
         "cost_ratio": (debrief["cost_musd"] / budget) if budget else 1.0, "min_margin_rel": min_rel,
         "coop": room is not None, "members": 1, "roles_used": 0, "design_time_s": 1e12}
    if room is not None:
        r["members"] = len(room["members"])
        r["roles_used"] = len({role for e in room["log"] for role in room["members"].get(e["by"], {}).get("roles", [])})
        if room.get("designed_at"):
            r["design_time_s"] = room["designed_at"] - room["created_at"]
    return r


def award(rules, r):
    """-> {"earned": [{id, title, points}], "xp": int}"""
    earned = [{"id": a["id"], "title": a["title"], "points": a["points"]}
              for a in rules.get("achievements", []) if expr.evaluate(a["when"], {"r": r})]
    xp = r["score"]["total"] + (rules["xp"]["pass_bonus"] if r["design_ok"] else 0)
    if r["coop"]:
        xp += rules["xp"]["coop_bonus_per_member"] * r["members"]
    xp += sum(e["points"] for e in earned)
    return {"earned": earned, "xp": int(round(xp))}
