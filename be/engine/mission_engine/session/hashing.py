"""Hash ket qua phien (lam tron de on dinh so hoc). Dung chung cho Ops va replay."""
import hashlib
from ..catalog import canonical


def _round(x, nd=4):
    if isinstance(x, float):
        return round(x, nd)
    if isinstance(x, list):
        return [_round(i, nd) for i in x]
    if isinstance(x, dict):
        return {k: _round(v, nd) for k, v in x.items()}
    return x


def result_hash(res):
    body = _round({"score": res["score"], "mode": res["mode"], "detail": res["mode_detail"], "faults": res["faults"]})
    return hashlib.sha256(canonical(body).encode()).hexdigest()[:16]
