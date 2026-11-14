"""OpsSession: vong kin sau khi tach ve tinh. Tu the (K-ATT), dien (K-PWR), lien lac (K-LNK + hinh hoc), du lieu,
buc xa, mode gameplay. Tat dinh: cung (design, seed, actions) cho cung ket qua."""
import math
from pathlib import Path
import numpy as np
from ..kernels import orbit as korbit, geometry, attitude, power, link, radiation, decay
from ..rules import metrics
from ..rules.evaluate import _evaluate
from ..rules.scoring import score as score_fn
from ..rules.faults import availability
from ..mission.pack import load_yaml
from ..modes.resolver import resolve_mode
from ..modes import registry
from .hashing import result_hash

GS_GAIN_DBI = 35.0
PULSE_S = {"coarse": 1.0, "med": 0.3, "fine": 0.05}
RESET_S, SUB_DT = 6.0, 5.0
Z_BODY = np.array([0.0, 0.0, 1.0])               # truc an-ten (boresight) tren than ve tinh


class OpsSession:
    def __init__(self, design, mission, catalog, seed=0, resolver_rules=None, horizon_s=2 * 86400.0):
        self.design, self.mission, self.catalog, self.seed = design, mission, catalog, seed
        rs = self.rs = mission.ruleset
        self.rep, self.results, self.cons, self.m, self.flt = _evaluate(design, mission, catalog)
        self.it = it = metrics.resolve(design, catalog)
        orb = it["orbit"]
        self.a, self.inc, self.alt0 = korbit.RE + orb["altitude_km"] * 1e3, orb["inclination_deg"], orb["altitude_km"]
        self.sat_fn = lambda t: geometry.sat_eci(t, self.a, self.inc)
        size, mass = it["bus"].get("size_m", 0.3), self.m["mass.dry_kg"]
        self.I = np.full(3, max(mass * size ** 2 / 6.0, 1e-4))
        self.torque = it["adcs"].get("torque_nm", 1e-3)
        self.t, self.q, self.w, self.auto = 0.0, np.array([1.0, 0, 0, 0]), np.zeros(3), None
        self.acc, self.log = 0.0, []
        self.soc, self.cap_wh = 0.8, it["battery"]["capacity_wh"]
        self.buffer_gb, self.cap_gb, self.downlinked_gb = 0.0, float(rs.get("buffer_capacity_gb", 8.0)), 0.0
        self.faults = {f["id"]: f for f in self.flt}
        self.dose, self.reset_until, self.events = 0.0, -1.0, []
        self.stations, self.targets = catalog.rows("ground_stations"), catalog.rows("targets")
        self.station = self.stations[0]
        rules = resolver_rules if resolver_rules is not None else self._rules()
        self.mode_id, self.overlays, self.warnings = resolve_mode(rules, mission, it, self.m)
        self.mode = registry.create(self.mode_id)
        self.alt_km, self.fuel = self.alt0, 6
        rate = rs["seu_rate_per_day"].get(mission.hazards.get("profile", "standard"), 0.0)
        sev = max((self.faults[k]["severity"] for k in ("seu", "reset") if k in self.faults), default=None)
        self.seu = radiation.seu_times(seed, rate * (1 + 3 * sev), horizon_s) if sev is not None else []
        self.mstate = self.mode.arm({"params": mission.gameplay.get("params", {}), "targets": self.targets, "stations": self.stations,
                                     "sat_fn": self.sat_fn, "horizon_s": horizon_s, "science_pts": self.m["science.pts"],
                                     "generated_gb_per_day": self.m["data.generated_gb_per_day"]})
        self._last = {"link": {"state": "NO_PASS"}, "gen_w": 0.0, "eclipse": False, "err": 0.0}

    def _rules(self):
        p = Path(self.mission.source or ".").parent / "mode_resolver.yaml"
        return load_yaml(p) if p.exists() else {"default": "imaging", "rules": [], "overlays": []}

    # ----- dieu khien -----
    def step(self, dt, actions=()):
        """Tien thoi gian theo LUOI CO DINH SUB_DT (bo tich luy): moi cach chia dt cho cung ket qua -> replay xac minh duoc.
        Hanh dong ap dung tai thoi diem tich phan hien tai (boi so cua SUB_DT) va duoc ghi vao self.log."""
        ev = []
        for a in actions:
            self.log.append({"t": self.t, "action": a})
            ev += self._act(a)
        self.acc += dt
        while self.acc >= SUB_DT - 1e-9:
            ev += self._advance(SUB_DT)
            self.acc -= SUB_DT
        return self.snapshot(ev)

    def _act(self, a):
        k = a.get("type")
        if k == "rcs":
            self.w = attitude.rcs_pulse(self.w, int(a["axis"]), int(a["sign"]), self.torque, PULSE_S[a.get("pulse", "med")], self.I)
            self.auto = None
        elif k in ("rate_null", "nadir", "track"):
            self.auto = k
        elif k == "manual":
            self.auto = None
        elif k == "burn":
            if "orbit_keeping" in self.overlays and self.fuel > 0:
                self.alt_km, self.fuel = self.alt_km + 20.0, self.fuel - 1
                return [{"t": self.t, "name": "ORBIT_BURN", "payload": {"fuel": self.fuel}}]
        else:
            self.mstate, ev = self.mode.on_action(self.mstate, a, self._env())
            return ev
        return []

    def _env(self):
        blur = self.faults.get("blur", {}).get("severity", 0.0)
        in_reset, power_ok = self.t < self.reset_until, self.soc > 0.05 and "blackout" not in self.faults
        return {"t": self.t, "blur": blur, "power_ok": power_ok, "in_reset": in_reset,
                "capture_allowed": power_ok and not in_reset and self.buffer_gb < self.cap_gb - 1e-9,
                "downlinked_gb": self.downlinked_gb}

    def _advance(self, h):
        ev, t, rs, it = [], self.t, self.rs, self.it
        r = self.sat_fn(t)
        stn = self.station
        r_st = geometry.station_eci(stn["lat_deg"], stn["lon_deg"], t)
        el = geometry.elevation_deg(r, r_st)
        in_view = el >= stn.get("min_elevation_deg", 10.0)
        to_st = (r_st - r)
        if self.auto == "rate_null":
            self.w = self.w * math.exp(-h / 3.0)
            self.w = np.zeros(3) if np.linalg.norm(self.w) < 1e-5 else self.w
        elif self.auto in ("nadir", "track"):
            tgt = to_st if (self.auto == "track" and in_view) else -r
            self.q, self.w = attitude.axis_to(self.q, Z_BODY, tgt), np.zeros(3)
        self.q, self.w = attitude.step_rk4(self.q, self.w, self.I, np.zeros(3), h)
        # dien
        ecl = geometry.in_eclipse(r, geometry.SUN_HAT)
        gen = 0.0 if ecl else it["power"]["generation_w"] * rs["sun_factor"]
        self.soc = power.soc_step(self.soc, gen, self.m["power.load_w"], h, self.cap_wh)
        # lien lac
        axis = attitude.rotate(self.q, Z_BODY)
        ref = to_st if in_view else -r
        err = attitude.angle_deg(axis, ref)
        lk = {"station": stn["name"], "el_deg": round(el, 2), "state": "NO_PASS", "margin_db": None, "rate_mbps": 0.0}
        if in_view:
            c = it["comm"]
            mg = link.margin_db(c["tx_power_w"], c["antenna_gain_dbi"], GS_GAIN_DBI, float(np.linalg.norm(to_st)),
                                link.BAND_HZ.get(c.get("band", "S"), 2.2e9), max(c["downlink_mbps"], 1e-6) * 1e6, theta_deg=err)
            lk.update(margin_db=round(mg, 2), state=link.state(mg, rs["link"]["lock_db"], rs["link"]["marginal_db"]),
                      rate_mbps=c["downlink_mbps"])
        # du lieu
        power_ok = self.soc > 0.05 and "blackout" not in self.faults
        gen_gb = self.m["data.generated_gb_per_day"] / 86400.0 * h
        drain = lk["rate_mbps"] * rs["downlink_efficiency"] * h / 8000.0 if (lk["state"] in ("LOCK", "MARGINAL") and power_ok) else 0.0
        before = self.buffer_gb + gen_gb
        sent = min(drain, before)
        self.buffer_gb, self.downlinked_gb = min(max(before - sent, 0.0), self.cap_gb), self.downlinked_gb + sent
        # buc xa + SEU
        self.dose += it["orbit"]["radiation_dose_krad_per_year"] / (365.25 * 86400.0) * h
        for ts in self.seu:
            if t < ts <= t + h:
                self.reset_until = ts + RESET_S
                ev += [{"t": ts, "name": "SEU"}, {"t": ts, "name": "RESET"}]
        # suy giam quy dao (lop phu)
        if "orbit_keeping" in self.overlays:
            self.alt_km = max(decay.FLOOR_KM, self.alt_km - decay.decay_km_per_day(self.alt0, it["orbit"]["orbital_lifetime_years_no_reboost"])
                              * h / 86400.0 * self.rs.get("decay_demo_scale", 1.0))
        self._last = {"link": lk, "gen_w": gen, "eclipse": ecl, "err": err}
        self.t = t + h
        self.mstate, e2 = self.mode.tick(self.mstate, h, self._env())
        return ev + e2

    # ----- ket qua -----
    def snapshot(self, events=()):
        L = self._last
        return {
            "schema_version": "snapshot/1", "t": round(self.t, 3), "phase": "OPS", "warp": 1, "mode": self.mode_id,
            "mode_warnings": self.warnings, "overlays": self.overlays,
            "flight": {"alt_km": round(self.alt_km, 3), "v_inertial_ms": round(korbit.v_circ(self.a), 2), "mass_kg": self.m["mass.dry_kg"]},
            "attitude": {"q": [round(float(x), 6) for x in self.q], "omega_dps": [round(math.degrees(float(x)), 4) for x in self.w],
                         "boresight_error_deg": round(L["err"], 3), "auto": self.auto},
            "power": {"gen_w": round(L["gen_w"], 3), "load_w": round(self.m["power.load_w"], 3), "soc": round(self.soc, 4), "eclipse": L["eclipse"]},
            "link": L["link"],
            "data": {"buffer_gb": round(self.buffer_gb, 5), "capacity_gb": self.cap_gb, "downlinked_gb": round(self.downlinked_gb, 5)},
            "radiation": {"dose_krad": round(self.dose, 6), "tolerance_krad": self.m["radiation.tolerance_krad"], "seu_active": self.t < self.reset_until},
            "faults": list(self.flt), "mode_hud": self.mode.hud(self.mstate, self.t), "view_hint": self.mode.view_hint(self.mstate, self.t),
            "fuel": self.fuel, "events": list(events),
        }

    def session_log(self):
        from .replay import make_log
        return make_log(self.design, self.mission, self.catalog, self.seed, self.log, self.t)

    def finish(self):
        sc = self.mode.score(self.mstate)
        s = score_fn(self.results, self.cons, self.flt, self.m, self.mission, self.rs, science_delivered=sc["science_delivered_pts"])
        res = {"schema_version": "debrief/1", "mission": self.mission.id, "mode": self.mode_id, "t_end": round(self.t, 3),
               "score": s, "mode_detail": sc["detail"], "faults": self.flt, "explanations": self.rep["explanations"],
               "design_ok": self.rep["ok"], "cost_musd": self.m["cost.total_musd"], "budget_musd": self.mission.scenario.get("budget_musd")}
        res["result_hash"] = result_hash(res)
        return res
