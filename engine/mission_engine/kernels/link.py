"""K-LNK: link budget bac 1 va luong du lieu ha moi ngay."""
import math

MANIFEST = {
    "id": "K-LNK",
    "equations": ["FSPL = 20*log10(4*pi*d*f/c)", "EbN0 = EIRP + Gr - FSPL - L - 10log10(k*Ts) - 10log10(R)", "margin = EbN0 - EbN0_req",
                  "GB/day = Mbps*contact_min*60*eta/8000"],
    "assumptions": ["bac 1: Tsys, EbN0_req, hieu suat ha eta la dai dien [estimate]", "suy giam do lech huong 12*(theta/bw)^2 dB"],
    "valid_range": "khong mo hinh dieu che, khong suy giam khi quyen",
    "refs": ["Larson & Wertz, SMAD (link budget)"],
    "tests": ["fspl_value", "margin_monotone", "downlink_formula"],
}
C = 299792458.0
K_B = 1.380649e-23
BAND_HZ = {"UHF": 4.0e8, "S": 2.2e9, "X": 8.2e9, "Ka": 2.6e10, "optical": 1.93e14}


def fspl_db(d_m, f_hz):
    return 20 * math.log10(4 * math.pi * d_m * f_hz / C)


def beamwidth_deg(gain_dbi):
    return min(360.0, math.sqrt(41253.0 / 10 ** (gain_dbi / 10)))


def pointing_loss_db(theta_deg, bw_deg):
    return min(12 * (theta_deg / bw_deg) ** 2, 60.0)


def margin_db(tx_w, gt_dbi, gr_dbi, d_m, f_hz, rate_bps, tsys_k=300.0, req_ebn0_db=9.6, loss_db=2.0, theta_deg=0.0):
    eirp = 10 * math.log10(tx_w) + gt_dbi
    p_loss = pointing_loss_db(theta_deg, beamwidth_deg(gt_dbi))
    pr_dbw = eirp + gr_dbi - fspl_db(d_m, f_hz) - loss_db - p_loss
    n0 = 10 * math.log10(K_B * tsys_k)
    return pr_dbw - n0 - 10 * math.log10(rate_bps) - req_ebn0_db


def downlink_gb_per_day(rate_mbps, contact_min, eta):
    return rate_mbps * contact_min * 60 * eta / 8000.0


def state(margin, lock_db=3.0, marginal_db=0.0):
    return "LOCK" if margin >= lock_db else ("MARGINAL" if margin >= marginal_db else "DEGRADED")
