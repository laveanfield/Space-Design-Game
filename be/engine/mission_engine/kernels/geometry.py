"""Hinh hoc quy dao-mat dat: vi tri ve tinh (quy dao tron), tram mat dat, goc ngang, cua so bay qua, bong Trai Dat."""
import math
import numpy as np
from .orbit import MU, RE, WE

MANIFEST = {
    "id": "K-GEO",
    "equations": ["n = sqrt(mu/a^3)", "sin(el) = (r_sat - r_st).up / |r_sat - r_st|"],
    "assumptions": ["quy dao tron, Trai Dat cau, Greenwich trung truc x cua he quan tinh luc t = 0"],
    "valid_range": "LEO den MEO",
    "refs": ["Anderson, Astronautics"],
    "tests": ["passes_per_day_plausible"],
}


def sat_eci(t, a_m, inc_deg, raan_deg=0.0, u0_deg=0.0):
    n = math.sqrt(MU / a_m ** 3)
    u = math.radians(u0_deg) + n * t
    i, o = math.radians(inc_deg), math.radians(raan_deg)
    x, y = a_m * math.cos(u), a_m * math.sin(u)
    p = np.array([x, y * math.cos(i), y * math.sin(i)])                 # quay quanh x mot goc i
    return np.array([p[0] * math.cos(o) - p[1] * math.sin(o), p[0] * math.sin(o) + p[1] * math.cos(o), p[2]])


def station_eci(lat_deg, lon_deg, t):
    la, th = math.radians(lat_deg), math.radians(lon_deg) + WE * t
    return RE * np.array([math.cos(la) * math.cos(th), math.cos(la) * math.sin(th), math.sin(la)])


def elevation_deg(r_sat, r_st):
    rho = r_sat - r_st
    s = float(rho @ (r_st / np.linalg.norm(r_st))) / float(np.linalg.norm(rho))
    return math.degrees(math.asin(max(-1.0, min(1.0, s))))


def find_passes(sat_fn, lat_deg, lon_deg, min_el_deg, t0, t1, dt=20.0):
    """Cac luot bay qua: [(t_aos, t_los, el_max)] voi sat_fn(t) -> r_eci."""
    out, cur, t = [], None, t0
    while t <= t1:
        el = elevation_deg(sat_fn(t), station_eci(lat_deg, lon_deg, t))
        if el >= min_el_deg:
            cur = [t, t, el] if cur is None else [cur[0], t, max(cur[2], el)]
        elif cur is not None:
            out.append(tuple(cur))
            cur = None
        t += dt
    if cur is not None:
        out.append(tuple(cur))
    return out


def in_eclipse(r, sun_hat):
    """Bong tru: ve tinh o phia toi va cach truc Mat Troi-Trai Dat < RE."""
    s = float(r @ sun_hat)
    return s < 0 and float(np.linalg.norm(r - s * sun_hat)) < RE


SUN_HAT = np.array([1.0, 0.0, 0.0])      # huong Mat Troi co dinh (xuan phan) - don gian hoa
