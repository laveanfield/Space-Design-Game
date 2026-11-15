import math
import numpy as np
import pytest
from mission_engine.kernels import orbit, dv_budget, insertion, geometry, power, link, radiation, decay, attitude, relative, ascent


def test_orbit_circular_closure_and_energy():
    r = orbit.selftest()
    assert r["closure_m"] < 1e-2 and r["dE_rel"] < 1e-9


def test_orbit_period_matches_kepler():
    R = orbit.RE + 400e3
    r0 = np.array([R, 0, 0.0]); v0 = np.array([0, orbit.v_circ(R), 0.0])
    T = orbit.period(R)
    r, v = orbit.propagate(r0, v0, T / 2)
    assert abs(np.linalg.norm(r + r0)) < 1.0                      # sau nua chu ky: doi xung qua tam


def test_vis_viva_on_ellipse():
    r1, r2 = orbit.RE + 300e3, orbit.RE + 1800e3
    a = 0.5 * (r1 + r2)
    r0 = np.array([r1, 0, 0.0]); v0 = np.array([0, orbit.vis_viva(r1, a), 0.0])
    r, v = orbit.propagate(r0, v0, orbit.period(a) / 2, dt=2.0)
    assert abs(np.linalg.norm(r) - r2) < 5.0
    assert abs(np.linalg.norm(v) - orbit.vis_viva(r2, a)) < 1e-2


def test_tsiolkovsky_and_ledger():
    assert dv_budget.tsiolkovsky(300, 1000, 500) == pytest.approx(300 * 9.80665 * math.log(2))
    assert dv_budget.ledger(9300, 1400, 100, 50, 400) == pytest.approx(8150)


def test_insertion_formulas():
    assert insertion.sso_inclination(600) == pytest.approx(97.79, abs=0.02)
    assert insertion.rotation_bonus(28.5) == pytest.approx(409, abs=2)
    d1, d2 = insertion.hohmann(orbit.RE + 400e3, 42164e3)
    assert d1 + d2 == pytest.approx(3854, abs=15)
    assert insertion.azimuth_for(20.0, 28.5) is None               # i < lat: khong phong truc tiep duoc
    assert insertion.plan(400, 51.6, -39.26)["feasible"]


def test_geometry_passes_plausible():
    a = orbit.RE + 400e3
    fn = lambda t: geometry.sat_eci(t, a, 51.6)
    passes = geometry.find_passes(fn, 40.4, -4.2, 10.0, 0, 86400.0, dt=20.0)
    assert 2 <= len(passes) <= 10
    assert all(p[1] - p[0] <= 700 for p in passes)                 # moi luot bay qua LEO < ~12 phut


def test_eclipse_cylinder():
    assert geometry.in_eclipse(np.array([-orbit.RE - 400e3, 0, 0.0]), geometry.SUN_HAT)
    assert not geometry.in_eclipse(np.array([orbit.RE + 400e3, 0, 0.0]), geometry.SUN_HAT)


def test_power_margin_signs():
    gen = power.avg_generation_w(20, 0.35, 0.6)
    s = power.sustain_w(40, 0.3, power.eclipse_hours(5553, 0.35))
    assert power.margin_w(gen, 4.7, s) > 0
    assert power.margin_w(power.avg_generation_w(3, 0.35, 0.6), 4.7, s) < 0
    assert 0.0 <= power.soc_step(0.5, 0, 100, 3600, 40) <= 1.0


def test_link_formulas():
    assert link.fspl_db(1000e3, 2.2e9) == pytest.approx(159.3, abs=0.3)
    near = link.margin_db(2, 6, 30, 800e3, 2.2e9, 2e6)
    far = link.margin_db(2, 6, 30, 3000e3, 2.2e9, 2e6)
    assert near > far
    assert link.downlink_gb_per_day(0.0096, 40, 0.85) < 0.01       # UHF khong ha noi anh
    assert link.state(4.0) == "LOCK" and link.state(1.0) == "MARGINAL" and link.state(-1.0) == "DEGRADED"


