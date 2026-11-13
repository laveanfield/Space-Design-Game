"""Constraint truot -> su co (ten + do nang 0..1). Tat dinh: khong co so ngau nhien o day (SEU xu ly o K-RAD theo seed)."""


def derive(results, cons, ruleset, force=()):
    up = ruleset.get("fault_upgrade", {})
    faults = []
    for r, c in zip(results, cons):
        if r["pass"] or not c.fault or c.fault == "no_go":
            continue
        sev = min(1.0, max(0.0, -r["margin"] / c.scale))
        fid = up.get(c.fault, c.fault) if sev >= 0.5 else c.fault
        faults.append({"id": fid, "severity": round(sev, 3), "constraint": c.id})
    for f in force:                                          # mission ep su co de demo
        if all(x["id"] != f for x in faults):
            faults.append({"id": f, "severity": 0.6, "constraint": None, "forced": True})
    return faults


def availability(faults, ruleset):
    """He so giao duoc khoa hoc: tich (1 - loss_f * severity_f)."""
    a = 1.0
    for f in faults:
        a *= 1.0 - ruleset["fault_loss"].get(f["id"], 0.0) * f["severity"]
    return max(a, 0.0)
