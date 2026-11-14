"""Adapter bo nho (mac dinh). Du cho demo/hackathon; mat du lieu khi tat server."""
import copy
import time
import uuid
from .ports import Repos, order_key, eligible


class _Sessions:
    def __init__(self): self.d = {}
    def save(self, log):
        i = uuid.uuid4().hex[:12]; self.d[i] = copy.deepcopy(log); return i
    def get(self, id_): return copy.deepcopy(self.d.get(id_))


class _Scores:
    def __init__(self): self.rows = []
    def add(self, rec):
        self.rows.append(copy.deepcopy(rec)); return rec["id"]
    def top(self, mission_id, n=10, board="score"):
        rows = [r for r in self.rows if r["mission_id"] == mission_id and eligible(board, r)]
        return copy.deepcopy(sorted(rows, key=order_key(board))[:n])
    def by_player(self, player_id):
        return copy.deepcopy(sorted((r for r in self.rows if r["player_id"] == player_id), key=lambda r: -r["created_at"]))


class _Rooms:
    def __init__(self): self.d = {}
    def save(self, room): self.d[room["id"]] = copy.deepcopy(room)
    def get(self, id_): return copy.deepcopy(self.d.get(id_))
    def list_open(self, mission_id=None):
        return [copy.deepcopy(r) for r in self.d.values() if r["status"] in ("open", "designed") and (mission_id is None or r["mission_id"] == mission_id)]


class _Players:
    def __init__(self): self.d = {}
    def get_or_create(self, player_id, name):
        return copy.deepcopy(self.d.setdefault(player_id, {"id": player_id, "name": name, "xp": 0, "created_at": time.time()}))
    def add_xp(self, player_id, xp):
        p = self.d.setdefault(player_id, {"id": player_id, "name": player_id, "xp": 0, "created_at": time.time()})
        p["xp"] += int(xp); return copy.deepcopy(p)


def MemoryRepos():
    return Repos(_Sessions(), _Scores(), _Rooms(), _Players())
