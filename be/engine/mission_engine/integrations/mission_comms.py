"""Educational store-and-forward operations using the vendored RF solver.

Circular ECI orbit is explicitly rotated to ECEF. Radio sensitivity, weather,
camera footprint and packet sizes are game assumptions, not measured hardware.
"""
import math
from functools import lru_cache

from cubesat_link.api import evaluate_link
from cubesat_link.budget import Radio, LOSS_NAMES
from cubesat_link.ionosphere import Polarization
from cubesat_link.neutral import NeutralProfile
from cubesat_link.types import Effect, Earth, GroundStation, SatelliteState

from ..errors import EngineError
from ..kernels import geometry, orbit, link

EARTH = Earth(orbit.RE, 0.0)
DT = 60.0
DURATION = 7 * 86400.0


def settings(design, stations):
    raw = design.get("communications") or {}
    if not isinstance(raw, dict):
        raise EngineError("communications phải là một object")
    default_station = "GS-GOLDSTONE" if any(s["id"] == "GS-GOLDSTONE" for s in stations) else stations[0]["id"]
    cfg = {"station_id": raw.get("station_id", default_station),
           "tx_scale": raw.get("tx_scale", 1.0), "rate_scale": raw.get("rate_scale", 1.0),
           "strategy": raw.get("strategy", "balanced"), "target_id": raw.get("target_id", "all")}
    if not isinstance(cfg["station_id"], str) or cfg["station_id"] not in {s["id"] for s in stations}:
        raise EngineError("Trạm mặt đất không hợp lệ")
    for key, lo, hi in (("tx_scale", 0.25, 1.0), ("rate_scale", 0.1, 1.0)):
        val = cfg[key]
        if isinstance(val, bool) or not isinstance(val, (float, int)) or not math.isfinite(val) or not lo <= val <= hi:
            raise EngineError(f"communications.{key} phải trong [{lo}, {hi}]")
    if not isinstance(cfg["strategy"], str) or cfg["strategy"] not in ("balanced", "data_first", "save_power"):
        raise EngineError("Chế độ liên lạc không hợp lệ")
    if not isinstance(cfg["target_id"], str):
        raise EngineError("Mục tiêu quan sát không hợp lệ")
    return cfg


def ecef_position(r_eci, t):
    c, s = math.cos(orbit.WE * t), math.sin(orbit.WE * t)
    x, y, z = r_eci
    return (float(c*x + s*y), float(-s*x + c*y), float(z))


@lru_cache(maxsize=8)
def reference_profile(frequency):
    h = (0., 1000., 3000., 7000., 12000., 20000., 40000., 70000., 100000.)
    n = tuple(1 + 0.000315 * math.exp(-0.1361*x/1000) for x in h[:-1]) + (1.,)
    return NeutralProfile(h, n, "Game approximation: sampled P.834 reference atmosphere, not live weather",
                          (1e8, 12e9))


def game_link(comm, station, position_ecef, cfg, pointing_deg=0.0, trace=False):
    """Complete conditional budget; rates are configured by the GAME, never inferred by the solver."""
    frequency = link.BAND_HZ.get(comm.get("band"), 1.93e14)
    rate = max(1., comm["downlink_mbps"] * cfg["rate_scale"] * 1e6)
    radio = Radio(10*math.log10(comm["tx_power_w"] * cfg["tx_scale"] * 1000),
                  comm["antenna_gain_dbi"], 35.,
                  link.pointing_loss_db(pointing_deg, link.beamwidth_deg(comm["antenna_gain_dbi"])),
                  0., 2., 10*math.log10(link.K_B * 300 * rate) + 9.6 + 30,
                  f"Game assumed BPSK/EbN0=9.6dB, 300K, {rate:g} bit/s",
                  "Ideal station tracking plus catalog ADCS pointing error", 3.)
    # Explicit instantaneous educational assumptions. No P.618 percentiles or
    # unmeasured atmospheric effects are silently presented as computed zeros.
    losses = {name: Effect(0., "dB", "assumed", "Game clear-sky scenario; medium attenuation excluded")
              for name in LOSS_NAMES - {"free_space", "polarization"}}
    return evaluate_link(GroundStation(station["lat_deg"], station["lon_deg"], 0., station.get("min_elevation_deg", 10.)),
                         SatelliteState(position_ecef, "ECEF"), frequency, earth=EARTH,
                         radio=radio, polarization=Polarization("circular", "circular", circular_match=True),
                         neutral_profile=reference_profile(frequency) if trace and 1e8 <= frequency <= 12e9 else None,
                         supplied_losses=losses)


