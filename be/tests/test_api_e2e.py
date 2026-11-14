"""Kiem thu E2E qua FastAPI TestClient: Brief -> Evaluate -> Advise -> Fly -> Ops -> Debrief -> Validity."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "engine"))

from fastapi.testclient import TestClient
from mission_engine.api.app import create_app


class TestApiEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(create_app(str(ROOT)))

    def test_health_catalog_missions_validity(self):
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertIn("catalog_hash", r.json())
        self.assertEqual(r.json()["integrations"]["cubesat_link"]["release"], "0.2.0")

        c = self.client.get("/catalog")
        self.assertEqual(c.status_code, 200)
        self.assertIn("orbits", c.json()["tables"])

        ms = self.client.get("/missions")
        self.assertEqual(ms.status_code, 200)
        self.assertGreaterEqual(len(ms.json()), 3)

        v = self.client.get("/validity")
        self.assertEqual(v.status_code, 200)
        self.assertGreaterEqual(len(v.json()["kernels"]), 10)

        w = self.client.get("/")
        self.assertEqual(w.status_code, 200)
        self.assertIn("SPACE MISSION DESIGN TERMINAL", w.text)

    def test_radio_link_solver_and_strict_errors(self):
        request = {
            "schema_version": "1.0",
            "operation": "evaluate_link",
            "earth": {"model": "sphere", "radius_m": 6371000},
            "station": {"lat_deg": 0, "lon_deg": 0, "altitude_m": 0},
            "state": {
                "position_m": [6871000, 0, 0],
                "frame": "ECEF",
                "epoch_utc": "2026-11-14T00:00:00Z",
            },
            "frequency_hz": 2400000000,
            "vacuum": True,
        }
        response = self.client.post("/radio-link/solve", json=request)
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["release"], "0.2.0")
        self.assertAlmostEqual(payload["result"]["geometry"]["slant_range_m"], 500000.0)
        self.assertAlmostEqual(
            payload["result"]["losses_db"]["free_space"]["value"],
            154.03140814283586,
        )

        duplicate = self.client.post(
            "/radio-link/solve",
            content=b'{"schema_version":"1.0","schema_version":"1.0"}',
            headers={"content-type": "application/json"},
        )
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(duplicate.json()["error"]["code"], "INVALID_JSON")

        schema = self.client.get("/radio-link/schema/request")
        self.assertEqual(schema.status_code, 200)
        self.assertEqual(schema.json()["$schema"], "https://json-schema.org/draft/2020-12/schema")

        info = self.client.get("/radio-link")
        self.assertEqual(info.status_code, 200)
        self.assertIn("contact_windows", info.json()["operations"])

    def test_full_game_loop_sc01(self):
        m = self.client.get("/missions/MP-SC01-FIRST-EYES").json()
        good_design = next(p["design"] for p in m["presets"] if p["id"] == "good")
        good_design["mission"] = m["id"]

        ev = self.client.post("/evaluate", json={"design": good_design, "mission_id": m["id"]})
        self.assertEqual(ev.status_code, 200)
        self.assertTrue(ev.json()["ok"])
        self.assertTrue(ev.json()["launch_allowed"])

        fl = self.client.post("/fly", json={"design": good_design, "mission_id": m["id"]})
        self.assertEqual(fl.status_code, 200)
        self.assertEqual(fl.json()["schema_version"], "flight/1")

        op = self.client.post("/ops", json={"design": good_design, "mission_id": m["id"]})
        self.assertEqual(op.status_code, 200)
        ops_id = op.json()["ops_id"]

        st = self.client.post(f"/ops/{ops_id}/step", json={"dt": 30.0, "actions": [{"type": "nadir"}, {"type": "capture"}]})
        self.assertEqual(st.status_code, 200)
        self.assertEqual(st.json()["schema_version"], "snapshot/1")

        deb = self.client.post(f"/ops/{ops_id}/finish")
        self.assertEqual(deb.status_code, 200)
        self.assertEqual(deb.json()["schema_version"], "debrief/1")

        adv = self.client.post("/advise", json={"mission_id": m["id"], "k": 3})
        self.assertEqual(adv.status_code, 200)
        self.assertGreaterEqual(len(adv.json()), 1)


if __name__ == "__main__":
    unittest.main()
