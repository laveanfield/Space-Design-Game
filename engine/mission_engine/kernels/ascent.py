"""K-ASC: ascent N tang.

SKELETON: backend mac dinh la GIAI TICH (placeholder, chi de duong ong chay thong tu dau den cuoi).
Vat ly da kiem chung (rocket_orbit_multi.py: RK4, ISA, Trai Dat quay, gravity turn) cam vao bang register_backend().
Bundle tra ve co meta.physics = 'placeholder-analytic' de viewer/UI hien nhan canh bao."""
import math
from .orbit import RE, v_circ
from .dv_budget import G0, tsiolkovsky
from . import insertion

MANIFEST = {
    "id": "K-ASC",
    "equations": ["dV = sum_i Isp_i*g0*ln(m0_i/mf_i)", "v_needed = v_circ + L - v_rot", "reaches = dV_ideal >= v_needed"],
    "assumptions": ["PLACEHOLDER: ton hao L co dinh (estimate), khong tich phan quy dao", "tang noi tiep (booster song song chua mo hinh)"],
    "valid_range": "chi dung de chay duong ong; thay bang backend da kiem chung",
    "refs": ["rocket_orbit_multi.py (legacy)"],
    "tests": ["placeholder_reaches_orbit"],
}
LOSS_MS = 1500.0      # [estimate] tong ton hao trong luc + khi dong + lai cho LEO (dai thuong gap 1.2-1.8 km/s)
SEP_DELAY_S = 60.0


def stage_dvs(stages, payload_kg):
    """Delta-v ly tuong tung tang noi tiep; tang i bo khoi luong kho cua tang truoc khi tach."""
    dvs, above = [], payload_kg
    tail = [s["propellant_kg"] + s["dry_kg"] for s in stages]
    for i, s in enumerate(stages):
        m0 = above + sum(tail[i:])
        mf = m0 - s["propellant_kg"]
        dvs.append(tsiolkovsky(s["isp_s"], m0, mf))
    return dvs


def capacity_model_kg(vehicle, alt_km, inc_deg, lat_deg):
    """Tai lon nhat (kg) ma backend placeholder cho la len duoc quy dao muc tieu (chia doi)."""
    lo, hi = 0.0, vehicle["liftoff_mass_kg"]
    for _ in range(40):
        mid = 0.5 * (lo + hi)
        ok = _needed(vehicle, mid, alt_km, inc_deg, lat_deg)[2] >= 0
        lo, hi = (mid, hi) if ok else (lo, mid)
    return lo


def _needed(vehicle, payload_kg, alt_km, inc_deg, lat_deg):
    p = insertion.plan(alt_km, inc_deg, lat_deg)
    dv = sum(stage_dvs(vehicle["stages"], payload_kg))
    need = p["v_circ"] + LOSS_MS - p["v_rot"]
    if alt_km > 2000:                                   # MEO/GTO/GEO: quy dao do 400 km roi Hohmann (K-INS giai tich)
        r1, r2 = RE + 400e3, RE + alt_km * 1e3
        d1, d2 = insertion.hohmann(r1, r2)
        need = v_circ(r1) + d1 + d2 + LOSS_MS - p["v_rot"]
    return dv, need, dv - need, p


def _placeholder(vehicle, site, target, payload_kg, seed=0):
    alt, inc = target["alt_km"], target["inc_deg"]
    dv, need, margin, p = _needed(vehicle, payload_kg, alt, inc, site["lat_deg"])
    reaches = p["feasible"] and margin >= 0
    # chuoi thoi gian gia lap: moi tang chay het nhien lieu, khoi luong giam tuyen tinh
    t, events, series = 0.0, [{"t": 0.0, "name": "LIFTOFF"}], {k: [] for k in ("t", "alt_km", "v_inertial_ms", "mass_kg", "thrust_n", "stage_idx")}
    stages, above = vehicle["stages"], payload_kg
    tail = [s["propellant_kg"] + s["dry_kg"] for s in stages]
    v_final = p["v_circ"] if reaches else max(dv - LOSS_MS, 0.0)
    dv_done, burn_end = 0.0, []
    dts = 5.0
    for i, s in enumerate(stages):
        m_start = above + sum(tail[i:])
        mdot = s["thrust_n"] / (s["isp_s"] * G0)
        tb = s["propellant_kg"] / mdot
        k = 0.0
        while k < tb:
            m = m_start - mdot * k
            dv_now = dv_done + s["isp_s"] * G0 * math.log(m_start / m)
            frac = min(dv_now / dv, 1.0)
            series["t"].append(t + k); series["mass_kg"].append(m); series["thrust_n"].append(s["thrust_n"])
            series["stage_idx"].append(i); series["v_inertial_ms"].append(v_final * frac)
            series["alt_km"].append(alt * frac ** 3)
            k += dts
        dv_done += tsiolkovsky(s["isp_s"], m_start, m_start - s["propellant_kg"])
        t += tb
        burn_end.append(t)
        if i == 0:
            events.append({"t": 0.25 * tb, "name": "MAXQ"})
        events.append({"t": t, "name": "MECO" if i == 0 and len(stages) > 1 else ("SECO2" if i == len(stages) - 1 else "STAGE_SEP")})
    events.sort(key=lambda e: e["t"])
    return {"physics": "placeholder-analytic", "reaches_orbit": bool(reaches), "reason": p["reason"],
            "dv_ideal_ms": dv, "dv_needed_ms": need, "margin_ms": margin, "v_rot_ms": p["v_rot"],
            "events": events, "series": series, "t_end": t, "t_sep": t + SEP_DELAY_S, "dt_s": dts}


BACKEND = _placeholder


def register_backend(fn):
    """Thay backend: fn(vehicle, site, target, payload_kg, seed) -> dict cung khung voi _placeholder."""
    global BACKEND
    BACKEND = fn


def fly_ascent(vehicle, site, target, payload_kg, seed=0):
    return BACKEND(vehicle, site, target, payload_kg, seed)
