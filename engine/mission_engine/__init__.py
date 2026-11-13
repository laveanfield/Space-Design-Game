"""mission_engine: engine vat ly + luat + du lieu cho Space Mission Design Game. API cong khai: 6 ham + Engine."""
__version__ = "0.1.0"

from .catalog import Catalog
from .mission.pack import load_ruleset, load_mission as _load_mission
from .rules.evaluate import evaluate, check_presets
from .rules.advisor import advise
from .flight import fly
from .session.ops import OpsSession
from .service import Engine


def load_catalog(path):
    return Catalog.load(path)


def load_mission(path, catalog, ruleset_path=None):
    from pathlib import Path
    rp = Path(ruleset_path) if ruleset_path else Path(path).with_name("ruleset.yaml")
    return _load_mission(path, catalog, load_ruleset(rp))


def ops_open(design, mission, catalog, seed=0):
    return OpsSession(design, mission, catalog, seed=seed)
