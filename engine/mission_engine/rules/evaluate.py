"""evaluate(): thiet ke + catalog + mission -> EvaluationReport (schema evaluation/1). Khong I/O, tat dinh."""
from .. import __version__
from . import metrics, constraints, faults, scoring, explain


def evaluate(design, mission, catalog, with_hints=False):
    return _evaluate(design, mission, catalog, with_hints)[0]


def _evaluate(design, mission, catalog, with_hints=False):
    """Tra ve (report, results, cons, metrics, faults) - Ops dung lai de cham diem cuoi."""
    rs = mission.ruleset
    it = metrics.resolve(design, catalog)
    m = metrics.compute(design, it, mission, rs)
    ctx = {"scenario": mission.scenario, "orbit": it["orbit"], "bus": it["bus"], "power": it["power"],
           "battery": it["battery"], "comm": it["comm"], "obc": it["obc"], "adcs": it["adcs"], "lv": it["lv"],
           "site": it["site"], "m": metrics.nest(m), "mission": {"life_years": mission.life_years, "id": mission.id},
           "ruleset": rs}
    cons = constraints.build(rs, mission, ctx)
    results = [constraints.check(c, m) for c in cons]
    flt = faults.derive(results, cons, rs, mission.hazards.get("force", ()))
    sc = scoring.score(results, cons, flt, m, mission, rs)
    mass_ok = next((r["pass"] for r in results if r["id"] == "mass"), True)
    hard_ok = all(r["pass"] for r in results if r["kind"] == "hard")
    cons_out = []
    for r, c in zip(results, cons):
        cons_out.append({**r, "fault": c.fault, "why": c.why, "scale": c.scale,
                         "drivers": {k: m.get(k) for k in c.drivers}})
    rep = {
        "schema_version": "evaluation/1", "catalog_hash": catalog.hash, "mission_hash": mission.hash,
        "engine_version": __version__, "mission": mission.id, "ok": all(r["pass"] for r in results),
        "launch_allowed": mass_ok if rs.get("launch_gate", "soft") == "soft" else hard_ok,
        "score": sc, "constraints": cons_out, "faults": flt, "metrics": m,
        "mass": {"dry_kg": m["mass.dry_kg"], "capacity_kg": m["mass.capacity_kg"],
                 "capacity_library_kg": m["mass.capacity_library_kg"], "bus_limit_kg": m["mass.bus_limit_kg"], "ballast_kg": 0.0},
        "provenance": _provenance(design, catalog),
        "explanations": explain.explain(results, cons, m), "hints": [],
    }
    if with_hints and not rep["ok"]:
        from .advisor import why_not
        rep["hints"] = why_not(design, mission, catalog, rep)
    return rep, results, cons, m, flt


def _provenance(design, catalog):
    """Gia tri trong thiet ke KHONG nguyen van tu library (default/estimate/public/calibrated)."""
    tbl = {"orbit": ("orbits", [design["orbit"]]), "bus": ("buses", [design["bus"]]), "power": ("power_arrays", [design["power"]]),
           "battery": ("batteries", [design["battery"]]), "comm": ("comms", [design["comm"]]),
           "obc": ("avionics", [design["obc"]]), "adcs": ("avionics", [design["adcs"]]),
           "instruments": ("instruments", design["instruments"]),
           "launch": ("launch_vehicles", [design["launch"]["vehicle"]])}
    out = []
    for _, (table, ids) in tbl.items():
        for i in ids:
            for f, src in catalog.prov.get(table, {}).get(i, {}).items():
                out.append({"path": f"{table}.{i}.{f}", "source": src})
    return out


def check_presets(mission, catalog):
    """Moi preset phai khop `expect`: pass | fail:<constraint> | fault:<fault>. Dung cho `make packs` va test."""
    rows = []
    for p in mission.presets:
        rep = evaluate(p["design"], mission, catalog)
        kind, _, arg = p["expect"].partition(":")
        if kind == "pass":
            ok = rep["ok"]
        elif kind == "fail":
            ok = any(c["id"] == arg and not c["pass"] for c in rep["constraints"])
        else:
            ok = any(f["id"] == arg for f in rep["faults"])
        rows.append({"mission": mission.id, "preset": p["id"], "expect": p["expect"], "ok": ok, "score": rep["score"]["total"],
                     "grade": rep["score"]["grade"], "failed": [c["id"] for c in rep["constraints"] if not c["pass"]],
                     "faults": [f["id"] for f in rep["faults"]]})
    return rows
