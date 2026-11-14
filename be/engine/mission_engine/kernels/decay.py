"""K-DEC: suy giam quy dao va tuoi tho (mo hinh toc do tut trung binh, SKELETON)."""
MANIFEST = {
    "id": "K-DEC",
    "equations": ["rate_km_per_day = (alt0 - alt_floor)/(lifetime_years*365.25)"],
    "assumptions": ["toc do tut trung binh suy tu tuoi tho khong reboost cua dataset [estimate]; thuc te tang nhanh o do cao thap"],
    "valid_range": "LEO",
    "refs": ["SMAD (suy giam quy dao)"],
    "tests": ["rate_positive"],
}
FLOOR_KM = 150.0


def decay_km_per_day(alt0_km, lifetime_years):
    return max(alt0_km - FLOOR_KM, 0.0) / (max(lifetime_years, 1e-6) * 365.25)


def alt_after(alt0_km, days, lifetime_years, boost_km=0.0):
    return max(FLOOR_KM, alt0_km - decay_km_per_day(alt0_km, lifetime_years) * days + boost_km)
