"""Spherical, horizontally stratified neutral atmosphere; outward rays only.

Bouguer invariant b=n*r*cos(elevation), as in the original UAV ODE and
ITU-R P.834-9 Annex 1 equations (6)-(7). No effective-radius correction.
Gas is an integral of supplied specific attenuation, NOT a P.676 generator.
"""
from bisect import bisect_right
from dataclasses import dataclass
from math import acos, cos, degrees, exp, radians, sqrt
from .types import Effect, WGS84, finite, known, unknown
from .geometry import dot, norm, station_ecef, sub


@dataclass(frozen=True)
class NeutralProfile:
    height_m: tuple[float, ...]
    refractive_index: tuple[float, ...]
    source: str
    frequency_range_hz: tuple[float, float]
    gamma_db_per_km: tuple[float, ...] | None = None
    gas_frequency_hz: float | None = None
    gas_source: str | None = None
    outside: str = "vacuum_above_top"  # explicit truncation, no extrapolation

    def __post_init__(self):
        h, n = tuple(self.height_m), tuple(self.refractive_index)
        object.__setattr__(self, "height_m", h)
        object.__setattr__(self, "refractive_index", n)
        finite(*h, *n, *self.frequency_range_hz)
        if len(h) < 2 or len(h) != len(n) or any(b <= a for a,b in zip(h,h[1:])):
            raise ValueError("Profile needs matching arrays and increasing heights")
        if h[0] < 0 or any(x < 1 for x in n):
            raise ValueError("Require h>=0 and neutral n>=1")
        if not self.source or self.outside not in ('vacuum_above_top','unavailable'):
            raise ValueError("Source and explicit top boundary required")
        if self.outside == 'vacuum_above_top' and n[-1] != 1:
            raise ValueError('Vacuum boundary requires n(top)=1; use unavailable for bounded UAV data')
        if len(self.frequency_range_hz) != 2:
            raise ValueError('frequency_range_hz requires two endpoints')
        if not 0 < self.frequency_range_hz[0] <= self.frequency_range_hz[1]:
            raise ValueError("Invalid refractivity frequency validity interval")
        if self.gamma_db_per_km is not None:
            gamma = tuple(self.gamma_db_per_km)
            object.__setattr__(self, "gamma_db_per_km", gamma)
            finite(*gamma)
            if (len(gamma) != len(h) or min(gamma) < 0 or
                    (self.outside == 'vacuum_above_top' and gamma[-1] != 0)):
                raise ValueError("Gas samples must match heights, be nonnegative and respect top boundary")
            if self.gas_frequency_hz is None or not self.gas_source:
                raise ValueError("Gas samples require exact frequency and source")
            finite(self.gas_frequency_hz)
            if self.gas_frequency_hz <= 0:
                raise ValueError("Gas frequency must be positive")

    def at(self, h):
        if h < self.height_m[0] - 1e-7:
            raise ValueError("Below profile: no extrapolation")
        if h > self.height_m[-1] and self.outside == 'unavailable':
            raise ValueError('Above profile: no extrapolation or vacuum assumption')
        if h >= self.height_m[-1] and self.outside == 'vacuum_above_top':
            return 1.0, 0.0, 0.0
        i = max(0, min(len(self.height_m)-2, bisect_right(self.height_m, h)-1))
        a, b = self.height_m[i:i+2]
        slope = (self.refractive_index[i+1]-self.refractive_index[i])/(b-a)
        n = self.refractive_index[i] + slope*(h-a)
        gamma = 0.0 if self.gamma_db_per_km is None else (
            self.gamma_db_per_km[i] + (self.gamma_db_per_km[i+1]-self.gamma_db_per_km[i])*(h-a)/(b-a))
        return n, slope, gamma


