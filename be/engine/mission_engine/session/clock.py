"""Dong ho + time-warp. Engine la tham quyen: client xin muc warp, engine tra muc duoc phep."""
WARPS = (1, 2, 5, 50, 100)          # khong co x10 (theo yeu cau cua nhom)


def allowed_warp(requested, alt_km=None, t=0.0, event_times=(), since_sep=None, deploying=False, window_s=15.0):
    """Kim warp: <= x5 duoi 120 km, +-15 s quanh su kien, 30 s dau sau tach, khi canh pin dang mo."""
    cap = max(WARPS)
    if alt_km is not None and alt_km < 120.0:
        cap = 5
    if any(abs(t - te) <= window_s for te in event_times):
        cap = min(cap, 5)
    if since_sep is not None and 0.0 <= since_sep < 30.0:
        cap = min(cap, 5)
    if deploying:
        cap = min(cap, 5)
    ok = [w for w in WARPS if w <= cap and w <= requested]
    return max(ok) if ok else 1
