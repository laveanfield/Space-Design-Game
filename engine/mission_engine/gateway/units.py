"""Chuan hoa don vi. Don vi nguon -> (don vi chuan, he so nhan). Tu 'rad' la lieu buc xa; goc radian viet la 'radian'."""
from ..errors import UnitError

U = {
    # khoi luong
    "kg": ("kg", 1.0), "g": ("kg", 1e-3), "t": ("kg", 1e3), "lb": ("kg", 0.45359237),
    # chieu dai
    "m": ("m", 1.0), "cm": ("m", 1e-2), "mm": ("m", 1e-3), "ft": ("m", 0.3048),
    "km": ("km", 1.0), "mi": ("km", 1.609344),
    # cong suat, nang luong
    "W": ("W", 1.0), "mW": ("W", 1e-3), "kW": ("W", 1e3),
    "Wh": ("Wh", 1.0), "kWh": ("Wh", 1e3), "J": ("Wh", 1.0 / 3600),
    # du lieu (GB = 1e9 byte; Mbps = 1e6 bit/s)
    "GB": ("GB", 1.0), "MB": ("GB", 1e-3), "TB": ("GB", 1e3),
    "GB/day": ("GB/day", 1.0), "MB/day": ("GB/day", 1e-3),
    "Mbps": ("Mbps", 1.0), "kbps": ("Mbps", 1e-3), "Gbps": ("Mbps", 1e3), "MB/s": ("Mbps", 8.0),
    # lieu buc xa
    "krad": ("krad", 1.0), "rad": ("krad", 1e-3), "Gy": ("krad", 0.1),
    # goc
    "deg": ("deg", 1.0), "arcsec": ("deg", 1.0 / 3600), "mrad": ("deg", 0.0572957795), "radian": ("deg", 57.29577951308232),
    # chi phi (M$ = trieu USD)
    "MUSD": ("MUSD", 1.0), "USD": ("MUSD", 1e-6), "kUSD": ("MUSD", 1e-3), "BUSD": ("MUSD", 1e3),
    # mo men, thoi gian
    "Nm": ("Nm", 1.0), "mNm": ("Nm", 1e-3),
    "s": ("s", 1.0), "min": ("s", 60.0), "h": ("s", 3600.0), "day": ("s", 86400.0),
}

# hau to ten truong -> don vi chuan (theo quy uoc cua space_mission_library)
SUFFIX = {
    "_kg": "kg", "_m": "m", "_km": "km", "_w": "W", "_wh": "Wh", "_gb_per_day": "GB/day", "_gb": "GB",
    "_mbps": "Mbps", "_krad": "krad", "_deg": "deg", "_musd": "MUSD", "_nm": "Nm", "_s": "s",
}


def canonical_unit(field):
    """Don vi chuan suy ra tu hau to ten truong; khong khop thi None."""
    for suf in sorted(SUFFIX, key=len, reverse=True):
        if field.endswith(suf):
            return SUFFIX[suf]
    return None


def convert(value, unit, target=None):
    """Doi value tu 'unit' sang don vi chuan. Neu cho 'target' ma khac nhom don vi -> UnitError."""
    if unit not in U:
        raise UnitError(f"don vi la: {unit}", unit=unit)
    canon, k = U[unit]
    if target is not None and canon != target:
        raise UnitError(f"don vi {unit} khong doi duoc sang {target}", unit=unit, target=target)
    return float(value) * k
