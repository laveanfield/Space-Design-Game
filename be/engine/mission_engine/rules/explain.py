"""Explainer tat dinh (template): doc ket qua constraint + drivers, khong goi LLM, khong them so."""

_OP = {">=": {"vi": "cần ≥", "en": "needs ≥"}, "<=": {"vi": "cần ≤", "en": "needs ≤"}}


def explain(results, cons, metrics):
    out = []
    for r, c in zip(results, cons):
        if r["pass"]:
            continue
        drv = {k: (round(metrics[k], 4) if k in metrics and isinstance(metrics[k], float) else metrics.get(k)) for k in c.drivers}
        dtxt = ", ".join(f"{k}={v}" for k, v in drv.items())
        eff = {"vi": f" Hệ quả: {c.fault}." if c.fault else "", "en": f" Effect: {c.fault}." if c.fault else ""}
        out.append({
            "constraint": c.id, "drivers": drv, "fault": c.fault, "why": c.why,
            "text": {
                "vi": f"Trượt «{c.id}»: đo được {r['value']:.4g} {c.unit}, {_OP[c.op]['vi']} {r['limit']:.4g}. Nguyên nhân: {dtxt}.{eff['vi']}",
                "en": f"Failed '{c.id}': measured {r['value']:.4g} {c.unit}, {_OP[c.op]['en']} {r['limit']:.4g}. Drivers: {dtxt}.{eff['en']}",
            },
        })
    return out
