"""Cong luu tru. Engine KHONG biet DB; chi biet cac giao dien nay. Doi DB = doi adapter, khong sua engine."""
from dataclasses import dataclass
from typing import Protocol


class SessionRepo(Protocol):
    def save(self, log: dict) -> str: ...
    def get(self, id_: str) -> dict | None: ...


class ScoreRepo(Protocol):
    def add(self, rec: dict) -> str: ...
    def top(self, mission_id: str, n: int = 10, board: str = "score") -> list: ...
    def by_player(self, player_id: str) -> list: ...


class RoomRepo(Protocol):
    def save(self, room: dict) -> None: ...
    def get(self, id_: str) -> dict | None: ...
    def list_open(self, mission_id: str | None = None) -> list: ...


class PlayerRepo(Protocol):
    def get_or_create(self, player_id: str, name: str) -> dict: ...
    def add_xp(self, player_id: str, xp: int) -> dict: ...


@dataclass
class Repos:
    sessions: SessionRepo
    scores: ScoreRepo
    rooms: RoomRepo
    players: PlayerRepo


def order_key(board):
    """Quy tac xep hang CHUNG cho moi adapter (bo nho va SQL phai cho cung thu tu)."""
    return {"score": lambda r: (-r["score_total"], r["time_s"]),
            "speed": lambda r: (r["time_s"], -r["score_total"]),
            "frugal": lambda r: (r["cost_musd"], -r["score_total"])}[board]


def eligible(board, r):
    return r["verified"] == 1 and (board == "score" or (r["design_ok"] == 1 and (board != "speed" or r["mode"] == "coop")))
