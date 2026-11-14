"""Interface cua mode gameplay (plugin). Mode tra loi: trong Ops nguoi choi lam gi va diem khoa hoc den tu dau."""
from typing import Protocol


class MissionMode(Protocol):
    id: str

    def arm(self, ctx: dict) -> dict: ...                          # tim cua so, muc tieu -> trang thai ban dau
    def on_action(self, st: dict, action: dict, env: dict) -> tuple: ...   # (st', events) khi nguoi choi bam
    def tick(self, st: dict, dt: float, env: dict) -> tuple: ...           # (st', events) theo thoi gian
    def score(self, st: dict) -> dict: ...                         # {"science_delivered_pts": ..., "detail": ...}
    def hud(self, st: dict, t: float) -> dict: ...                 # mo hinh panel: title, lines, prompts, windows
    def view_hint(self, st: dict, t: float) -> dict: ...           # goi y camera cho viewer


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))
