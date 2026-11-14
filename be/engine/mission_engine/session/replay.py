"""Luu va phat lai phien (session.json). Engine tat dinh + luoi thoi gian co dinh -> server CHAY LAI de xac minh diem."""
from .. import __version__
from .ops import OpsSession, SUB_DT
from .hashing import result_hash


def make_log(design, mission, catalog, seed, actions, t_end):
    return {"schema_version": "session/1", "engine_version": __version__, "catalog_hash": catalog.hash,
            "mission_hash": mission.hash, "mission": mission.id, "seed": seed, "design": design,
            "actions": sorted(actions, key=lambda a: a["t"]), "t_end": t_end}


def run_session(log, mission, catalog):
    ops = OpsSession(log["design"], mission, catalog, seed=log["seed"])
    for a in sorted(log["actions"], key=lambda a: a["t"]):
        while ops.t < a["t"] - 1e-9:
            ops.step(SUB_DT)
        ops.step(0.0, [a["action"]])
    while ops.t < log["t_end"] - 1e-9:
        ops.step(SUB_DT)
    return ops.finish()


def verify(log, mission, catalog, claimed_hash):
    """Server chay lai phien va so hash. Tra ve (ok, ket_qua_that)."""
    if log.get("catalog_hash") != catalog.hash or log.get("mission_hash") != mission.hash:
        return False, {"error": "catalog hoac mission khac phien ban luc choi"}
    res = run_session(log, mission, catalog)
    return res["result_hash"] == claimed_hash, res
