"""Vai tro cong tac (de bai: toi da 4 nguoi, 5 vai; mot nguoi co the giu nhieu vai). Quyen = slot duoc sua."""
DEFAULT_ROLES = {
    "planner":   {"slots": ["orbit", "launch"], "title": {"vi": "Điều phối nhiệm vụ", "en": "Mission Planner"}},
    "engineer":  {"slots": ["bus", "power", "battery", "obc", "adcs"], "title": {"vi": "Kỹ sư tàu", "en": "Spacecraft Engineer"}},
    "science":   {"slots": ["instruments"], "title": {"vi": "Trưởng khoa học", "en": "Science Lead"}},
    "comms":     {"slots": ["comm"], "title": {"vi": "Liên lạc và dữ liệu", "en": "Comms/Data Officer"}},
    "resources": {"slots": [], "arbiter": True, "title": {"vi": "Quản lý nguồn lực", "en": "Resource Manager"}},
}


def table_of(mission):
    return (mission.roles or {}).get("table") or DEFAULT_ROLES


def allowed_slots(roles, table):
    return {s for r in roles for s in table.get(r, {}).get("slots", [])}


def owners(slot, members, table):
    return [m["id"] for m in members.values() if slot in allowed_slots(m["roles"], table)]


def arbiters(members, table):
    return [m["id"] for m in members.values() if any(table.get(r, {}).get("arbiter") for r in m["roles"])]
