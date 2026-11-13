"""L2 MISSION PACK: doc YAML, ke thua scenario tu catalog, kiem tra, bung preset (from + swap)."""
import copy
import hashlib
import re
from pathlib import Path
import yaml
from ..catalog import canonical
from ..errors import PackInvalid, CatalogIdMissing

SLOTS = ("orbit", "instruments", "bus", "power", "battery", "comm", "obc", "adcs", "launch")
_EXPECT = re.compile(r"^(pass|fail:[a-z_]+|fault:[a-z_]+)$")


def load_yaml(p):
    return yaml.safe_load(Path(p).read_text(encoding="utf-8")) or {}


def load_ruleset(path):
    rs = load_yaml(path)
    if not str(rs.get("schema", "")).startswith("ruleset/"):
        raise PackInvalid("ruleset thieu schema: ruleset/1", file=str(path))
    return rs


class Mission:
    def __init__(self, raw, scenario, ruleset, source=None):
        self.raw, self.scenario, self.ruleset, self.source = raw, scenario, ruleset, source
        self.id = raw["id"]
        self.meta = raw.get("meta", {})
        self.gameplay = {"mode": "auto", "overlays": [], "params": {}, **raw.get("gameplay", {})}
        self.hazards = {"profile": "standard", "seed": 0, "force": [], **raw.get("hazards", {})}
        self.design_space = raw.get("design_space", {})
        self.roles = raw.get("roles", {"enabled": False})
        self.narrative = raw.get("narrative", {})
        self.presets = _expand_presets(raw.get("presets", []), self.id, self.hazards["seed"])

    @property
    def starter(self):
        """Thiet ke xuat phat cho phong dong doi: preset `starter` neu co, khong thi preset loi dau tien (nguoi choi phai sua)."""
        by = {p["id"]: p for p in self.presets}
        sid = self.raw.get("starter")
        pick = by.get(sid) or next((p for p in self.presets if p["expect"] != "pass"), None) or (self.presets[0] if self.presets else None)
        return copy.deepcopy(pick["design"]) if pick else {}

    @property
    def life_years(self):
        return self.scenario.get("min_mission_life_years", 0)

    @property
    def weights(self):
        return {**self.ruleset["scoring"], **self.raw.get("scoring", {})}

    @property
    def hash(self):
        return hashlib.sha256(canonical({"p": self.raw, "s": self.scenario, "r": self.ruleset}).encode()).hexdigest()[:8]

    def constraint_overrides(self):
        return {c["id"]: c for c in self.raw.get("constraints", []) if "id" in c}

    def summary(self):
        return {"id": self.id, "title": self.meta.get("title", {}), "brief": self.meta.get("brief", {}),
                "difficulty": self.meta.get("difficulty", 1), "learning_goals": self.meta.get("learning_goals", []),
                "scenario": self.scenario.get("id"), "mode": self.gameplay["mode"],
                "presets": [{"id": p["id"], "expect": p["expect"]} for p in self.presets],
                "roles_enabled": bool(self.roles.get("enabled"))}


def _expand_presets(presets, mission_id, seed):
    done, out = {}, []
    for p in presets:
        if "from" in p:
            if p["from"] not in done:
                raise PackInvalid(f"preset '{p['id']}' dung from='{p['from']}' chua dinh nghia", mission=mission_id)
            d = copy.deepcopy(done[p["from"]]["design"])
            for k, v in (p.get("swap") or {}).items():
                d[k] = {**d.get(k, {}), **v} if (k == "launch" and isinstance(v, dict)) else copy.deepcopy(v)
        else:
            d = copy.deepcopy(p.get("design", {}))
        d["mission"] = mission_id
        d.setdefault("seed", seed)
        exp = p.get("expect", "pass")
        if not _EXPECT.match(exp):
            raise PackInvalid(f"preset '{p['id']}': expect khong hop le '{exp}'", mission=mission_id)
        item = {"id": p["id"], "design": d, "expect": exp}
        done[p["id"]] = item
        out.append(item)
    return out


def load_mission(path, catalog, ruleset):
    raw = load_yaml(path)
    if raw.get("schema") != "mission-pack/1":
        raise PackInvalid("mission pack can schema: mission-pack/1", file=str(path))
    if not raw.get("id"):
        raise PackInvalid("mission pack thieu id", file=str(path))
    scenario = {}
    ext = raw.get("extends")
    if ext:
        try:
            scenario = dict(catalog.get(ext["table"], ext["id"]))
        except CatalogIdMissing:
            raise PackInvalid(f"{raw['id']}: extends toi {ext} khong co trong catalog", file=str(path))
    scenario.update(raw.get("scenario_overrides", {}))
    w = raw.get("scoring")
    if w and abs(sum(w.values()) - 1.0) > 1e-6:
        raise PackInvalid(f"{raw['id']}: trong so scoring phai co tong = 1", got=sum(w.values()))
    for c in raw.get("constraints", []):
        if "id" not in c:
            raise PackInvalid(f"{raw['id']}: constraint thieu id")
    return Mission(raw, scenario, ruleset, str(path))


def load_missions(dir_, catalog, ruleset):
    out = {}
    for f in sorted(Path(dir_).glob("*.mission.yaml")):
        if f.name.startswith("_"):
            continue
        m = load_mission(f, catalog, ruleset)
        out[m.id] = m
    return out
