"""Ten lua nao cho duoc ve tinh nao (launch accommodation).

Hai dieu kien (chi tiet + nguon NASA: be/data/rules/14-11-2026-launch_accommodation.yaml):
  1) Lot fairing: duong cheo ve tinh GAP <= duong kinh fairing dung duoc.
  2) Cung nhom kich co: ten lua co giao dien lap (dispenser / ESPA / adapter) cho nhom bus do.
Day la su that vat ly luc tich hop (khong lap vao duoc thi khong phong duoc), KHONG phai loi khuyen thiet ke.
"""
import json
from functools import lru_cache
from pathlib import Path

import yaml

RULES = Path(__file__).resolve().parents[3] / "data" / "rules"


@lru_cache(maxsize=1)
def _rules():
    with open(RULES / "14-11-2026-launch_accommodation.yaml", encoding="utf-8") as fh:
        acc = yaml.safe_load(fh)
    env_path = RULES / "payload_envelope.json"
    env = json.loads(env_path.read_text(encoding="utf-8"))["payloads"] if env_path.exists() else {}
    return acc, env


def envelope(bus_id, comm_id):
    """Hop bao ve tinh gap {width_m, depth_m, height_m, diag_m} hoac None neu chua bake model."""
    return _rules()[1].get(f"{bus_id}__{comm_id}")


def check(bus, comm_id, lv):
    """bus, lv: muc catalog. Tra {ok, fits, class_ok, need_m, usable_m, bus_class, accepts, interface, reason}."""
    acc, _ = _rules()
    rule = acc["launch_vehicles"].get(lv["id"], {})
    accepts = rule.get("accepts", [])
    bus_class = bus.get("class", "")
    env = envelope(bus["id"], comm_id)
    usable = float(lv.get("fairing_diameter_m") or 0.0) * float(acc.get("usable_factor", 0.9))
    need = env["diag_m"] if env else None
    fits = need is None or need <= usable
    class_ok = not accepts or bus_class in accepts
    iface = acc["interfaces"].get(bus_class, {"vi": bus_class, "en": bus_class})
    if not class_ok:
        reason = {"vi": f"{lv['name']} không có {iface['vi']}: chỉ nhận nhóm {', '.join(accepts)}.",
                  "en": f"{lv['name']} has no {iface['en']}: it only takes {', '.join(accepts)} payloads."}
    elif not fits:
        reason = {"vi": f"Vệ tinh gấp cần lòng fairing Ø {need:.2f} m, {lv['name']} chỉ có Ø {usable:.2f} m dùng được.",
                  "en": f"Stowed satellite needs a {need:.2f} m fairing, {lv['name']} offers {usable:.2f} m."}
    else:
        reason = None
    return {"ok": bool(fits and class_ok), "fits": bool(fits), "class_ok": bool(class_ok), "need_m": need,
            "usable_m": round(usable, 3), "bus_class": bus_class, "accepts": accepts, "interface": iface, "reason": reason}


def matrix(catalog_tables):
    """Bang tra cuu cho fe: moi (bus, comm) x moi ten lua -> ok/ly do. Nho (7 x 8 x 8)."""
    buses, comms, lvs = catalog_tables["buses"], catalog_tables["comms"], catalog_tables["launch_vehicles"]
    out = {}
    for bid, bus in buses.items():
        for cid in comms:
            out[f"{bid}__{cid}"] = {lid: check(bus, cid, lv) for lid, lv in lvs.items()}
    return out
