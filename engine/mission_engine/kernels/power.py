"""K-PWR: phat dien, eclipse, pin."""
MANIFEST = {
    "id": "K-PWR",
    "equations": ["P_gen_avg = P_gen*(1 - f_eclipse)*k_sun", "P_sustain = E_batt*DoD/t_eclipse", "margin = min(P_gen_avg, P_sustain) - P_load"],
    "assumptions": ["k_sun (ti le nang trung binh tren tam pin) la gia dinh [estimate]", "DoD pin la gia dinh"],
    "valid_range": "quy dao tron, phat dien khong suy giam theo tuoi",
    "refs": ["Larson & Wertz, SMAD (cong suat)"],
    "tests": ["margin_signs", "soc_bounds"],
}


def avg_generation_w(gen_w, eclipse_fraction, sun_factor):
    return gen_w * (1 - eclipse_fraction) * sun_factor


def eclipse_hours(period_s, eclipse_fraction):
    return period_s * eclipse_fraction / 3600.0


def sustain_w(capacity_wh, dod, eclipse_h):
    return capacity_wh * dod / max(eclipse_h, 1e-9)


def margin_w(gen_avg_w, load_w, sustain):
    return min(gen_avg_w, sustain) - load_w


def soc_step(soc, p_gen, p_load, dt, capacity_wh):
    return max(0.0, min(1.0, soc + (p_gen - p_load) * dt / 3600.0 / capacity_wh))
