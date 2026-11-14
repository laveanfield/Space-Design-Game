"""Test luat choi moi: lap tai (ten lua <-> ve tinh), su co luc phong, bang chung dam chay tren quy dao."""
import warnings
from pathlib import Path

import pytest

warnings.simplefilter("ignore")
from fastapi.testclient import TestClient  # noqa: E402

from mission_engine.api.app import create_app  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
M1 = "MP-SC01-FIRST-EYES"


@pytest.fixture(scope="module")
def client():
    return TestClient(create_app(str(ROOT)))


def preset(client, mission, pid):
    d = client.get(f"/missions/{mission}").json()
    if pid == "starter":
        return dict(d["starter"])
    for p in d["presets"]:
        if p["id"] == pid and p.get("design"):
            return dict(p["design"])
    base = next(p for p in d["presets"] if p["id"] == "good")["design"]
    swap = next(p for p in d["presets"] if p["id"] == pid)["swap"]
    return {**base, **swap}


def test_cubesat_only_fits_small_launcher(client):
    acc = client.get("/campaign/accommodation").json()
    row = acc["BUS-3U__COM-UHF"]
    assert row["LV-ELECTRON"]["ok"]
    assert not row["LV-ARIANE64"]["ok"] and not row["LV-ARIANE64"]["class_ok"]
    geo = acc["BUS-GEO__COM-KA-GEO"]
    assert not geo["LV-ELECTRON"]["ok"]                     # ve tinh GEO khong lot fairing 1.2 m
    assert geo["LV-ARIANE64"]["ok"]


def test_fly_refuses_payload_that_does_not_fit(client):
    d = preset(client, M1, "good")
    d["launch"] = {"vehicle": "LV-ARIANE64", "site": "SITE-KOUROU"}
    r = client.post("/fly", json={"design": d, "mission_id": M1})
    assert r.status_code == 400 and r.json()["detail"]["code"] == "PAYLOAD_DOES_NOT_FIT"


def test_fly_allows_nofit_when_requested_and_breaks_at_maxq(client):
    d = preset(client, M1, "good")
    d["launch"] = {"vehicle": "LV-ARIANE64", "site": "SITE-KOUROU"}
    r = client.post("/fly", json={"design": d, "mission_id": M1, "allow_nofit": True})
    assert r.status_code == 200
    body = r.json()
    assert not body["meta"]["fit_ok"]
    assert not body["meta"]["reaches_orbit"]
    assert body["failure"] and body["failure"]["kind"] == "structural_maxq" and body["failure"]["explode"]


def test_good_design_collects_wildfire_evidence(client):
    life = client.post("/campaign/lifetime", json={"design": preset(client, M1, "good"), "mission_id": M1}).json()
    assert life["imaging"] and life["evidence_need"] == 3
    assert life["outcome"]["success"] and life["outcome"]["evidence_usable"] >= 3


def test_ghg_mission_photographs_methane_not_wildfire(client):
    # nhiem vu khi nha kinh phai chup chum khi methane, khong duoc lay bo muc tieu chay rung
    m4 = "MP-SC04-GHG"
    life = client.post("/campaign/lifetime", json={"design": preset(client, m4, "good"), "mission_id": m4}).json()
    assert life["imaging"]["theme"] == "methane"
    assert life["evidence"], "ve tinh tot phai chup duoc it nhat mot anh"
    assert all(s["theme"] == "methane" and s["target_id"].startswith("CH4-") for s in life["evidence"])


@pytest.mark.parametrize("pid,cause", [("fail_data", "data"), ("fail_pointing", "pointing"), ("fail_power", "power")])
def test_bad_designs_fail_for_the_right_reason(client, pid, cause):
    life = client.post("/campaign/lifetime", json={"design": preset(client, M1, pid), "mission_id": M1}).json()
    assert not life["outcome"]["success"]
    assert life["dossier"]["id"] == cause


def test_overweight_satellite_explodes_at_maxq(client):
    d = preset(client, M1, "good")
    d["instruments"] = ["INS-01", "INS-04", "INS-02"]        # qua nang so voi khung 3U
    fl = client.post("/fly", json={"design": d, "mission_id": M1}).json()
    assert fl["failure"] and fl["failure"]["kind"] in ("structural_maxq", "dv_shortfall")
