"""Hau qua cua thiet ke: (1) su co luc phong, (2) vong doi 12 moc tren quy dao.

Triet ly gameplay ("Launch Anything"): man che tao KHONG phan xet thiet ke. Nguoi choi chi thay hau qua
khi bay that: no o Max-Q, hut van toc roi lai khi quyen, sap nguon, chet chip vi buc xa, roi quy dao...
Sau do moi co ho so nguyen nhan goc (dossier) de tu rut kinh nghiem.

Moi so lieu vat ly lay tu bao cao evaluate() (metrics + constraints) cua engine -> khong co cong thuc vat ly moi.
Cac he so "bao mon bien du tru" duoi day la THAM SO GAMEPLAY (estimate), ghi ro de de chinh:
"""
import random

STEPS = 12                 # 12 moc thoi gian trai deu tren tuoi tho yeu cau cua de (1 nam -> moi moc = 1 thang)
PANEL_FADE = 0.05          # [estimate] tam pin suy giam 5 % cong suat sau ca vong doi
LOAD_CREEP = 0.10          # [estimate] tai tieu thu + pin chai lam bien du tru dien hep them 10 % tai
STORM_DOSE = (0.10, 0.25)  # [estimate] mot tran bao Mat Troi cong them 10-25 % lieu ca vong doi
SEU_WARN = 0.80            # tu 80 % nguong chiu buc xa: bat dau co reset (SEU), mat mot phan du lieu
REENTRY_ALT_KM = 120.0     # duoi do cao nay coi nhu da roi vao khi quyen


def _t(vi, en):
    return {"vi": vi, "en": en}


# ---------------------------------------------------------------- (1) su co luc phong
def launch_failure(metrics, ascent_out):
    """Tra None neu phong sach; nguoc lai dict mo ta su co: kind, t (giay), explode, title, cause, numbers."""
    events = {e["name"]: e["t"] for e in ascent_out["events"]}
    dry, limit = metrics["mass.dry_kg"], metrics["mass.bus_limit_kg"]
    if dry > limit + 1e-9:
        return {
            "kind": "structural_maxq", "t": events.get("MAXQ", 40.0), "explode": True, "constraint": "mass",
            "title": _t("GÃY KHUNG VỆ TINH TẠI MAX-Q", "PAYLOAD STRUCTURAL FAILURE AT MAX-Q"),
            "cause": _t(
                "Tổng khối lượng linh kiện vượt sức chịu của khung vệ tinh. Ở Max-Q (áp suất động lớn nhất) khung gãy, "
                "tải trọng va vào fairing, tên lửa mất cân bằng và hệ thống an toàn bãi phóng phải hủy chuyến bay.",
                "The parts outweigh what the bus structure can carry. At Max-Q the frame fails, the payload hits the fairing, "
                "the vehicle goes unstable and range safety terminates the flight."),
            "numbers": [{"label": "mass.dry_kg", "value": round(dry, 2), "unit": "kg"},
                        {"label": "mass.bus_limit_kg", "value": round(limit, 2), "unit": "kg"}],
        }
    if not ascent_out["reaches_orbit"]:
        if ascent_out.get("reason"):
            return {
                "kind": "wrong_plane", "t": ascent_out["t_end"], "explode": False, "constraint": "launch",
                "title": _t("KHÔNG VÀO ĐƯỢC MẶT PHẲNG QUỸ ĐẠO", "TARGET ORBIT PLANE NOT REACHABLE"),
                "cause": _t(
                    "Từ bãi phóng này không thể phóng trực tiếp vào quỹ đạo có độ nghiêng nhỏ hơn vĩ độ của bãi. "
                    "Tầng trên cháy hết nhiên liệu ở sai mặt phẳng, vệ tinh trôi mất khỏi vùng nhiệm vụ.",
                    "A launch site cannot inject directly into an inclination below its own latitude. "
                    "The upper stage burns out in the wrong plane and the satellite is lost to the mission."),
                "numbers": [], "detail": ascent_out["reason"],
            }
        short = ascent_out["dv_needed_ms"] - ascent_out["dv_ideal_ms"]
        return {
            "kind": "dv_shortfall", "t": ascent_out["t_end"] + 25.0, "explode": True, "constraint": "mass",
            "title": _t("HỤT VẬN TỐC, RƠI LẠI KHÍ QUYỂN", "VELOCITY SHORTFALL, RE-ENTRY BREAKUP"),
            "cause": _t(
                "Tên lửa cháy hết nhiên liệu khi chưa đủ vận tốc quỹ đạo: tải quá nặng hoặc quỹ đạo quá cao so với sức đẩy. "
                "Cả tầng trên lẫn vệ tinh rơi lại và vỡ tan khi vào khí quyển.",
                "The vehicle runs dry before orbital velocity: too much payload or too high an orbit for this rocket. "
                "Upper stage and satellite fall back and break up on re-entry."),
            "numbers": [{"label": "dv_needed_ms", "value": round(ascent_out["dv_needed_ms"]), "unit": "m/s"},
                        {"label": "dv_ideal_ms", "value": round(ascent_out["dv_ideal_ms"]), "unit": "m/s"},
                        {"label": "dv_short_ms", "value": round(short), "unit": "m/s"}],
        }
    return None


