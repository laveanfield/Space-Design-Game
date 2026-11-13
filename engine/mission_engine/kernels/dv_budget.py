"""K-DV: so Delta-v. Tsiolkovsky de DOI CHIEU (khong dua vao vong lap RK4: se tinh trung)."""
import math

MANIFEST = {
    "id": "K-DV",
    "equations": ["dV = Isp*g0*ln(M0/Mf)", "v_burnout = dV_ideal - L_g - L_d - L_s + v_rot"],
    "assumptions": ["ton hao tich phan doc quy dao tu mo phong ascent (K-ASC)"],
    "valid_range": "moi tang noi tiep; booster song song phai tich phan luc day (khong cong Tsiolkovsky tung tang)",
    "refs": ["Cornelisse, Rocket Propulsion and Spaceflight Dynamics (Tsiolkovsky, gravity loss)"],
    "tests": ["ledger_closure", "tsiolkovsky_value"],
}
G0 = 9.80665


def tsiolkovsky(isp_s, m0, mf):
    return isp_s * G0 * math.log(m0 / mf)


def ledger(dv_ideal, l_g, l_d, l_s, v_rot):
    """v_burnout dung so: Delta-v ly tuong tru ton hao, cong loi quay Trai Dat."""
    return dv_ideal - l_g - l_d - l_s + v_rot


def residual_rel(v_burnout, v_orbit):
    return (v_burnout - v_orbit) / v_orbit