def test_seu_deterministic():
    assert radiation.seu_times(7, 5.0, 86400) == radiation.seu_times(7, 5.0, 86400)
    assert radiation.seu_times(7, 5.0, 86400) != radiation.seu_times(8, 5.0, 86400)


def test_decay_rate_positive():
    assert decay.decay_km_per_day(400, 2.0) > decay.decay_km_per_day(500, 8.0) > 0
    assert decay.alt_after(400, 1e6, 2.0) == decay.FLOOR_KM


def test_attitude_invariants():
    I = np.array([0.02, 0.03, 0.05])
    q, w = np.array([1.0, 0, 0, 0]), np.array([0.1, -0.2, 0.15])
    L0 = np.linalg.norm(I * w); E0 = 0.5 * np.sum(I * w * w)
    for _ in range(2000):
        q, w = attitude.step_rk4(q, w, I, np.zeros(3), 0.05)       # khong mo men: giu momen dong luong va dong nang
    assert abs(np.linalg.norm(q) - 1) < 1e-9
    assert abs(np.linalg.norm(I * w) - L0) / L0 < 1e-6
    assert abs(0.5 * np.sum(I * w * w) - E0) / E0 < 1e-6


def test_rcs_pulse_and_axis_to():
    I = np.array([0.02, 0.02, 0.02])
    w = attitude.rcs_pulse(np.zeros(3), 1, +1, 0.001, 1.0, I)
    assert w[1] == pytest.approx(0.05)
    q = attitude.axis_to(np.array([1.0, 0, 0, 0]), np.array([0, 0, 1.0]), np.array([1.0, 1.0, 0.0]))
    assert attitude.angle_deg(attitude.rotate(q, np.array([0, 0, 1.0])), np.array([1.0, 1.0, 0.0])) < 1e-6


def test_cw_vs_two_body():
    """Khop tich phan hai vat (baseline ghi nhan 0,13% sau 1 vong)."""
    R = orbit.RE + 400e3
    n = math.sqrt(orbit.MU / R ** 3)
    dv = 1.0                                                        # lo xo tach 1 m/s doc quy dao
    rc, vc = np.array([R, 0, 0.0]), np.array([0, orbit.v_circ(R), 0.0])
    rd, vd = rc.copy(), vc + np.array([0, dv, 0.0])
    t = orbit.period(R) / 4
    rc2, vc2 = orbit.propagate(rc, vc, t, dt=1.0)
    rd2, _ = orbit.propagate(rd, vd, t, dt=1.0)
    xh = rc2 / np.linalg.norm(rc2); zh = np.cross(rc2, vc2); zh /= np.linalg.norm(zh); yh = np.cross(zh, xh)
    rho = rd2 - rc2
    num = np.array([rho @ xh, rho @ yh, rho @ zh])
    cw = np.array(relative.cw_state([0, 0, 0, 0, dv, 0], n, t)[:3])
    assert np.linalg.norm(num - cw) / np.linalg.norm(cw) < 0.005


def test_ascent_placeholder_reaches_orbit():
    lv = {"liftoff_mass_kg": 13000, "stages": [
        {"thrust_n": 2.2e5, "isp_s": 311, "propellant_kg": 9500, "dry_kg": 950},
        {"thrust_n": 2.6e4, "isp_s": 343, "propellant_kg": 2150, "dry_kg": 250}]}
    out = ascent.fly_ascent(lv, {"lat_deg": -39.26}, {"alt_km": 400, "inc_deg": 51.6}, 5.0)
    assert out["physics"] == "placeholder-analytic" and out["reaches_orbit"]
    assert out["insertion"]["ok"] is True
    assert out["insertion"]["perigee_km"] >= 395.0
    assert ascent.capacity_model_kg(lv, 400, 51.6, -39.26) > 100
    too_heavy = ascent.fly_ascent(lv, {"lat_deg": -39.26}, {"alt_km": 400, "inc_deg": 51.6}, 5000.0)
    assert not too_heavy["reaches_orbit"]
    assert too_heavy["insertion"]["ok"] is False
    assert too_heavy["insertion"]["perigee_km"] < 150.0
