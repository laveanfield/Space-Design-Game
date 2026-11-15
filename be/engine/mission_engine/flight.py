"""fly(): thiet ke -> FlightBundle (schema flight/1). Ascent la K-ASC (backend cam duoc); precompute roi replay."""
from . import __version__
from .errors import NoGoCapacity, PayloadDoesNotFit
from .campaign import accommodation
from .kernels import ascent, orbit as korbit
from .rules import metrics
from .contract.pack import encode_f32, encode_u8
from .campaign import launch_failure


def fly(design, mission, catalog, seed=0, ballast_kg=0.0, allow_nofit=False):
    rs = mission.ruleset
    it = metrics.resolve(design, catalog)
    m = metrics.compute(design, it, mission, rs)
    fit = accommodation.check(it["bus"], design.get("comm"), it["lv"])
    if not fit["ok"] and not allow_nofit:                  # che do nghiem ngat (test/API mac dinh): chan neu khong lot fairing
        raise PayloadDoesNotFit(fit["reason"]["vi"], lv=it["lv"]["id"], bus=it["bus"]["id"], fit=fit)
    if not it["lv"].get("stages"):
        raise NoGoCapacity(f"{it['lv']['id']} thieu du lieu tang (stages): bo sung o data/overrides/launch_vehicles.yaml", lv=it["lv"]["id"])
    orb = it["orbit"]
    target = {"alt_km": orb["altitude_km"], "inc_deg": orb["inclination_deg"]}
    out = ascent.fly_ascent(it["lv"], it["site"], target, m["mass.dry_kg"] + ballast_kg, seed)
    s, a = out["series"], korbit.RE + orb["altitude_km"] * 1e3
    failure = launch_failure(m, out)
    if not fit["ok"]:
        events = {e["name"]: e["t"] for e in out["events"]}
        failure = {
            "kind": "structural_maxq",
            "t": events.get("MAXQ", 38.0),
            "explode": True,
            "constraint": "launch",
            "title": {
                "vi": "VỠ KHOANG FAIRING / BUNG NGÀM TẢI TRỌNG TẠI MAX-Q",
                "en": "FAIRING / PAYLOAD ADAPTER BREAKUP AT MAX-Q",
            },
            "cause": fit["reason"],
            "numbers": [
                *([{"label": "need_fairing_m", "value": round(fit["need_m"], 3), "unit": "m"}] if fit["need_m"] is not None else []),
                {"label": "usable_fairing_m", "value": fit["usable_m"], "unit": "m"},
            ],
        }
    return {
        "schema_version": "flight/1",
        "meta": {"catalog_hash": catalog.hash, "mission_hash": mission.hash, "engine_version": __version__, "seed": seed,
                 "ballast_kg": ballast_kg, "physics": out["physics"], "reaches_orbit": bool(out["reaches_orbit"] and fit["ok"]),
                 "reason": out["reason"], "dv_ideal_ms": out["dv_ideal_ms"], "dv_needed_ms": out["dv_needed_ms"],
                 "payload_kg": m["mass.dry_kg"], "vehicle": it["lv"]["id"], "site": it["site"]["id"], "fit_ok": fit["ok"]},
        "events": out["events"] + [{"t": out["t_sep"], "name": "PAYLOAD_SEP"}],
        "series": {"dt_s": out["dt_s"], "n": len(s["t"]), "t": encode_f32(s["t"]), "alt_km": encode_f32(s["alt_km"]),
                   "v_inertial_ms": encode_f32(s["v_inertial_ms"]), "mass_kg": encode_f32(s["mass_kg"]),
                   "thrust_n": encode_f32(s["thrust_n"]), "stage_idx": encode_u8(s["stage_idx"]),
                   **({"downrange_km": encode_f32(s["downrange_km"])} if "downrange_km" in s else {}),
                   **({"gamma_deg": encode_f32(s["gamma_deg"])} if "gamma_deg" in s else {})},
        "orbit": {"a_km": a / 1e3, "e": 0.0, "i_deg": orb["inclination_deg"], "period_s": korbit.period(a)},
        **({"insertion": out["insertion"]} if "insertion" in out else {}),
        "separation": {"t": out["t_sep"], "dv_ms": 1.0},
        "failure": failure,          # None = phong sach; nguoc lai: su co (no o Max-Q, hut van toc, vo fairing...)
    }
