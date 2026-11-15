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


PARKING_ALT_KM = 400.0   # MEO/GTO/GEO: ascent animates insertion into the transfer orbit perigee at 400 km
VERTICAL_RISE_S = 10.0   # [estimate] vertical rise off the pad before the pitch-over (pitch kick)
PITCH_BLEND = 0.05       # fraction of the turn window used to blend smoothly out of the vertical rise


def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def flight_path_angle_deg(t, t_end, k, t_vertical=VERTICAL_RISE_S):
    """Programmed flight-path angle (deg above local horizontal) of a simplified gravity turn.

    90 deg (vertical) until the pitch kick, then a smooth monotone pitch-over that reaches 0 deg
    (purely tangential) exactly at burnout:  gamma(s) = 90 (1 - s)^k,  s = normalised turn time.
    k shapes how early the turn happens and is solved so the trajectory reaches the target altitude.
    """
    if t <= t_vertical:
        return 90.0
    s = min(1.0, (t - t_vertical) / max(1e-6, t_end - t_vertical))
    gamma = 90.0 * (1.0 - s) ** k
    return 90.0 - (90.0 - gamma) * _smooth(0.0, PITCH_BLEND, s)


def _integrate_turn(ts, vs, k):
    """Planar polar kinematics: dr/dt = v sin(gamma), dtheta/dt = v cos(gamma) / r (trapezoidal)."""
    t_end = ts[-1]
    r, theta = RE, 0.0
    gam = [flight_path_angle_deg(ts[0], t_end, k)]
    alt, down = [0.0], [0.0]
    for i in range(1, len(ts)):
        dt = ts[i] - ts[i - 1]
        g0, g1 = math.radians(gam[-1]), math.radians(flight_path_angle_deg(ts[i], t_end, k))
        r_new = r + 0.5 * (vs[i - 1] * math.sin(g0) + vs[i] * math.sin(g1)) * dt
        theta += 0.5 * (vs[i - 1] * math.cos(g0) / r + vs[i] * math.cos(g1) / r_new) * dt
        r = r_new
        alt.append((r - RE) / 1e3)
        down.append(theta * RE / 1e3)
        gam.append(math.degrees(g1))
    return alt, down, gam


def gravity_turn_profile(ts, vs, h_target_km):
    """Solve the pitch-program shape k (bisection) so the integrated trajectory ends at h_target_km
    with gamma = 0. Returns (alt_km, downrange_km, gamma_deg, k). Position is integrated from the
    velocity vector (speed x flight-path angle), so attitude, velocity and trajectory stay consistent."""
    if len(ts) < 3 or ts[-1] <= VERTICAL_RISE_S:
        alt = [h_target_km * (t / max(ts[-1], 1e-6)) for t in ts]
        return alt, [0.0] * len(ts), [90.0] * len(ts), 0.0
    lo, hi = 0.2, 40.0               # larger k -> earlier/faster turn -> lower final altitude
    for _ in range(60):
        mid = math.sqrt(lo * hi)
        if _integrate_turn(ts, vs, mid)[0][-1] > h_target_km:
            lo = mid
        else:
            hi = mid
    k = math.sqrt(lo * hi)
    alt, down, gam = _integrate_turn(ts, vs, k)
    return alt, down, gam, k


