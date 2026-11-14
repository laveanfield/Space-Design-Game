"""SI inputs; UTC-aware epochs; no implicit coordinate-frame conversion."""
from dataclasses import dataclass
from datetime import datetime, timedelta
from math import isfinite

C = 299792458.0


def finite(*values):
    if not all(type(v) in (int,float) and isfinite(v) for v in values):
        raise ValueError("All numeric inputs must be finite")


@dataclass(frozen=True)
class Effect:
    value: float | None
    unit: str
    status: str
    reason: str

    def __post_init__(self):
        if self.status not in ("computed", "assumed", "not_computable") or not self.reason:
            raise ValueError("Effect requires a valid status and provenance/reason")
        if self.status == "not_computable":
            if self.value is not None:
                raise ValueError("Unknown effects must have value=None")
        elif self.value is None:
            raise ValueError("Computed/assumed effects require a value")
        else:
            finite(self.value)


def known(value, unit, reason):
    return Effect(value, unit, "computed", reason)


def unknown(unit, reason):
    return Effect(None, unit, "not_computable", reason)


@dataclass(frozen=True)
class Earth:
    semi_major_m: float = 6378137.0
    flattening: float = 1 / 298.257223563

    def __post_init__(self):
        finite(self.semi_major_m, self.flattening)
        if self.semi_major_m <= 0 or not 0 <= self.flattening < 1:
            raise ValueError("Invalid reference ellipsoid")

    @property
    def semi_minor_m(self):
        return self.semi_major_m * (1 - self.flattening)


WGS84 = Earth()
SPHERE = Earth(6371000.0, 0.0)


@dataclass(frozen=True)
class GroundStation:
    lat_deg: float
    lon_deg: float
    altitude_m: float  # antenna phase centre above reference ellipsoid/sphere
    min_elevation_deg: float = 0.0  # geometric mask, inclusive

    def __post_init__(self):
        finite(self.lat_deg, self.lon_deg, self.altitude_m, self.min_elevation_deg)
        if not -90 <= self.lat_deg <= 90 or not -180 <= self.lon_deg <= 180:
            raise ValueError("Latitude/longitude outside degree ranges")
        if self.altitude_m < 0 or not 0 <= self.min_elevation_deg <= 90:
            raise ValueError("This version requires altitude>=0 and mask in [0,90]")


@dataclass(frozen=True)
class SatelliteState:
    position_m: tuple[float, float, float]
    frame: str  # mandatory, only ECEF accepted; never infer ECI or TEME
    epoch_utc: datetime | None = None

    def __post_init__(self):
        if self.frame != "ECEF":
            raise ValueError("Only ECEF supported; convert ECI/TEME externally with verified epoch/EOP")
        if len(self.position_m) != 3:
            raise ValueError("ECEF requires exactly three coordinates in metres")
        finite(*self.position_m)
        object.__setattr__(self, "position_m", tuple(self.position_m))
        if self.epoch_utc is not None and self.epoch_utc.utcoffset() != timedelta(0):
            raise ValueError("epoch_utc must be timezone-aware UTC")
