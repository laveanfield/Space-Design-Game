"""Event bus: engine phat su kien, audio/figure/HUD dang ky nghe, khong ai goi truc tiep ai."""
from dataclasses import dataclass, field


@dataclass
class Event:
    t: float
    name: str
    payload: dict = field(default_factory=dict)

    def to_dict(self):
        return {"t": self.t, "name": self.name, **({"payload": self.payload} if self.payload else {})}


class EventBus:
    def __init__(self):
        self._subs, self.log = {}, []

    def on(self, name, fn):
        self._subs.setdefault(name, []).append(fn)

    def emit(self, t, name, **payload):
        ev = Event(t, name, payload)
        self.log.append(ev)
        for fn in self._subs.get(name, []) + self._subs.get("*", []):
            fn(ev)
        return ev
