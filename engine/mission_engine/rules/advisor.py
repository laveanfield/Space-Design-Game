"""Advisor: loc tuong thich -> liet ke co cat tia -> top-k; why_not (thay MOT slot de sua constraint truot)."""
import copy
from pathlib import Path
from ..mission import expr
from ..mission.pack import load_ruleset, load_missions
from .evaluate import evaluate

ORDER = ("orbit", "instruments", "bus", "power", "battery", "comm", "obc", "adcs", "launch")


def slot_options(mission, catalog):
    """Danh sach lua chon moi slot theo design_space.allow cua pack (mac dinh: tat ca) va quy dao cho phep cua de."""
    T, ctx = catalog.tables, {"scenario": mission.scenario}
    allow = mission.design_space.get("allow", {})

    def pick(key, table, only=None):
        v = allow.get(key, "*")
        if isinstance(v, str) and v.startswith("@"):
            v = expr.evaluate(v, ctx)
        ids = catalog.ids(table)
        if v == "*" or v is None:
            out = ids
        elif isinstance(v, list):
            out = [i for i in v if i in T[table]]
        else:
            out = [i for i in ids if all(T[table][i].get(k) in vs for k, vs in v.items())]
        return [i for i in out if only is None or T[table][i].get("type") == only]

    orbits = pick("orbits", "orbits")
    if mission.scenario.get("allowed_orbit_ids"):
        orbits = [o for o in orbits if o in mission.scenario["allowed_orbit_ids"]]
    lvs = pick("launch_vehicles", "launch_vehicles")
    return {"orbit": orbits, "instruments": pick("instruments", "instruments"), "bus": pick("buses", "buses"),
            "power": pick("power", "power_arrays"), "battery": pick("batteries", "batteries"), "comm": pick("comms", "comms"),
            "obc": pick("obc", "avionics", "obc"), "adcs": pick("adcs", "avionics", "adcs"),
            "launch": [{"vehicle": lv, "site": s} for lv in lvs for s in T["launch_vehicles"][lv].get("compatible_site_ids", [])
                       if s in T["launch_sites"]]}


def _prune(slot, ch, mission, catalog):
    """Kiem tra RE truoc khi tinh day du: tuong thich, chi phi cong don, khoi luong bus, chi huong, buc xa."""
    g, budget = catalog.get, float(mission.scenario.get("budget_musd", 1e18) or 1e18)
    cost = sum(g(t, ch[k]).get("cost_musd", 0) for t, k in (("buses", "bus"), ("power_arrays", "power"), ("batteries", "battery"),
               ("comms", "comm"), ("avionics", "obc"), ("avionics", "adcs")) if k in ch)
    cost += sum(g("instruments", i).get("cost_musd", 0) for i in ch.get("instruments", []))
    if "launch" in ch:
        cost += g("launch_vehicles", ch["launch"]["vehicle"]).get("cost_musd", 0)
    if cost > budget:
        return False
    ins = [g("instruments", i) for i in ch.get("instruments", [])]
    if slot == "instruments":
        return all(ch["orbit"] in i.get("compatible_orbit_ids", [ch["orbit"]]) for i in ins)
    if slot == "bus":
        return sum(i["mass_kg"] for i in ins) + g("buses", ch["bus"])["mass_kg"] <= g("buses", ch["bus"])["max_total_mass_kg"]
    if slot == "obc":
        dose = g("orbits", ch["orbit"])["radiation_dose_krad_per_year"] * mission.life_years
        return g("avionics", ch["obc"]).get("rad_tolerance_krad", 0) >= dose
    if slot == "adcs":
        return g("avionics", ch["adcs"]).get("pointing_accuracy_deg", 1e9) <= min(i["pointing_required_deg"] for i in ins)
    return True


def _walk(opts, mission, catalog):
    def rec(i, ch):
        if i == len(ORDER):
            yield copy.deepcopy(ch)
            return
        slot = ORDER[i]
        for v in opts[slot]:
            ch[slot] = [v] if slot == "instruments" else v
            if _prune(slot, ch, mission, catalog):
                yield from rec(i + 1, ch)
        ch.pop(slot, None)
    yield from rec(0, {})


def advise(mission, catalog, objective="max_score", k=5, max_evals=20000):
    """Top-k thiet ke dat du budget. objective: max_score | min_cost. n_ok la so thiet ke dat trong pham vi da duyet."""
    opts, found, n_ok, n = slot_options(mission, catalog), [], 0, 0
    truncated = False
    for d in _walk(opts, mission, catalog):
        if n >= max_evals:
            truncated = True
            break
        n += 1
        d.update({"mission": mission.id, "seed": mission.hazards.get("seed", 0)})
        rep = evaluate(d, mission, catalog)
        if rep["ok"]:
            n_ok += 1
            found.append({"design": d, "score": rep["score"]["total"], "grade": rep["score"]["grade"],
                          "cost_musd": rep["metrics"]["cost.total_musd"]})
    found.sort(key=(lambda f: -f["score"]) if objective == "max_score" else (lambda f: f["cost_musd"]))
    return {"designs": found[:k], "n_evaluated": n, "n_ok": n_ok, "truncated": truncated}


def why_not(design, mission, catalog, report=None, top=2):
    """Voi moi constraint truot: cac phep thay MOT slot lam constraint do dat ma khong lam hong cai dang dat."""
    rep = report or evaluate(design, mission, catalog)
    failing = [c["id"] for c in rep["constraints"] if not c["pass"]]
    base_pass = {c["id"] for c in rep["constraints"] if c["pass"]}
    opts = slot_options(mission, catalog)
    hints = []
    for cid in failing:
        fixes = []
        for slot in ("instruments", "bus", "power", "battery", "comm", "obc", "adcs", "launch"):
            for v in opts[slot]:
                cand = copy.deepcopy(design)
                cand[slot] = [v] if slot == "instruments" else v
                if cand == design:
                    continue
                try:
                    r2 = evaluate(cand, mission, catalog)
                except Exception:
                    continue
                st = {c["id"]: c["pass"] for c in r2["constraints"]}
                if st.get(cid) and all(st.get(x, False) for x in base_pass):
                    fixes.append({"constraint": cid, "slot": slot, "from": design[slot], "to": cand[slot],
                                  "d_cost_musd": round(r2["metrics"]["cost.total_musd"] - rep["metrics"]["cost.total_musd"], 3),
                                  "d_mass_kg": round(r2["metrics"]["mass.dry_kg"] - rep["metrics"]["mass.dry_kg"], 3)})
        fixes.sort(key=lambda f: f["d_cost_musd"])
        hints += fixes[:top]
    return hints


def feasibility_report(root, max_evals=5000):
    """Ham cho Data Doctor D12: [(mission_id, so thiet ke kha thi)] voi catalog dang xay."""
    def fn(cat):
        rs = load_ruleset(Path(root) / "missions" / "ruleset.yaml")
        ms = load_missions(Path(root) / "missions", cat, rs)
        return [(mid, advise(m, cat, k=1, max_evals=max_evals)["n_ok"]) for mid, m in ms.items()]
    return fn