def p834_reference_profile():
    """P.834-9 Eq (8) reference n, not weather data or gas absorption.

    Tabulated every 250 m up to 100 km; last value set to 1 (discarded N
    about 0.000387). Package scope 0.1–12 GHz; no resonance dispersion.
    """
    h = tuple(float(x) for x in range(0, 100001, 250))
    n = tuple(1 + 0.000315 * exp(-0.1361*x/1000) for x in h[:-1]) + (1.0,)
    return NeutralProfile(h, n, "P.834-9 Eq (8), reference exponential; truncated at 100 km",
                          (1e8, 12e9))


def _quad_vector(f, a, b, tolerances, depth=18):
    def simpson(a, b, fa, fm, fb):
        return tuple((b-a)*(x+4*y+z)/6 for x,y,z in zip(fa,fm,fb))
    def rec(a,b,fa,fm,fb,whole,tol,left):
        m = (a+b)/2
        fl, fr = f((a+m)/2), f((m+b)/2)
        l, r = simpson(a,m,fa,fl,fm), simpson(m,b,fm,fr,fb)
        delta = tuple(x+y-z for x,y,z in zip(l,r,whole))
        if all(abs(d) <= 15*t for d,t in zip(delta,tol)):
            return tuple(x+y+d/15 for x,y,d in zip(l,r,delta))
        if left == 0:
            raise ArithmeticError("Neutral quadrature did not converge")
        tl = tuple(t/2 for t in tol)
        lv, rv = rec(a,m,fa,fl,fm,l,tl,left-1), rec(m,b,fm,fr,fb,r,tl,left-1)
        return tuple(x+y for x,y in zip(lv,rv))
    fa, fm, fb = f(a), f((a+b)/2), f(b)
    return rec(a,b,fa,fm,fb,simpson(a,b,fa,fm,fb),tolerances,depth)


@dataclass(frozen=True)
class NeutralRay:
    status: str
    reason: str
    apparent_elevation_deg: float | None = None
    path_length_m: float | None = None
    excess_path_m: float | None = None
    gas_loss: Effect = Effect(None, "dB", "not_computable", "No gas profile")
    bending_deg: float | None = None
    max_central_angle_deg: float | None = None
    endpoint_residual_rad: float | None = None
    ground_clear: bool | None = None
    refractivity_excess_m: float | None = None  # integral (n-1) ds
    geometric_excess_m: float | None = None  # curved length minus vacuum chord
    total_excess_m: float | None = None  # optical length minus vacuum chord


