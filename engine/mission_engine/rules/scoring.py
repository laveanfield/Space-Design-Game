"""Cham diem: score = 100 * sum(w_i * s_i). Cong thuc de xuat (doi chieu voi mission_design.py cu, quyet dinh D4)."""
from .faults import availability


def _clamp(x):
    return max(0.0, min(1.0, x))


def score(results, cons, faults, m, mission, rs, science_delivered=None):
    w = mission.weights
    avail = availability(faults, rs)
    # Ops da tinh anh huong su co vao diem cua mode; chi nhan he so availability khi cham diem luc thiet ke
    sci = m["science.pts"] * avail if science_delivered is None else science_delivered
    s_sci = _clamp(sci / m["science.required_pts"]) if m["science.required_pts"] > 0 else 1.0
    budget = float(mission.scenario.get("budget_musd", 0) or 0)
    s_eff = _clamp(1 - m["cost.total_musd"] / budget) if budget > 0 else 0.0
    hard = [(r, c) for r, c in zip(results, cons) if c.kind == "hard"]
    ref = rs["margin_ref"]
    s_margin = sum(_clamp((r["margin"] / c.scale) / ref) for r, c in hard) / len(hard) if hard else 1.0
    failed = sum(1 for r, _ in hard if not r["pass"])
    s_dec = 1 - failed / len(hard) if hard else 1.0
    crit = [r for r in results if r["critical"]]
    if crit and all(r["pass"] for r in crit):
        s_dec = min(1.0, s_dec + 0.1)
    parts = {"science": s_sci, "efficiency": s_eff, "margin": s_margin, "decisions": s_dec}
    total = 100 * sum(w[k] * parts[k] for k in parts)
    grade = next((g for g, lo in sorted(rs["grade_bands"].items(), key=lambda kv: -kv[1]) if total >= lo), "D")
    return {"total": round(total, 1), "grade": grade, "parts": {k: round(v, 3) for k, v in parts.items()},
            "science_delivered_pts": round(sci, 2), "availability": round(avail, 3)}
