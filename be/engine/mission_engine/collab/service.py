"""Dich vu phong: nap phong tu repo -> ap thao tac -> luu -> tra trang thai kem report moi. Dung chung cho REST va WebSocket."""
import time
from ..errors import NotFound
from . import rooms, proposals, roles as R


class RoomService:
    def __init__(self, engine, repos, clock=time.time):
        self.engine, self.repos, self.clock = engine, repos, clock

    def _load(self, room_id):
        r = self.repos.rooms.get(room_id)
        if r is None:
            raise NotFound("khong co phong nay", room=room_id)
        return r, self.engine.mission(r["mission_id"])

    def _state(self, room, mission, extra=None):
        rep = self.engine.evaluate(room["design"], mission_id=mission.id)
        self.repos.rooms.save(room)
        return {"room": room, "report": rep, **(extra or {})}

    def create(self, mission_id, player_id, name, roles):
        m = self.engine.mission(mission_id)
        room = rooms.create_room(m, player_id, name, roles, now=self.clock())
        return self._state(room, m)

    def join(self, room_id, player_id, name, roles):
        room, m = self._load(room_id)
        rooms.join(room, player_id, name, roles)
        return self._state(room, m)

    def state(self, room_id):
        room, m = self._load(room_id)
        return self._state(room, m)

    def edit(self, room_id, player_id, slot, value, expected_version):
        room, m = self._load(room_id)
        ev = lambda d: self.engine.evaluate(d, mission_id=m.id)
        rooms.set_slot(room, player_id, slot, value, expected_version, ev, R.table_of(m), self.clock())
        return self._state(room, m)

    def propose(self, room_id, player_id, slot, value, rationale=""):
        room, m = self._load(room_id)
        ev = lambda d: self.engine.evaluate(d, mission_id=m.id)
        pr = proposals.propose(room, player_id, slot, value, rationale, ev, R.table_of(m), self.clock())
        return self._state(room, m, {"proposal": pr})

    def respond(self, room_id, proposal_id, player_id, accept):
        room, m = self._load(room_id)
        ev = lambda d: self.engine.evaluate(d, mission_id=m.id)
        pr, _ = proposals.respond(room, proposal_id, player_id, accept, ev, R.table_of(m), self.clock())
        return self._state(room, m, {"proposal": pr})
