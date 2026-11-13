"""May trang thai mot luot choi: BOOT > BRIEF > DESIGN > REVIEW > COUNTDOWN > ASCENT > SEPARATION > OPS > DEBRIEF."""
from ..errors import Conflict

TRANSITIONS = {
    "BOOT": {"BRIEF"}, "BRIEF": {"DESIGN"}, "DESIGN": {"REVIEW", "BRIEF"}, "REVIEW": {"COUNTDOWN", "DESIGN"},
    "COUNTDOWN": {"ASCENT"}, "ASCENT": {"SEPARATION"}, "SEPARATION": {"OPS"}, "OPS": {"DEBRIEF"},
    "DEBRIEF": {"DESIGN", "BRIEF"},
}


class Fsm:
    def __init__(self, state="BOOT"):
        self.state = state

    def go(self, new):
        if new not in TRANSITIONS.get(self.state, set()):
            raise Conflict(f"khong chuyen duoc {self.state} -> {new}", frm=self.state, to=new)
        self.state = new
        return new
