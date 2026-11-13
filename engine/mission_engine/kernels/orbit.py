"""K-ORB: chuyen dong 2 vat bang RK4 (Trai Dat cau, khong J2)."""
import math
import numpy as np

MANIFEST = {
    "id": "K-ORB",
    "equations": ["r'' = -mu*r/|r|^3", "E = 0.5*V^2 - mu/r", "T = 2*pi*sqrt(a^3/mu)", "V^2 = mu*(2/r - 1/a)"],
    "assumptions": ["2 vat, Trai Dat cau", "khong J2, khong drag (drag nam o K-DEC)"],
    "valid_range": "LEO den GEO, buoc con dt <= 5 s",
    "refs": ["Anderson, Introduction to Flight, chuong Astronautics (eq 8.57, 8.58)"],
    "tests": ["circular_closure", "vis_viva", "energy_drift", "period_vs_kepler"],
}
MU = 3.986004418e14          # m^3/s^2
RE = 6378137.0               # m
WE = 7.2921159e-5            # rad/s, toc do quay Trai Dat


def accel(r, mu=MU):
    return -mu * r / np.linalg.norm(r) ** 3


def step_rk4(r, v, dt, mu=MU):
    k1r = v;               k1v = accel(r, mu)
    k2r = v + 0.5*dt*k1v;  k2v = accel(r + 0.5*dt*k1r, mu)
    k3r = v + 0.5*dt*k2v;  k3v = accel(r + 0.5*dt*k2r, mu)
    k4r = v + dt*k3v;      k4v = accel(r + dt*k3r, mu)
    return r + dt/6*(k1r + 2*k2r + 2*k3r + k4r), v + dt/6*(k1v + 2*k2v + 2*k3v + k4v)


def propagate(r, v, T, dt=5.0, mu=MU):
    """Tich phan tu 0 den T giay (buoc cuoi le)."""
    n = int(T // dt)
    for _ in range(n):
        r, v = step_rk4(r, v, dt, mu)
    rem = T - n * dt
    return step_rk4(r, v, rem, mu) if rem > 1e-12 else (r, v)


def v_circ(r, mu=MU):      return math.sqrt(mu / r)
def period(a, mu=MU):      return 2 * math.pi * math.sqrt(a ** 3 / mu)
def vis_viva(r, a, mu=MU): return math.sqrt(mu * (2 / r - 1 / a))
def energy(r, v, mu=MU):   return 0.5 * float(v @ v) - mu / float(np.linalg.norm(r))


def selftest():
    R = RE + 400e3
    r0 = np.array([R, 0.0, 0.0])
    v0 = np.array([0.0, v_circ(R), 0.0])
    r, v = propagate(r0, v0, period(R))
    return {"closure_m": float(np.linalg.norm(r - r0)), "dE_rel": abs((energy(r, v) - energy(r0, v0)) / energy(r0, v0))}