# ---------------------------------------------------------------- (2) vong doi tren quy dao
_DOSSIER = {
    "radiation": (_t("CHẾT MÁY TÍNH VÌ BỨC XẠ (SEU / LATCH-UP)", "COMPUTER KILLED BY RADIATION (SEU / LATCH-UP)"), "OBC",
                  _t("Biên dự trữ bức xạ phải tính cho cả vòng đời và cả bão Mặt Trời, không chỉ ngày đầu.",
                     "Radiation margin must cover the whole life and solar storms, not day one.")),
    "power": (_t("SẬP NGUỒN TRONG VÙNG TỐI (BROWN-OUT)", "POWER BROWN-OUT IN ECLIPSE"), "POWER / BATTERY",
              _t("Điện phải đủ cho cả lúc Trái Đất che Mặt Trời, và còn dư khi pin, tấm pin già đi.",
                 "Power must cover eclipse and still have margin as cells and battery age.")),
    "lifetime": (_t("RƠI QUỸ ĐẠO, CHÁY TRONG KHÍ QUYỂN", "ORBIT DECAY, RE-ENTRY"), "ORBIT",
                 _t("Quỹ đạo càng thấp, lực cản khí quyển càng kéo vệ tinh xuống nhanh.",
                    "The lower the orbit, the faster drag pulls the satellite down.")),
    "data": (_t("DỮ LIỆU NGHẼN: CHỤP ĐƯỢC NHƯNG KHÔNG GỬI VỀ KỊP", "DATA BOTTLENECK: CAPTURED BUT NEVER DOWNLINKED"), "COMM",
             _t("Thiết bị sinh dữ liệu bao nhiêu thì đường truyền mỗi ngày phải gửi về được bấy nhiêu.",
                "The link must carry per day what the instruments produce per day.")),
    "pointing": (_t("ẢNH NHÒE: CHỈ HƯỚNG KHÔNG ĐỦ CHÍNH XÁC", "BLURRED DATA: POINTING NOT ACCURATE ENOUGH"), "ADCS",
                 _t("Thiết bị càng tinh thì hệ điều khiển tư thế càng phải giữ hướng chính xác.",
                    "The finer the instrument, the tighter the attitude control must hold.")),
    "science": (_t("KHÔNG ĐẠT MỤC TIÊU KHOA HỌC", "SCIENCE GOAL NOT MET"), "INSTRUMENT",
                _t("Thiết bị phải đủ năng lực cho đúng câu hỏi khoa học của nhiệm vụ.",
                   "The instruments must be capable of answering the mission's science question.")),
    "orbit_allowed": (_t("SAI QUỸ ĐẠO NHIỆM VỤ", "WRONG MISSION ORBIT"), "ORBIT",
                      _t("Quỹ đạo quyết định vệ tinh nhìn thấy gì và bao lâu một lần.",
                         "The orbit decides what the satellite sees and how often.")),
    "cost": (_t("VƯỢT NGÂN SÁCH", "OVER BUDGET"), "PROGRAMME",
             _t("Sếp không quyết toán phần vượt: uy tín của bạn trả giá.", "The Director will not sign off the overrun.")),
    "schedule": (_t("TRỄ TIẾN ĐỘ", "BEHIND SCHEDULE"), "PROGRAMME",
                 _t("Linh kiện đặt lâu kéo cả dự án trễ hạn.", "Long-lead parts push the whole project late.")),
}
_KILLERS = ("radiation", "power", "lifetime")
_REVIEW = ("data", "pointing", "science", "orbit_allowed")
_BOSS = ("cost", "schedule")