def trace_spherical(station, state, frequency_hz, profile, earth=WGS84):
    """Connect actual endpoints on a sphere, with vacuum tail to satellite.

    Restricted to monotonic n(r)*r and non-descending rays; reports failure
    explicitly for other ray families. No claims about ducting or terrain.
    Input latitudes are spherical latitudes when earth.flattening == 0.
    """
    finite(frequency_hz)
    if frequency_hz <= 0:
        raise ValueError("frequency_hz must be positive")
    def fail(reason):
        return NeutralRay("not_computable", reason)
    if earth.flattening != 0:
        return fail("Spherical refraction requires explicit spherical Earth, not WGS-84")
    if not profile.frequency_range_hz[0] <= frequency_hz <= profile.frequency_range_hz[1]:
        return fail("Frequency outside supplied refractivity profile validity; no clamp")
    radius = earth.semi_major_m
    p = station_ecef(station, earth)
    r0, rt = norm(p), norm(state.position_m)
    if rt <= r0 or station.altitude_m < profile.height_m[0]:
        return fail("Require satellite above station and station covered by profile")
    phi = acos(max(-1.0, min(1.0, dot(p,state.position_m)/(r0*rt))))
    n0 = profile.at(station.altitude_m)[0]
    bmax = n0*r0
    top = radius + profile.height_m[-1]
    if rt > top and profile.outside == 'unavailable':
        return fail('Endpoint above bounded neutral profile; no extrapolation to satellite')
    split = sorted(set([r0, min(rt, max(r0,top))] +
                       [radius+h for h in profile.height_m if r0 < radius+h < min(rt,top)]))
    # For linear n, derivative of n*r is linear. Check both interval ends;
    # excludes ducts/turning points and guarantees the outward ray cannot hit ground.
    for low, high in zip(split, split[1:]):
        nm, slope, _ = profile.at((low+high)/2-radius)
        for r in (low, high):
            n = nm+slope*(r-(low+high)/2)
            if n + r*slope <= 0:
                return fail("Nonmonotonic n*r (duct/turning layer): unsupported ray family")

    def integrals(b):
        result = [0.0]*4  # phi, geometric length, excess optical length, gas dB
        for low, high in zip(split, split[1:]):
            mid = (low+high)/2
            nm, slope, gm = profile.at(mid-radius)
            gl = profile.at(low-radius)[2]
            gh = profile.at(high-radius)[2]
            gslope = (gh-gl)/(high-low)
            def fn(t):
                r = r0 + t*t
                n = nm+slope*(r-mid)
                nr = n*r
                diff = nr-b
                if t == 0:
                    if b != bmax:
                        return (0.0,)*4
                    base = 2*b/sqrt(2*b*(n0+r0*slope))
                    return (base/r0, base, base*(n0-1), base*gl/1000)
                # Stable cancellation at the tangent origin within its first layer.
                if low == r0:
                    diff = (bmax-b)+(n0+r0*slope)*t*t+slope*t**4
                q = sqrt(max(0.0, diff)*(nr+b))
                if q == 0:
                    raise ArithmeticError("Singular ray")
                ds = 2*t*nr/q
                return (2*t*b/(r*q), ds, ds*(n-1), ds*(gm+gslope*(r-mid))/1000)
            part = _quad_vector(fn, sqrt(max(0,low-r0)), sqrt(high-r0),
                                (1e-12, 1e-5, 1e-7, 1e-9))
            result = [x+y for x,y in zip(result,part)]
        start = max(r0,top)
        if rt > start:
            result[0] += acos(min(1,b/rt))-acos(min(1,b/start))
            result[1] += sqrt(rt*rt-b*b)-sqrt(max(0,start*start-b*b))
        return result
    try:
        maximum = integrals(bmax)[0]
        if phi > maximum + 1e-10:
            return NeutralRay("not_computable", "Endpoint outside supported outward-ray horizon; descending rays not searched",
                              max_central_angle_deg=degrees(maximum))
        lo, hi = 0.0, bmax
        if phi < 1e-14:
            b = 0.0
        else:
            for _ in range(52):
                b = (lo+hi)/2
                if integrals(b)[0] < phi:
                    lo = b
                else:
                    hi = b
            b = (lo+hi)/2
        angle, length, excess, gas = integrals(b)
    except ArithmeticError as exc:
        return fail(str(exc))
    if abs(angle-phi) > 1e-8:
        return fail("Endpoint residual exceeds 1e-8 rad")
    launch = acos(max(-1,min(1,b/bmax)))
    nt = profile.at(rt-radius)[0]
    arrival = acos(max(-1,min(1,b/(nt*rt))))
    gas_result = unknown("dB", "No specific attenuation profile; P.676 not implemented")
    if profile.gamma_db_per_km is not None:
        if frequency_hz != profile.gas_frequency_hz:
            gas_result = unknown("dB", "Gas table belongs to a different frequency; no clamp/interpolation")
        else:
            gas_result = known(gas, "dB", "Integral gamma ds on this ray; " + profile.gas_source)
    geometric_excess = length - norm(sub(state.position_m, p))
    if geometric_excess < -1e-3:
        return fail("Numerical path length shorter than endpoint chord")
    # Roundoff at the vacuum/zenith limit; tolerance is 1 mm, not a physical loss.
    geometric_excess = max(0.0, geometric_excess)
    return NeutralRay("computed", profile.source+"; outward branch; top boundary="+profile.outside,
                      degrees(launch), length, excess, gas_result,
                      degrees(launch-arrival+angle), degrees(maximum), angle-phi, r0>=radius,
                      excess, geometric_excess, excess + geometric_excess)
