"""Engine facade: nap catalog + mission + ruleset + thuong MOT LAN, roi cung cap cac ham cong khai.
Dung chung cho API, CLI, viewer (Ursina) va test."""
from pathlib import Path
from . import __version__
from .catalog import Catalog
from .errors import NotFound
from .gateway.build import ingest
from .mission.pack import load_ruleset, load_missions, load_yaml
from .rules.evaluate import evaluate as _evaluate
from .rules.advisor import advise as _advise
from .flight import fly as _fly
from .session.ops import OpsSession
from .campaign import simulate_lifetime as _lifetime
from .campaign.lifetime import EVIDENCE_SETS
from .campaign.accommodation import matrix as _accommodation_matrix
from .integrations import mission_comms
from .rules import metrics
from .campaign.lifetime import _fire_targets


class Engine:
    def __init__(self, catalog, missions, ruleset, rewards=None, root=None):
        self.catalog, self.missions, self.ruleset, self.rewards, self.root = catalog, missions, ruleset, rewards or {}, root

    @classmethod
    def from_root(cls, root=".", rebuild=False):
        root = Path(root)
        cp = root / "build" / "catalog.json"
        cat = ingest(root, write=True)[0] if (rebuild or not cp.exists()) else Catalog.load(cp)
        rs = load_ruleset(root / "missions" / "ruleset.yaml")
        rw = root / "missions" / "rewards.yaml"
        return cls(cat, load_missions(root / "missions", cat, rs), rs, load_yaml(rw) if rw.exists() else {}, root)

    def mission(self, mission_id):
        try:
            return self.missions[mission_id]
        except KeyError:
            raise NotFound(f"khong co mission {mission_id}", mission=mission_id)

    def _m(self, design, mission_id):
        return self.mission(mission_id or design.get("mission"))

    def health(self):
        return {"engine_version": __version__, "catalog_hash": self.catalog.hash, "missions": len(self.missions)}

    def missions_meta(self):
        return [m.summary() for m in self.missions.values()]

    def evaluate(self, design, mission_id=None, with_hints=False):
        return _evaluate(design, self._m(design, mission_id), self.catalog, with_hints)

    def fly(self, design, mission_id=None, seed=None, allow_nofit=False):
        return _fly(
            design,
            self._m(design, mission_id),
            self.catalog,
            design.get("seed", 0) if seed is None else seed,
            allow_nofit=allow_nofit,
        )

    def lifetime(self, design, mission_id=None, seed=None):
        """Vong doi 12 moc tren quy dao: hau qua cua thiet ke (xem campaign/lifetime.py)."""
        mission = self._m(design, mission_id)
        report = _evaluate(design, mission, self.catalog, False)
        imaging = None
        # Bo anh bang chung do CHINH NHIEM VU quyet dinh (mission yaml: gameplay.params.evidence_set = wildfire | methane).
        # Nhiem vu khong khai bao (vd. tram gac bao Mat Troi: chi do tu truong) thi khong co anh bang chung nao,
        # du nguoi choi co lap may anh. Truoc day thieu khai bao bi roi ve "chay rung" nen hien sai anh.
        theme = mission.gameplay.get("params", {}).get("evidence_set")
        if theme in EVIDENCE_SETS:
            cats = EVIDENCE_SETS[theme]["categories"]       # thiet bi nao tao ra bang chung cho nhiem vu nay
            hits = [(iid, self.catalog.get("instruments", iid)) for iid in design.get("instruments", [])]
            hits = [(iid, ins) for iid, ins in hits if ins.get("science_category") in cats]
            if hits:
                iid, ins = hits[0]
                imaging = {"sensor": ins.get("kind", "imager_rgb"), "name": ins.get("name", iid), "id": iid,
                           "ids": [h[0] for h in hits],
                           "gb_per_day": ins.get("data_generated_gb_per_day"),   # de fe uoc luong dung luong moi khung
                           "theme": theme}
        # Signal physics hien chi mo phong muc tieu dia ly. Space-weather la cac khung do tai cho,
        # khong co lat/lon de dua vao bai toan footprint va tram mat dat nay.
        communications = self.communications(design, mission_id) if imaging and theme != "space_weather" else None
        return _lifetime(report, mission.life_years, design.get("seed", 0) if seed is None else seed, imaging, communications)

    def communications(self, design, mission_id=None):
        mission = self._m(design, mission_id)
        it = metrics.resolve(design, self.catalog)
        m = metrics.compute(design, it, mission, mission.ruleset)
        theme = mission.gameplay.get("params", {}).get("evidence_set", "wildfire")
        targets = [t for t in _fire_targets(theme) if "lat_deg" in t and "lon_deg" in t]
        return mission_comms.simulate(design, it, m, mission.ruleset, targets, evidence_theme=theme)

    def accommodation(self):
        """Bang ten lua x (bus, ang-ten) -> lap duoc khong + ly do (campaign/accommodation.py)."""
        return _accommodation_matrix(self.catalog.to_dict()["tables"])

    def ops_open(self, design, mission_id=None, seed=None):
        return OpsSession(design, self._m(design, mission_id), self.catalog, design.get("seed", 0) if seed is None else seed)

    def advise(self, mission_id, objective="max_score", k=5, max_evals=20000):
        return _advise(self.mission(mission_id), self.catalog, objective, k, max_evals)
