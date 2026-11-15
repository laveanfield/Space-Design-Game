"""Ban ghi diem. Chi ban ghi da XAC MINH (server chay lai phien) moi duoc vao bang xep hang."""
import time
import uuid

BOARDS = {"score": "Highest Score", "speed": "Fastest Design Completion (Co-op)", "frugal": "Lowest Cost"}


def make_record(player_id, display_name, mission_id, debrief, achievements, session_id, session_hash, r, room=None, now=None):
    return {
        "id": uuid.uuid4().hex[:12], "mission_id": mission_id, "player_id": player_id, "team_id": room["id"] if room else None,
        "display_name": display_name, "mode": "coop" if room else "solo", "members": r["members"],
        "score_total": debrief["score"]["total"], "grade": debrief["score"]["grade"],
        "time_s": r["design_time_s"] if room and r["design_time_s"] < 1e11 else debrief["t_end"],
        "science_pts": debrief["score"]["science_delivered_pts"], "cost_musd": debrief["cost_musd"],
        "design_ok": 1 if debrief["design_ok"] else 0, "achievements": [a["id"] for a in achievements],
        "session_id": session_id, "session_hash": session_hash, "verified": 1, "created_at": time.time() if now is None else now,
    }