def _dossier(cid, con, extra=None):
    title, subsystem, lesson = _DOSSIER.get(cid, (_t(cid.upper(), cid.upper()), "SYSTEM", _t("", "")))
    numbers = [{"label": k, "value": round(v, 3) if isinstance(v, float) else v} for k, v in (con or {}).get("drivers", {}).items()]
    return {"id": cid, "title": title, "subsystem": subsystem, "cause": (con or {}).get("why") or _t("", ""),
            "lesson": lesson, "numbers": numbers + (extra or [])}


def simulate_lifetime(report, life_years, seed=0):
    """Chay 12 moc tren quy dao tu bao cao evaluate(). Tat dinh theo seed (bao Mat Troi)."""
    m = report["metrics"]
    cons = {c["id"]: c for c in report["constraints"]}
    rng = random.Random(int(seed) * 7919 + 13)
    storm_step = rng.randint(3, 10)
    storm_dose = m["radiation.dose_krad"] * rng.uniform(*STORM_DOSE)

    gen, load, margin0 = m["power.gen_avg_w"], max(m["power.load_w"], 1e-6), m["power.margin_w"]
    tol, dose_total = m["radiation.tolerance_krad"], m["radiation.dose_krad"]
    alt0 = m["orbit.altitude_km"]
    decay_steps = STEPS * m["lifetime.years"] / max(life_years, 1e-6)          # so moc cho toi khi roi han
    gen_day, down_day = m["data.generated_gb_per_day"], m["data.downlink_gb_per_day"]
    blur = 0.0
    pc = cons.get("pointing")
    if pc and not pc["pass"]:
        blur = min(1.0, max(0.15, -pc["margin"] / max(pc.get("scale", 1.0), 1e-6)))
    days = 365.25 * life_years / STEPS

    soc, delivered, lost, unusable = 1.0, 0.0, 0.0, 0.0
    steps, killer, alive = [], None, True
    for k in range(1, STEPS + 1):
        frac = k / STEPS
        ev = []
        # --- buc xa: lieu tich luy + bao Mat Troi
        dose = dose_total * frac + (storm_dose if k >= storm_step else 0.0)
        if k == storm_step:
            ev.append({"code": "SOLAR_STORM", "level": "warn", "text": _t("Bão Mặt Trời quét qua quỹ đạo: liều bức xạ tăng vọt.", "A solar storm sweeps the orbit: dose jumps.")})
        seu = dose > SEU_WARN * tol
        # --- dien: bien du tru bi bao mon dan
        margin = margin0 - (PANEL_FADE * gen + LOAD_CREEP * load) * frac
        soc = max(0.0, min(1.0, soc + 0.6 * margin / load)) if margin < 0 else min(1.0, soc + 0.25)
        # --- do cao: luc can khi quyen
        alt = alt0 if decay_steps > 40 * STEPS else max(REENTRY_ALT_KM, alt0 - (alt0 - REENTRY_ALT_KM) * min(1.0, k / decay_steps) ** 3)
        # --- du lieu
        made = gen_day * days
        sent = min(gen_day, down_day) * days * (0.7 if seu else 1.0)
        delivered += sent
        lost += made - sent
        unusable += sent * blur

        if dose > tol:
            killer = "radiation"
            ev.append({"code": "OBC_DEAD", "level": "crit", "text": _t("Máy tính trên tàu treo cứng: liều bức xạ đã vượt ngưỡng chịu của chip.", "On-board computer latched up: dose is past the chip's tolerance.")})
        elif soc <= 0.05:
            killer = "power"
            ev.append({"code": "BLACKOUT", "level": "crit", "text": _t("Pin cạn trong vùng tối, vệ tinh tắt hẳn.", "Battery empty in eclipse, spacecraft is dark.")})
        elif alt <= REENTRY_ALT_KM + 1e-6:
            killer = "lifetime"
            ev.append({"code": "REENTRY", "level": "crit", "text": _t("Vệ tinh chạm tầng khí quyển đặc và bốc cháy.", "The satellite hits dense atmosphere and burns up.")})
        else:
            if seu:
                ev.append({"code": "SEU_RESET", "level": "warn", "text": _t("Máy tính tự khởi động lại nhiều lần, mất một phần dữ liệu.", "Computer keeps resetting, some data is lost.")})
            if margin < 0:
                ev.append({"code": "BROWNOUT", "level": "warn", "text": _t("Điện áp bus sụt trong vùng tối, phải tắt bớt tải.", "Bus voltage sags in eclipse, loads are shed.")})
            if alt < alt0 - 25:
                ev.append({"code": "DECAY", "level": "warn", "text": _t("Độ cao quỹ đạo đang tụt nhanh.", "Orbit altitude is dropping fast.")})
            if made - sent > 0.25 * made:
                ev.append({"code": "BUFFER_FULL", "level": "warn", "text": _t("Bộ nhớ đầy: dữ liệu mới ghi đè dữ liệu chưa kịp gửi về.", "Memory full: new data overwrites data not yet sent.")})
            if blur > 0:
                ev.append({"code": "BLUR", "level": "warn", "text": _t("Đội mặt đất báo dữ liệu nhận về bị nhòe.", "Ground team reports the received data is smeared.")})
            if not ev:
                ev.append({"code": "NOMINAL", "level": "info", "text": _t("Mọi hệ thống hoạt động, dữ liệu về đều.", "All systems nominal, data flowing.")})
        steps.append({"k": k, "month": round(k * life_years, 1), "alive": killer is None, "soc": round(soc, 3),
                      "dose_krad": round(dose, 3), "tolerance_krad": tol, "alt_km": round(alt, 1), "margin_w": round(margin, 2),
                      "delivered_gb": round(delivered, 3), "lost_gb": round(lost, 3), "events": ev})
        if killer:
            alive = False
            break

    generated = gen_day * days * STEPS
    usable = max(0.0, delivered - unusable)
    review = [{"id": cid, "pass": bool(cons[cid]["pass"]), "title": _DOSSIER[cid][0]} for cid in _REVIEW + _BOSS if cid in cons]
    failed_review = [r["id"] for r in review if not r["pass"] and r["id"] in _REVIEW]
    boss_fail = [r["id"] for r in review if not r["pass"] and r["id"] in _BOSS]
    if killer:
        extra = [{"label": "storm_dose_krad", "value": round(storm_dose, 3)}] if killer == "radiation" else []
        dossier = _dossier(killer, cons.get(killer), extra)
    elif failed_review:
        dossier = _dossier(failed_review[0], cons.get(failed_review[0]))
    elif boss_fail:
        dossier = _dossier(boss_fail[0], cons.get(boss_fail[0]))
    else:
        dossier = None
    success = alive and not failed_review
    return {
        "schema_version": "lifetime/1", "steps_total": STEPS, "life_years": life_years, "steps": steps,
        "outcome": {"alive": alive, "survived_steps": len(steps) if alive else len(steps) - 1, "killer": killer,
                    "success": success, "boss_fail": boss_fail, "review_fail": failed_review, "review": review,
                    "generated_gb": round(generated, 3), "delivered_gb": round(delivered, 3), "usable_gb": round(usable, 3),
                    "usable_frac": round(usable / generated, 3) if generated > 0 else 0.0},
        "dossier": dossier,
        "score": report.get("score"),
    }