def _placeholder(vehicle, site, target, payload_kg, seed=0):
    alt, inc = target["alt_km"], target["inc_deg"]
    dv, need, margin, p = _needed(vehicle, payload_kg, alt, inc, site["lat_deg"])
    reaches = p["feasible"] and margin >= 0
    # chuoi thoi gian gia lap: moi tang chay het nhien lieu, khoi luong giam tuyen tinh
    t, events, series = 0.0, [{"t": 0.0, "name": "LIFTOFF"}], {k: [] for k in ("t", "alt_km", "v_inertial_ms", "mass_kg", "thrust_n", "stage_idx")}
    stages, above = vehicle["stages"], payload_kg
    tail = [s["propellant_kg"] + s["dry_kg"] for s in stages]
    # Insertion state: circular orbit at the target (LEO), or the perigee of a Hohmann transfer from a
    # 400 km parking altitude for MEO/GEO targets (the apogee circularisation burn is not animated).
    insert_alt = alt
    v_insert = p["v_circ"]
    if alt > 2000:
        r1 = RE + PARKING_ALT_KM * 1e3
        insert_alt = PARKING_ALT_KM
        v_insert = v_circ(r1) + insertion.hohmann(r1, RE + alt * 1e3)[0]
    v_final = v_insert if reaches else max(dv - LOSS_MS, 0.0)
    dv_done, t_cum = 0.0, 0.0
    stage_windows = []
    dts = 5.0
    for i, s in enumerate(stages):
        m_start = above + sum(tail[i:])
        mdot = s["thrust_n"] / (s["isp_s"] * G0)
        tb = s["propellant_kg"] / mdot
        stage_windows.append((i, t_cum, t_cum + tb, m_start, mdot, s["isp_s"], s["thrust_n"], dv_done))
        dv_done += tsiolkovsky(s["isp_s"], m_start, m_start - s["propellant_kg"])
        t_cum += tb
        if i == 0:
            events.append({"t": 0.25 * tb, "name": "MAXQ"})
        events.append({"t": t_cum, "name": "MECO" if i == 0 and len(stages) > 1 else ("SECO2" if i == len(stages) - 1 else "STAGE_SEP")})
    t = t_cum
    events.sort(key=lambda e: e["t"])

    n_steps = max(1, math.ceil(t / dts))
    for step in range(n_steps + 1):
        t_cur = step * dts
        t_eff = min(t_cur, t)
        win = stage_windows[-1]
        for cand in stage_windows:
            if t_eff <= cand[2] + 1e-9:
                win = cand
                break
        st_idx, t0, t1, m_start, mdot, isp_s, thrust_n, dv_base = win
        k = max(0.0, min(t1 - t0, t_eff - t0))
        m = m_start - mdot * k
        dv_now = dv_base + isp_s * G0 * math.log(m_start / m)
        frac = 1.0 if step == n_steps else min(dv_now / dv, 1.0)
        series["t"].append(t_cur)
        series["mass_kg"].append(m)
        series["thrust_n"].append(thrust_n if t_cur <= t else 0.0)
        series["stage_idx"].append(st_idx)
        series["v_inertial_ms"].append(v_final * frac)

    # Trajectory shape: simplified gravity turn integrated from (speed, flight-path angle).
    # Attitude follows the velocity vector (zero angle of attack), so pitch == flight-path angle.
    alt_s, down_s, gam_s, k_turn = gravity_turn_profile(series["t"], series["v_inertial_ms"], insert_alt)
    series["alt_km"], series["downrange_km"], series["gamma_deg"] = alt_s, down_s, gam_s
    v_end = series["v_inertial_ms"][-1] if series["v_inertial_ms"] else 0.0
    alt_end = alt_s[-1] if alt_s else 0.0
    gam_end = gam_s[-1] if gam_s else 90.0
    r_end = RE + alt_end * 1e3
    gam_rad = math.radians(gam_end)
    from .orbit import MU
    h_spec = r_end * v_end * math.cos(gam_rad)
    eps = 0.5 * v_end * v_end - MU / r_end
    if eps < 0 and v_end > 0:
        a_orb = -MU / (2.0 * eps)
        ecc = math.sqrt(max(0.0, 1.0 + 2.0 * eps * (h_spec * h_spec) / (MU * MU)))
        perigee_km = (a_orb * (1.0 - ecc) - RE) / 1e3
        apogee_km = (a_orb * (1.0 + ecc) - RE) / 1e3
    else:
        ecc = 1.0
        perigee_km = -RE / 1e3
        apogee_km = float("inf")
    min_perigee_km = min(150.0, insert_alt - 1.0)
    insertion_state = {
        "alt_km": round(alt_end, 3), "target_alt_km": insert_alt,
        "perigee_km": round(perigee_km, 2), "apogee_km": round(apogee_km, 2) if math.isfinite(apogee_km) else None,
        "eccentricity": round(ecc, 5),
        "v_ms": round(v_end, 1), "v_required_ms": round(v_insert, 1),
        "gamma_deg": round(gam_end, 4),
        "transfer_to_km": alt if alt > 2000 else None, "turn_shape_k": round(k_turn, 4),
    }
    insertion_state["ok"] = bool(reaches and abs(insertion_state["alt_km"] - insert_alt) < 1.0
                                 and perigee_km >= min_perigee_km
                                 and abs(insertion_state["gamma_deg"]) < 0.5
                                 and v_end >= v_insert * 0.999)
    return {"physics": "placeholder-analytic", "reaches_orbit": bool(reaches), "reason": p["reason"],
            "dv_ideal_ms": dv, "dv_needed_ms": need, "margin_ms": margin, "v_rot_ms": p["v_rot"],
            "events": events, "series": series, "t_end": t, "t_sep": t + SEP_DELAY_S, "dt_s": dts,
            "insertion": insertion_state}


BACKEND = _placeholder


def register_backend(fn):
    """Thay backend: fn(vehicle, site, target, payload_kg, seed) -> dict cung khung voi _placeholder."""
    global BACKEND
    BACKEND = fn


def fly_ascent(vehicle, site, target, payload_kg, seed=0):
    return BACKEND(vehicle, site, target, payload_kg, seed)
