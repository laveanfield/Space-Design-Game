"""Physical invariants for gameplay's RF adapter and store-and-forward queue."""
from copy import deepcopy
from pathlib import Path
import math

import pytest
from fastapi.testclient import TestClient

from mission_engine.service import Engine
from mission_engine.api.app import create_app
from mission_engine.integrations.mission_comms import game_link, ecef_position, EARTH
from mission_engine.kernels import orbit

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def engine():
    return Engine.from_root(ROOT)


@pytest.fixture(scope="module")
def design(engine):
    return deepcopy(next(p["design"] for p in engine.mission("MP-SC01-FIRST-EYES").presets if p["id"] == "good"))


@pytest.fixture(scope="module")
def operations(engine, design):
    return engine.communications(design, "MP-SC01-FIRST-EYES")


def test_eci_to_ecef_is_explicit_and_preserves_radius():
    pos = ecef_position((10., 0., 2.), math.pi / 2 / orbit.WE)
    assert pos == pytest.approx((0., -10., 2.))


def test_rf_earth_occultation_rate_power_and_actual_neutral_ray():
    c = {"band": "S", "tx_power_w": 2., "antenna_gain_dbi": 6., "downlink_mbps": 2.}
    st = {"lat_deg": 0., "lon_deg": 0., "min_elevation_deg": 10.}
    cfg = {"tx_scale": 1., "rate_scale": 1.}
    pos = (EARTH.semi_major_m+400000., 0., 0.)
    baseline = game_link(c, st, pos, cfg, trace=True)
    assert baseline.neutral_ray.status == "computed"
    assert baseline.path_available is True
    assert baseline.budget.margin_db.value is not None
    slower = game_link(c, st, pos, {**cfg, "rate_scale": .1})
    weaker = game_link(c, st, pos, {**cfg, "tx_scale": .25})
    assert slower.budget.margin_db.value - baseline.budget.margin_db.value == pytest.approx(10.)
    assert weaker.budget.margin_db.value - baseline.budget.margin_db.value == pytest.approx(10*math.log10(.25))
    blocked = game_link(c, st, (-pos[0], 0., 0.), cfg)
    assert blocked.path_available is False
    assert blocked.budget.margin_db.value is None
    # The RF library deliberately does not invent a bitrate from received power.
    assert baseline.budget.throughput_bps.value is None


def test_store_forward_conserves_data_and_delivers_only_in_contact(operations):
    shots, windows = operations["evidence"], operations["windows"]
    assert operations["summary"]["delivered"] >= 3
    for shot in shots:
        if shot["delivered_t_s"] is not None:
            assert shot["delivered_t_s"] > shot["t_s"]
            assert shot["remaining_gb"] == pytest.approx(0., abs=1e-9)
            assert any(w["start_s"] <= shot["delivered_t_s"] <= w["end_s"] for w in windows)
    assert sum(s["size_gb"] for s in shots) == pytest.approx(
        operations["summary"]["sent_gb"] + operations["summary"]["buffer_gb"], abs=.0002)
    assert all(0 <= s["soc"] <= 1 and 0 <= s["buffer_gb"] <= 8 for s in operations["samples"])
    assert all(s["margin_db"] >= 3 for s in operations["samples"] if s["state"] == "TRANSMITTING")
    assert all(s["state"] != "TRANSMITTING" for s in operations["samples"] if s["el_deg"] < operations["station"]["min_elevation_deg"])
    assert any(w["ray"]["neutral_ray"]["status"] == "computed" for w in windows)


def test_unreachable_station_never_delivers_or_banks_contact_credit(engine, design):
    d = deepcopy(design)
    d["communications"] = {"station_id": "GS-SVALBARD"}
    result = engine.communications(d, "MP-SC01-FIRST-EYES")
    assert result["windows"] == []  # 51.6 degree inclination cannot see 78N with this mask at 400 km
    assert result["summary"]["sent_gb"] == 0
    assert all(s["delivered_k"] is None for s in result["evidence"])
    assert result["summary"]["captured"] > 0
    assert any("NO_CONTACT" in reason for reason in result["diagnostics"])
    life = engine.lifetime(d, "MP-SC01-FIRST-EYES")
    assert not life["outcome"]["success"]
    assert life["dossier"]["id"] == "data"


def test_unreachable_target_is_not_photographed(engine, design):
    d = deepcopy(design)
    d["communications"] = {"target_id": "FIRE-SIBERIA"}
    result = engine.communications(d, "MP-SC01-FIRST-EYES")
    assert not result["evidence"]
    assert any("TARGET_ACCESS" in reason for reason in result["diagnostics"])


def test_invalid_configuration_is_client_error():
    client = TestClient(create_app(str(ROOT)))
    d = client.get("/missions/MP-SC01-FIRST-EYES").json()["presets"][0]["design"]
    d["communications"] = {"tx_scale": 100.}
    response = client.post("/campaign/communications", json={"mission_id": "MP-SC01-FIRST-EYES", "design": d})
    assert response.status_code == 400