def simulate(design, items, metrics, ruleset, targets, *, duration_s=DURATION):
    """Seven continuous days, sampled at 60 s; FIFO packets and battery persist across passes."""
    stations = items["stations"]
    cfg = settings(design, stations)
    station = next(s for s in stations if s["id"] == cfg["station_id"])
    if cfg["target_id"] != "all":
        targets = [t for t in targets if t["id"] == cfg["target_id"]]
        if not targets:
            raise EngineError("Mục tiêu quan sát không hợp lệ")
    ins = [i for i in items["instruments"] if i.get("science_category") == "Earth observation"]
    imaging = bool(ins)
    a = orbit.RE + metrics["orbit.altitude_km"] * 1000
    inc = items["orbit"]["inclination_deg"]
    comm = items["comm"]
    cap = float(ruleset.get("buffer_capacity_gb", 8.))
    battery = items["battery"]["capacity_wh"]
    # One representative evidence packet is one day of the payload data budget.
    size = max(.02, metrics["data.generated_gb_per_day"])
    base_load = items["obc"]["power_w"] + items["adcs"]["power_w"] * ruleset["duty"]["adcs"]
    base_load += sum(i["power_operating_w"] for i in items["instruments"] if i not in ins) * ruleset["duty"]["instrument"]
    camera_load = sum(i["power_operating_w"] for i in ins)
    tx_load = comm["power_w"] * (.4 + .6 * cfg["tx_scale"])
    tx_floor = {"data_first": .06, "balanced": .25, "save_power": .55}[cfg["strategy"]]
    soc, min_soc, tx_wh, captured_wh = .8, .8, 0., 0.
    evidence, queue, samples, windows, events = [], [], [], [], []
    last_capture, target_windows = {}, {t["id"]: False for t in targets}
    lost, sent_total, contact_s, usable_s = 0., 0., 0., 0.
    blocked_power, blocked_margin, missed = 0, 0, 0
    current = None
    blur = min(1., max(0., (metrics["pointing.adcs_deg"] / max(metrics["pointing.required_deg"], 1e-6) - 1) * .35))
    for ti in range(int(math.ceil(duration_s / DT))):
        t, h = ti * DT, min(DT, duration_s - ti * DT)
        r = geometry.sat_eci(t, a, inc)
        pos = ecef_position(r, t)
        r_st = geometry.station_eci(station["lat_deg"], station["lon_deg"], t)
        elevation = geometry.elevation_deg(r, r_st)
        visible = elevation >= station.get("min_elevation_deg", 10.)
        eclipse = geometry.in_eclipse(r, geometry.SUN_HAT)
        solar_factor = .25 if "BODY" in items["power"]["id"] else ruleset["sun_factor"]
        generation = 0. if eclipse else items["power"]["generation_w"] * solar_factor
        soc = max(0., min(1., soc + (generation - base_load)*h/(3600*battery)))
        captured = False
        if not imaging and soc > .05:
            generated = metrics["data.generated_gb_per_day"] * h / 86400.
            old = sum(s["remaining_gb"] for s in queue)
            accepted = min(generated, max(0., cap-old))
            lost += generated-accepted
            if accepted:
                if queue:
                    queue[0]["remaining_gb"] += accepted
                else:
                    queue.append({"remaining_gb": accepted, "telemetry": True})
        for target in targets if imaging else ():
            target_el = geometry.elevation_deg(r, geometry.station_eci(target["lat_deg"], target["lon_deg"], t))
            access = target_el >= 45.  # illustrative broad footprint, not a sensor datasheet FOV
            entered = access and not target_windows[target["id"]]
            target_windows[target["id"]] = access
            if not entered or t - last_capture.get(target["id"], -86400.) < 86400.:
                continue
            last_capture[target["id"]] = t
            ground_lit = float(geometry.station_eci(target["lat_deg"], target["lon_deg"], t) @ geometry.SUN_HAT) / orbit.RE > math.sin(math.radians(10.))
            if soc < .2 or (not ground_lit and ins[0].get("kind", "imager_rgb") == "imager_rgb"):
                missed += 1
                continue
            if sum(s["remaining_gb"] for s in queue) + size > cap:
                lost += size
                events.append({"t_s": t, "code": "BUFFER_FULL", "text": "Bộ nhớ đầy: bỏ lỡ ảnh mới, dữ liệu cũ vẫn chờ truyền."})
                continue
            shot = {"n": len(evidence)+1, "t_s": t, "k": min(12, int(t/duration_s*12)+1),
                    "month": round((int(t/duration_s*12)+1), 1),
                    "target": target["name"], "target_id": target["id"], "lat": target["lat_deg"], "lon": target["lon_deg"],
                    "biome": target.get("biome", ""), "sensor": ins[0].get("kind", "imager_rgb"),
                    "blur": round(blur, 3), "seu": False, "seed": ti, "size_gb": size, "remaining_gb": size,
                    "delivered_k": None, "delivered_t_s": None}
            queue.append(shot)
            evidence.append(shot)
            captured = True
            energy = camera_load * h / 3600
            captured_wh += energy
            soc = max(0., soc - energy/battery)
            events.append({"t_s": t, "code": "CAPTURE", "text": f"Chụp #{shot['n']} tại {target['name']}; lưu {size:.2f} GB, chờ trạm thu."})
        margin, fspl, range_km = None, None, None
        state, transmitting = "NO_PASS", False
        if visible:
            result = game_link(comm, station, pos, cfg, items["adcs"]["pointing_accuracy_deg"])
            margin = result.budget.margin_db.value
            fspl = result.losses_db["free_space"].value
            range_km = result.geometry.slant_range_m / 1000
            contact_s += h
            state = "LOCK" if result.budget.meets_required_margin else "WEAK_SIGNAL"
            if current is None:
                current = {"start_s": t, "end_s": t+h, "peak_el_deg": elevation, "peak_margin_db": margin,
                           "sent_gb": 0., "peak_position": pos}
            if elevation > current["peak_el_deg"]:
                current.update(peak_el_deg=elevation, peak_margin_db=margin, peak_position=pos)
            current["end_s"] = t+h
            if state == "LOCK":
                usable_s += h
                if queue and not captured:
                    if soc >= tx_floor:
                        transmitting = True
                        tx_seconds = min(h, max(0., (soc-tx_floor)*battery*3600/tx_load))
                        energy = tx_load*tx_seconds/3600
                        soc = max(0., soc-energy/battery)
                        tx_wh += energy
                        capacity = comm["downlink_mbps"] * cfg["rate_scale"] * ruleset["downlink_efficiency"] * tx_seconds / 8000
                        while queue and capacity > 1e-12:
                            shot = queue[0]
                            sent = min(capacity, shot["remaining_gb"])
                            shot["remaining_gb"] -= sent
                            capacity -= sent
                            sent_total += sent
                            current["sent_gb"] += sent
                            if shot["remaining_gb"] < 1e-9:
                                shot.update(delivered_t_s=t+tx_seconds, delivered_k=min(12, int((t+tx_seconds)/duration_s*12)+1))
                                queue.pop(0)
                                if not shot.get("telemetry"):
                                    events.append({"t_s": t+tx_seconds, "code": "DOWNLINK", "text": f"Ảnh #{shot['n']} đã về {station['name']}."})
                    else:
                        state = "POWER_HOLD"
                        blocked_power += 1
            else:
                blocked_margin += 1
        if not visible and current is not None:
            windows.append(current)
            current = None
        min_soc = min(min_soc, soc)
        if ti % 5 == 0 or captured or visible or (samples and samples[-1]["state"] != state):
            samples.append({"t_s": t, "lat": math.degrees(math.asin(pos[2]/a)), "lon": math.degrees(math.atan2(pos[1], pos[0])),
                            "el_deg": round(elevation, 2), "margin_db": None if margin is None else round(margin, 2),
                            "fspl_db": None if fspl is None else round(fspl, 2), "range_km": range_km,
                            "state": "TRANSMITTING" if transmitting else "CAPTURE" if captured else state,
                            "soc": round(soc, 4), "buffer_gb": round(sum(s["remaining_gb"] for s in queue), 4),
                            "sent_gb": round(sent_total, 4), "eclipse": eclipse})
    if current is not None:
        windows.append(current)
    # Actually run atmospheric ray tracing at the highest point of every contact.
    # Detailed RF solver retains all computed vs assumed provenance in this ledger.
    for window in windows:
        position = window.pop("peak_position")
        traced = game_link(comm, station, position, cfg, items["adcs"]["pointing_accuracy_deg"], trace=True)
        window["ray"] = {"path_basis": traced.path_basis, "available": traced.path_available,
                         "neutral_ray": None if traced.neutral_ray is None else traced.to_dict()["neutral_ray"],
                         "fspl_db": traced.losses_db["free_space"].value,
                         "margin_db": traced.budget.margin_db.value}
    delivered = [s for s in evidence if s["delivered_t_s"] is not None and s["blur"] < .35]
    reasons = []
    if imaging and not evidence:
        reasons.append("TARGET_ACCESS: Không có ảnh dùng được; kiểm tra mặt phẳng quỹ đạo, vùng quan sát, ánh sáng và pin.")
    if not windows:
        reasons.append("NO_CONTACT: Quỹ đạo không đi qua trạm ở góc ngẩng tối thiểu; chọn trạm khác.")
    if blocked_margin:
        reasons.append("LINK_MARGIN: Có thấy trạm nhưng tín hiệu yếu; giảm tốc độ để tăng biên tín hiệu hoặc tăng công suất trong giới hạn radio.")
    if blocked_power:
        reasons.append("POWER_HOLD: Pin thấp nên phải bỏ cửa sổ truyền; tăng nguồn/pin hoặc giảm tải và công suất phát.")
    if queue:
        reasons.append("DATA_BACKLOG: Ảnh còn trong bộ nhớ; cần đủ thời gian liên lạc và tốc độ để gửi trọn gói.")
    if lost:
        reasons.append("BUFFER_FULL: Bộ nhớ đầy làm bỏ ảnh mới; tăng tốc độ truyền hoặc giảm lượng dữ liệu quan sát.")
    return {"schema_version": "mission-comms/1", "duration_s": duration_s, "dt_s": DT, "settings": cfg,
            "station": station, "targets": targets, "samples": samples, "windows": windows, "events": events,
            "evidence": evidence, "diagnostics": reasons,
            "summary": {"captured": len(evidence), "delivered": len(delivered), "pending": len(queue), "missed": missed,
                        "sent_gb": round(sent_total, 4), "buffer_gb": round(sum(s["remaining_gb"] for s in queue), 4),
                        "lost_gb": round(lost, 4), "contact_min": contact_s/60, "usable_min": usable_s/60,
                        "min_soc": min_soc, "tx_energy_wh": tx_wh, "capture_energy_wh": captured_wh,
                        "power_holds": blocked_power, "weak_signal_steps": blocked_margin},
            "assumptions": ["7 ngày vận hành đại diện, quỹ đạo tròn, Trái Đất cầu tự quay; lấy mẫu 60 giây, bỏ qua J2.",
                            "12 đoạn vận hành được ghép với 12 mốc lão hóa; không ngoại suy cửa sổ thành lịch liên lạc cả năm.",
                            "Mục tiêu vào vùng quan sát khi góc ngẩng ≥45°; tối đa 1 ảnh/mục tiêu/ngày; RGB cần Mặt Trời cao >10° tại mục tiêu.",
                            "Một gói ảnh đại diện bằng dữ liệu payload/ngày (tối thiểu 0,02 GB); bộ nhớ 8 GB mặc định, truyền FIFO.",
                            "35 dBi trạm thu, 300 K, Eb/N0 9,6 dB, margin ≥3 dB, cáp 2 dB, phân cực tròn khớp: giả định gameplay.",
                            "Cửa sổ/tốc độ dùng đường hình học; tia khúc xạ P.834 được tính ở đỉnh mỗi lượt (0,1–12 GHz). Suy hao thời tiết giả định 0; ngoài dải dùng hình học.",
                            "Thông lượng là tốc độ radio đã cấu hình × hiệu suất khi đủ margin, không phải thông lượng do ray tracer suy ra."]}
