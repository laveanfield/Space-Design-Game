"""Resource trade-offs must affect transmission, not just dashboard numbers."""
from copy import deepcopy
from pathlib import Path

from mission_engine.service import Engine
from mission_engine.rules import metrics
from mission_engine.integrations.mission_comms import simulate


def test_power_reserve_holds_radio_and_low_rate_leaves_partial_packet():
    engine = Engine.from_root(Path(__file__).resolve().parents[1])
    mission = engine.mission("MP-SC01-FIRST-EYES")
    design = deepcopy(next(p["design"] for p in mission.presets if p["id"] == "good"))
    design["communications"] = {"station_id": "TEST", "strategy": "save_power"}
    items = metrics.resolve(design, engine.catalog)
    items["stations"] = [{"id": "TEST", "name": "TEST", "lat_deg": 0., "lon_deg": 0., "min_elevation_deg": 0.}]
    m = metrics.compute(design, items, mission, mission.ruleset)
    # At t=0 the target and station are under the satellite. Take a single image,
    # then a tiny battery cannot sustain radio activity for the whole contact.
    items["battery"] = {**items["battery"], "capacity_wh": 1.}
    items["power"] = {**items["power"], "generation_w": 0.}
    target = {"id": "TEST-TARGET", "name": "TEST TARGET", "lat_deg": 0., "lon_deg": 0.}
    result = simulate(design, items, m, mission.ruleset, [target], duration_s=3600.)
    assert result["summary"]["power_holds"] > 0
    assert result["summary"]["delivered"] == 0
    assert result["summary"]["captured"] == 1
    assert 0 < result["summary"]["sent_gb"] < result["evidence"][0]["size_gb"]
    assert any(s["state"] == "POWER_HOLD" for s in result["samples"])
    assert all(s["soc"] >= 0 for s in result["samples"])
