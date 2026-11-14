"""Goi y mapping tu dong: xep hang cot nguon cho tung truong chuan (nguoi duyet roi moi dung)."""
import difflib
import re
from .units import U

_UNIT_IN_HEADER = re.compile(r"[\(\[]\s*([^\)\]]+?)\s*[\)\]]")
_UNIT_TOKENS = {"kg", "w", "wh", "gb", "mbps", "krad", "deg", "musd", "km", "m", "s", "pts", "per", "day", "yr", "years", "months"}


def _tokens(s):
    return {t for t in re.split(r"[^a-z0-9]+", s.lower()) if t and t not in _UNIT_TOKENS}


def _score(field, head):
    a, b = _tokens(field), _tokens(_UNIT_IN_HEADER.sub("", head))
    jac = len(a & b) / len(a | b) if a | b else 0.0
    seq = difflib.SequenceMatcher(None, "".join(sorted(a)), "".join(sorted(b))).ratio()
    return max(jac, seq * 0.9)


def suggest(rows, fields, threshold=0.45):
    """Tra ve {truong: {from, confidence, unit_in_header?}} cho cac truong tim thay cot du giong."""
    heads = list(rows[0].keys()) if rows else []
    out = {}
    for f in fields:
        best = max(heads, key=lambda h: _score(f, h), default=None)
        if best is None:
            continue
        sc = _score(f, best)
        if sc >= threshold:
            spec = {"from": best, "confidence": round(sc, 2)}
            m = _UNIT_IN_HEADER.search(best)
            if m and m.group(1).strip() in U:
                spec["unit_in_header"] = m.group(1).strip()
            out[f] = spec
    return out
