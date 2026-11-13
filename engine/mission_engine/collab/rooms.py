"""Phong lam chung: nhieu nguoi cung sua MOT thiet ke, moi nguoi chi sua slot cua vai minh. Logic thuan, khong mang, khong DB."""
import copy
import time
import uuid
from ..errors import PermissionDenied, Conflict, NotFound, PackInvalid
from . import roles as R

MAX_PLAYERS = 4


def create_room(mission, owner_id, owner_name, roles, now=None, room_id=None):
    now = time.time() if now is None else now
    room = {"id": room_id or uuid.uuid4().hex[:8], "mission_id": mission.id, "seed": mission.hazards.get("seed", 0),
            "design": mission.starter, "version": 0, "members": {}, "proposals": {}, "log": [], "status": "open",
            "created_at": now, "designed_at": None}
    join(room, owner_id, owner_name, roles)
    return room


def join(room, player_id, name, roles):
    if player_id not in room["members"] and len(room["members"]) >= MAX_PLAYERS:
        raise Conflict(f"phong da du {MAX_PLAYERS} nguoi choi", room=room["id"])
    room["members"][player_id] = {"id": player_id, "name": name, "roles": list(roles)}
    return room


def _member(room, player_id):
    m = room["members"].get(player_id)
    if not m:
        raise NotFound("nguoi choi khong o trong phong", player=player_id, room=room["id"])
    return m


def _with_slot(design, slot, value):
    d = copy.deepcopy(design)
    d[slot] = [value] if (slot == "instruments" and isinstance(value, str)) else value
    return d


def _commit(room, design, report, who, what, now):
    room["design"] = design
    room["version"] += 1
    room["log"].append({"v": room["version"], "t": now, "by": who, "what": what})
    if report["ok"] and room["designed_at"] is None:
        room["designed_at"] = now                       # moc "xong thiet ke": do thoi gian lam chung nhanh hay cham
        room["status"] = "designed"


def set_slot(room, player_id, slot, value, expected_version, evaluate_fn, table, now=None):
    """Sua slot thuoc quyen cua minh. Sai quyen -> PermissionDenied; phien ban cu -> Conflict (khoa lac quan)."""
    now = time.time() if now is None else now
    m = _member(room, player_id)
    if slot not in R.allowed_slots(m["roles"], table):
        raise PermissionDenied(f"vai {m['roles']} khong duoc sua '{slot}'", slot=slot)
    if expected_version != room["version"]:
        raise Conflict("thiet ke da thay doi, tai lai roi thu lai", have=room["version"], expected=expected_version)
    design = _with_slot(room["design"], slot, value)
    report = evaluate_fn(design)
    _commit(room, design, report, player_id, {"slot": slot, "value": value}, now)
    return report
