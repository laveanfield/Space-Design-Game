"""Ap file mapping: cot nguon -> truong chuan, doi don vi, tach danh sach, dien default (co provenance)."""
import re
from .units import convert, canonical_unit


def norm(s):
    return re.sub(r"[^a-z0-9]+", "", str(s).lower())


def issue(level, code, where, msg):
    return {"level": level, "code": code, "where": where, "msg": msg}


def map_table(spec, rows, aliases=None):
    """Tra ve (records {id: rec}, prov {id: {field: nguon}}, issues[])."""
    aliases = aliases or {}
    table, idspec = spec["table"], spec["id"]
    fields, defaults = spec.get("fields", {}), spec.get("defaults", {})
    recs, prov, issues = {}, {}, []
    for n, row in enumerate(rows, start=2):                      # dong 1 la header
        raw_id = row.get(idspec["from"])
        if raw_id in (None, ""):
            issues.append(issue("ERROR", "D03", f"{table} dong {n}", "thieu id"))
            continue
        rid = aliases.get(str(raw_id).strip(), str(raw_id).strip())
        if rid in recs:
            issues.append(issue("ERROR", "D03", f"{table}.{rid}", "id trung"))
            continue
        pre = idspec.get("expect_prefix")
        if pre and not rid.startswith(pre):
            issues.append(issue("WARN", "D03", f"{table}.{rid}", f"id khong bat dau bang {pre}"))
        rec, pv = {"id": rid}, {}
        for fld, f in fields.items():
            v = row.get(f["from"]) if "from" in f else None
            if v in (None, ""):
                continue
            try:
                rec[fld] = _coerce(fld, v, f)
            except Exception as e:
                issues.append(issue("ERROR", "D02", f"{table}.{rid}.{fld}", f"khong doc duoc '{v}': {e}"))
        for fld, dv in defaults.items():                          # truong thieu -> default, ghi provenance
            if fld not in rec:
                rec[fld] = dv
                pv[fld] = "default"
        recs[rid] = rec
        if pv:
            prov[rid] = pv
    return recs, prov, issues


def _coerce(fld, v, f):
    if f.get("split"):
        return [x.strip() for x in str(v).split(f["split"]) if x.strip()]
    numeric = isinstance(v, (int, float)) and not isinstance(v, bool)
    if not numeric:
        try:
            v = float(str(v).strip().replace(",", "."))
            numeric = True
        except ValueError:
            return str(v).strip()                                 # chuoi thuan
    if f.get("unit"):
        return convert(v, f["unit"], canonical_unit(fld))
    return v
