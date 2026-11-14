"""K-INS: dua len QUY DAO MUC TIEU (giai tich): huong phong, loi quay Trai Dat, SSO, Hohmann, doi mat phang."""
import math
from .orbit import MU, RE, WE, v_circ

MANIFEST = {
    "id": "K-INS",
    "equations": [
        "cos(i) = cos(lat)*sin(beta)", "v_rot = wE*RE*cos(i)", "cos(i_SSO) = -(a/12352 km)^(7/2)",
        "dv1 = sqrt(mu/r1)*(sqrt(2*r2/(r1+r2)) - 1)", "dv2 = sqrt(mu/r2)*(1 - sqrt(2*r1/(r1+r2)))",
        "dv_pc = 2*V*sin(di/2)",
    ],
    "assumptions": ["mo hinh trong mat phang; do nghieng chi tac dong qua nang luong va hinh hoc hien thi"],
    "valid_range": "i >= |lat| (phong truc tiep)",
    "refs": ["Cornelisse; Anderson (Hohmann)"],
    "tests": ["sso_600", "hohmann_leo_geo", "v_rot_28n"],
}


def rotation_bonus(inc_deg):
    """Loi van toc tu quay Trai Dat khi phong truc tiep vao quy dao nghieng i (m/s)."""
    return WE * RE * math.cos(math.radians(inc_deg))


def azimuth_for(inc_deg, lat_deg):
    """Huong phong beta (do) cho do nghieng i tai vi do lat; None neu i < |lat| (khong phong truc tiep duoc)."""
    c = math.cos(math.radians(inc_deg)) / math.cos(math.radians(lat_deg))
    return None if abs(c) > 1 else math.degrees(math.asin(c))


def sso_inclination(alt_km):
    a = RE / 1e3 + alt_km
    return math.degrees(math.acos(-(a / 12352.0) ** 3.5))


def hohmann(r1, r2):
    dv1 = math.sqrt(MU / r1) * (math.sqrt(2 * r2 / (r1 + r2)) - 1)
    dv2 = math.sqrt(MU / r2) * (1 - math.sqrt(2 * r1 / (r1 + r2)))
    return dv1, dv2


def plane_change(v, d_inc_deg):
    return 2 * v * math.sin(math.radians(d_inc_deg) / 2)


def plan(alt_km, inc_deg, lat_deg):
    """Ke hoach phong cho quy dao tron alt_km, nghieng inc_deg tu bai co vi do lat_deg."""
    beta = azimuth_for(inc_deg, lat_deg)
    r = RE + alt_km * 1e3
    if beta is None:
        return {"feasible": False, "reason": f"do nghieng {inc_deg:.1f} < vi do bai {abs(lat_deg):.1f}: khong phong truc tiep duoc",
                "v_circ": v_circ(r), "v_rot": 0.0, "azimuth_deg": None}
    return {"feasible": True, "reason": "", "v_circ": v_circ(r), "v_rot": rotation_bonus(inc_deg), "azimuth_deg": beta}
