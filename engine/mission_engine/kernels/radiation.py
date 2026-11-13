"""K-RAD: tich luy lieu va lich SEU tat dinh theo seed."""
import numpy as np

MANIFEST = {
    "id": "K-RAD",
    "equations": ["dose = rate_krad_per_year*years*margin_factor", "N_SEU ~ Poisson(rate_per_day*T/86400)"],
    "assumptions": ["toc do SEU la tham so cua mission/ruleset [estimate]", "khong mo hinh che chan"],
    "valid_range": "so sanh liều tich luy voi rad_tolerance_krad cua may tinh bay",
    "refs": ["SMAD (moi truong buc xa)"],
    "tests": ["seu_deterministic"],
}


def dose_krad(rate_per_year, years, margin_factor=1.0):
    return rate_per_year * years * margin_factor


def seu_times(seed, rate_per_day, horizon_s):
    """Danh sach thoi diem SEU (giay) - cung seed cho cung ket qua."""
    rng = np.random.Generator(np.random.PCG64(seed))
    n = int(rng.poisson(rate_per_day * horizon_s / 86400.0))
    return sorted(float(x) for x in rng.uniform(0, horizon_s, n))
