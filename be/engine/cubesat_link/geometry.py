"""ECEF/geodetic geometry. No atmospheric correction or effective Earth radius."""
from dataclasses import dataclass
from datetime import datetime
from math import atan2, cos, degrees, hypot, radians, sin, sqrt
from .types import GroundStation, SatelliteState, WGS84


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def norm(a):
    return sqrt(dot(a, a))


def station_ecef(station, earth=WGS84):
    """Geodetic latitude/longitude in degrees; ellipsoidal antenna height in m."""
    lat, lon = radians(station.lat_deg), radians(station.lon_deg)
    e2 = earth.flattening * (2 - earth.flattening)
    n = earth.semi_major_m / sqrt(1 - e2 * sin(lat) ** 2)
    return ((n + station.altitude_m) * cos(lat) * cos(lon),
            (n + station.altitude_m) * cos(lat) * sin(lon),
            (n * (1 - e2) + station.altitude_m) * sin(lat))


def enu(delta, station):
    lat, lon = radians(station.lat_deg), radians(station.lon_deg)
    x, y, z = delta
    return (-sin(lon) * x + cos(lon) * y,
            -sin(lat) * cos(lon) * x - sin(lat) * sin(lon) * y + cos(lat) * z,
            cos(lat) * cos(lon) * x + cos(lat) * sin(lon) * y + sin(lat) * z)


@dataclass(frozen=True)
class Geometry:
    slant_range_m: float
    azimuth_deg: float | None  # undefined at zenith/nadir
    elevation_deg: float
    earth_occulted: bool
    above_mask: bool
    geometric_visible: bool
    earth_model: str


def geometry(station: GroundStation, state: SatelliteState, earth=WGS84):
    p = station_ecef(station, earth)
    d = sub(state.position_m, p)
    distance = norm(d)
    if distance <= 1e-6:
        raise ValueError("Satellite and station coincide")
    east, north, up = enu(d, station)
    horizontal = hypot(east, north)
    elevation = degrees(atan2(up, horizontal))
    axes = (earth.semi_major_m, earth.semi_major_m, earth.semi_minor_m)
    q = tuple(x / a for x, a in zip(p, axes))
    v = tuple(x / a for x, a in zip(d, axes))
    t = max(0.0, min(1.0, -dot(q, v) / dot(v, v)))
    closest = tuple(x + t * y for x, y in zip(q, v))
    # Tangency is clear; 1e-12 in squared normalized radius ~3 micrometres.
    occulted = dot(closest, closest) < 1.0 - 1e-12
    above = elevation >= station.min_elevation_deg - 1e-10
    return Geometry(distance, None if horizontal < distance * 1e-12 else
                    degrees(atan2(east, north)) % 360, elevation, occulted, above,
                    above and not occulted,
                    f"a={earth.semi_major_m} m; flattening={earth.flattening}")


@dataclass(frozen=True)
class ContactWindow:
    start_utc: datetime
    end_utc: datetime
    start_clipped: bool
    end_clipped: bool
    method: str = "geometric mask; piecewise-linear ECEF; no extrapolation"


def _roots(a, b, c):
    scale = max(abs(a), abs(b), abs(c), 1e-300)
    a, b, c = a / scale, b / scale, c / scale
    if abs(a) < 1e-15:
        return [] if abs(b) < 1e-15 else [-c / b]
    disc = b * b - 4 * a * c
    if disc < 0:
        return []
    q = -0.5 * (b + (sqrt(disc) if b >= 0 else -sqrt(disc)))
    return [-b / (2 * a)] if q == 0 else [q / a, c / q]


def contact_windows(station, states, earth=WGS84, *, max_gap_s=60.0, mode="geometric"):
    """Exact cone intersections for LINEAR ECEF interpolation, not orbit propagation.

    Nonnegative constant mask implies no Earth intersection for altitude>=0.
    Captures passes with both interval endpoints outside the cone. Isolated
    zero-duration tangent contacts are omitted. Gaps above max_gap_s reject.
    """
    from .types import finite
    if mode != "geometric":
        raise ValueError("Only geometric contact windows are implemented; refracted windows unavailable")
    finite(max_gap_s)
    if max_gap_s <= 0:
        raise ValueError("max_gap_s must be positive")
    states = list(states)
    if len(states) < 2:
        raise ValueError("At least two timestamped ECEF states are required")
    if any(s.epoch_utc is None for s in states):
        raise ValueError("Contact windows require UTC epochs")
    for a, b in zip(states, states[1:]):
        dt = (b.epoch_utc - a.epoch_utc).total_seconds()
        if not 0 < dt <= max_gap_s:
            raise ValueError("Epochs must increase strictly with gaps <= max_gap_s")
    p = station_ecef(station, earth)
    k = sin(radians(station.min_elevation_deg)) ** 2
    spans = []
    for a, b in zip(states, states[1:]):
        d = sub(a.position_m, p)
        v = sub(b.position_m, a.position_m)
        # A chord through the receiver has an undefined direction: reject it.
        if dot(v, v):
            tnear = max(0.0, min(1.0, -dot(d, v) / dot(v, v)))
            if norm(tuple(x + tnear * y for x, y in zip(d, v))) <= 1e-6:
                raise ValueError("Interpolated trajectory passes through station")
        u, w = enu(d, station)[2], enu(v, station)[2]
        cuts = [0.0, 1.0]
        cuts += [x for x in _roots(w*w-k*dot(v,v), 2*(u*w-k*dot(d,v)),
                                  u*u-k*dot(d,d)) if 0 < x < 1]
        if w and 0 < -u / w < 1:
            cuts.append(-u / w)
        cuts = sorted(set(cuts))
        for lo, hi in zip(cuts, cuts[1:]):
            t = (lo + hi) / 2
            pos = tuple(x + t*y for x, y in zip(a.position_m, v))
            if geometry(station, SatelliteState(pos, "ECEF"), earth).geometric_visible:
                dt = b.epoch_utc - a.epoch_utc
                start, end = a.epoch_utc + dt * lo, a.epoch_utc + dt * hi
                if spans and start == spans[-1][1]:
                    spans[-1] = (spans[-1][0], end)
                else:
                    spans.append((start, end))
    return [ContactWindow(a, b, a == states[0].epoch_utc, b == states[-1].epoch_utc)
            for a, b in spans if a < b]
