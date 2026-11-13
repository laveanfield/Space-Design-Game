"""Tinh MetricSet (phang, khoa kieu 'mass.dry_kg') tu thiet ke + catalog bang cac kernel. Khong luat, khong diem."""
from ..kernels import orbit as korbit, power, link, radiation, cost, ascent
from ..errors import CatalogIdMissing


def resolve(design, catalog):
    """Ten slot -> muc catalog. Thieu id thi nem CatalogIdMissing (client hien thi ro)."""
    g = catalog.get
    lv = design.get("launch", {})
    return {
        "orbit": g("orbits", design["orbit"]),
        "instruments": [g("instruments", i) for i in design["instruments"]],
        "bus": g("buses", design["bus"]), "power": g("power_arrays", design["power"]),
        "battery": g("batteries", design["battery"]), "comm": g("comms", design["comm"]),
        "obc": g("avionics", design["obc"]), "adcs": g("avionics", design["adcs"]),
        "lv": g("launch_vehicles", lv["vehicle"]), "site": g("launch_sites", lv["site"]),
    }


def all_parts(it):
    return [it["bus"], it["power"], it["battery"], it["comm"], it["obc"], it["adcs"], *it["instruments"]]


def capacity(policy, lv, orbit, site):
    """(suc tai dung de cham diem, suc tai library, tuong thich bai-LV)."""
    lib = lv["leo_capacity_kg"] * orbit["lv_payload_factor"]
    if site["id"] not in lv.get("compatible_site_ids", [site["id"]]):
        return 0.0, lib, False
    if policy == "library" or not lv.get("stages"):
        return lib, lib, True
    mod = ascent.capacity_model_kg(lv, orbit["altitude_km"], orbit["inclination_deg"], site["lat_deg"])
    return (mod if policy == "model" else min(mod, lib)), lib, True


def compute(design, it, mission, rs):
    m, orbit, ins = {}, it["orbit"], it["instruments"]
    parts = all_parts(it)
    # khoi luong
    cap, lib, compat = capacity(rs["capacity_policy"], it["lv"], orbit, it["site"])
    m["mass.dry_kg"] = sum(p["mass_kg"] for p in parts)
    m["mass.capacity_kg"], m["mass.capacity_library_kg"], m["launch.compatible"] = cap, lib, 1.0 if compat else 0.0
    m["mass.bus_limit_kg"] = it["bus"]["max_total_mass_kg"]
    m["mass.margin_kg"] = min(cap, m["mass.bus_limit_kg"]) - m["mass.dry_kg"]
    # dien
    ecl = orbit["eclipse_fraction"]
    T = korbit.period(korbit.RE + orbit["altitude_km"] * 1e3)
    duty = rs["duty"]
    load = it["obc"]["power_w"] + it["adcs"]["power_w"] * duty["adcs"] + it["comm"]["power_w"] * duty["comm"] \
        + sum(i["power_operating_w"] for i in ins) * duty["instrument"]
    eh = power.eclipse_hours(T, ecl)
    m["power.gen_avg_w"] = power.avg_generation_w(it["power"]["generation_w"], ecl, rs["sun_factor"])
    m["power.load_w"] = load
    m["power.sustain_w"] = power.sustain_w(it["battery"]["capacity_wh"], rs["battery_dod"], eh)
    m["power.eclipse_h"] = eh
    m["power.margin_w"] = power.margin_w(m["power.gen_avg_w"], load, m["power.sustain_w"])
    # du lieu
    m["data.generated_gb_per_day"] = sum(i["data_generated_gb_per_day"] for i in ins)
    m["comm.downlink_mbps"], m["orbit.contact_min"] = it["comm"]["downlink_mbps"], orbit["ground_contact_min_per_day"]
    m["data.downlink_gb_per_day"] = link.downlink_gb_per_day(m["comm.downlink_mbps"], m["orbit.contact_min"], rs["downlink_efficiency"])
    # chi huong
    m["pointing.adcs_deg"] = it["adcs"]["pointing_accuracy_deg"]
    m["pointing.required_deg"] = min(i["pointing_required_deg"] for i in ins)
    # chi phi, tien do, khoa hoc
    m["cost.total_musd"] = cost.total_musd(parts + [it["lv"]])
    m["schedule.months"] = cost.schedule_months(parts + [it["lv"]])
    m["science.pts"] = float(sum(i["science_value_pts"] for i in ins))
    m["science.required_pts"] = float(mission.scenario.get("min_science_pts", 0))
    # tuoi tho, buc xa
    m["lifetime.years"] = orbit["orbital_lifetime_years_no_reboost"]
    mf = mission.constraint_overrides().get("radiation", {}).get("margin_factor", 1.0)
    m["radiation.dose_krad"] = radiation.dose_krad(orbit["radiation_dose_krad_per_year"], mission.life_years, mf)
    m["radiation.tolerance_krad"] = it["obc"]["rad_tolerance_krad"]
    # quy dao duoc phep + tuong thich thiet bi
    allowed = orbit["id"] in mission.scenario.get("allowed_orbit_ids", [orbit["id"]])
    compat_ins = all(orbit["id"] in i.get("compatible_orbit_ids", [orbit["id"]]) for i in ins)
    m["orbit.allowed"] = 1.0 if (allowed and compat_ins) else 0.0
    return m


def nest(m):
    """{'a.b': 1} -> {'a': {'b': 1}} de bieu thuc @m.a.b tra cuu duoc."""
    out = {}
    for k, v in m.items():
        d = out
        *head, last = k.split(".")
        for h in head:
            d = d.setdefault(h, {})
        d[last] = v
    return out
