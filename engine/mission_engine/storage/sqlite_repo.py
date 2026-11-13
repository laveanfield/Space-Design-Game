"""Adapter SQLite (stdlib sqlite3). Cung giao dien voi memory.py -> thay the ma engine khong phai sua."""
import json
import sqlite3
import time
import uuid
from pathlib import Path
from .ports import Repos

_SQL = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
_COLS = ("id", "mission_id", "player_id", "team_id", "display_name", "mode", "members", "score_total", "grade", "time_s",
         "science_pts", "cost_musd", "design_ok", "session_id", "session_hash", "verified", "created_at")


class _Db:
    def __init__(self, path):
        self.c = sqlite3.connect(path, check_same_thread=False)
        self.c.row_factory = sqlite3.Row
        self.c.executescript(_SQL)


class _Sessions:
    def __init__(self, db): self.db = db
    def save(self, log):
        i = uuid.uuid4().hex[:12]
        self.db.c.execute("INSERT INTO sessions VALUES (?,?,?,?)", (i, log.get("mission", ""), json.dumps(log), time.time()))
        self.db.c.commit(); return i
    def get(self, id_):
        r = self.db.c.execute("SELECT log_json FROM sessions WHERE id=?", (id_,)).fetchone()
        return json.loads(r["log_json"]) if r else None


class _Scores:
    ORDER = {"score": "score_total DESC, time_s ASC", "speed": "time_s ASC, score_total DESC", "frugal": "cost_musd ASC, score_total DESC"}
    WHERE = {"score": "", "speed": "AND design_ok=1 AND mode='coop'", "frugal": "AND design_ok=1"}

    def __init__(self, db): self.db = db

    def add(self, rec):
        vals = [rec[c] for c in _COLS]
        self.db.c.execute(f"INSERT INTO scores ({','.join(_COLS)},achievements_json) VALUES ({','.join('?' * (len(_COLS) + 1))})",
                          (*vals, json.dumps(rec["achievements"])))
        self.db.c.commit(); return rec["id"]

    def _rows(self, cur):
        out = []
        for r in cur.fetchall():
            d = dict(r); d["achievements"] = json.loads(d.pop("achievements_json")); out.append(d)
        return out

    def top(self, mission_id, n=10, board="score"):
        q = f"SELECT * FROM scores WHERE mission_id=? AND verified=1 {self.WHERE[board]} ORDER BY {self.ORDER[board]} LIMIT ?"
        return self._rows(self.db.c.execute(q, (mission_id, n)))

    def by_player(self, player_id):
        return self._rows(self.db.c.execute("SELECT * FROM scores WHERE player_id=? ORDER BY created_at DESC", (player_id,)))


class _Rooms:
    def __init__(self, db): self.db = db
    def save(self, room):
        self.db.c.execute("INSERT OR REPLACE INTO rooms VALUES (?,?,?,?,?)", (room["id"], room["mission_id"], room["status"], json.dumps(room), time.time()))
        self.db.c.commit()
    def get(self, id_):
        r = self.db.c.execute("SELECT state_json FROM rooms WHERE id=?", (id_,)).fetchone()
        return json.loads(r["state_json"]) if r else None
    def list_open(self, mission_id=None):
        q, a = "SELECT state_json FROM rooms WHERE status IN ('open','designed')", ()
        if mission_id:
            q, a = q + " AND mission_id=?", (mission_id,)
        return [json.loads(r["state_json"]) for r in self.db.c.execute(q, a)]


class _Players:
    def __init__(self, db): self.db = db
    def get_or_create(self, player_id, name):
        self.db.c.execute("INSERT OR IGNORE INTO players VALUES (?,?,0,?)", (player_id, name, time.time())); self.db.c.commit()
        return dict(self.db.c.execute("SELECT * FROM players WHERE id=?", (player_id,)).fetchone())
    def add_xp(self, player_id, xp):
        self.get_or_create(player_id, player_id)
        self.db.c.execute("UPDATE players SET xp = xp + ? WHERE id=?", (int(xp), player_id)); self.db.c.commit()
        return dict(self.db.c.execute("SELECT * FROM players WHERE id=?", (player_id,)).fetchone())


def SqliteRepos(path=":memory:"):
    db = _Db(path)
    return Repos(_Sessions(db), _Scores(db), _Rooms(db), _Players(db))
