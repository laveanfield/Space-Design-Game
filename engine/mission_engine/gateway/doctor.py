"""DATA DOCTOR: kiem tra catalog truoc khi cho game dung. ERROR chan build, WARN khong chan."""
import json
from .mapper import issue
from ..catalog import Catalog


def _as_list(v):
    return v if isinstance(v, list) else ([] if v in (None, "") else [v])


def run(cat, schema, ranges=None, extra_issues=(), feasibility_fn=None):
    iss = list(extra_issues)
    tables = schema.get("tables", {})
    # D01 bang bat buoc co mat va khong rong
    for t in tables:
        if not cat.tables.get(t):
            iss.append(issue("ERROR", "D01", t, "thieu bang bat buoc hoac bang rong"))
    # D02 truong bat buoc co gia tri
    for t, spec in tables.items():
        for rid, rec in cat.tables.get(t, {}).items():
            for f in spec.get("required", []):
                if rec.get(f) in (None, "", []):
                    iss.append(issue("ERROR", "D02", f"{t}.{rid}.{f}", "thieu gia tri bat buoc"))
    # D04 tham chieu cheo ton tai
    for ref in schema.get("refs", []):
        valid = set(cat.tables.get(ref["to"], {}))
        for rid, rec in cat.tables.get(ref["table"], {}).items():
            for v in _as_list(rec.get(ref["field"])):
                if v not in valid:
                    iss.append(issue("ERROR", "D04", f"{ref['table']}.{rid}.{ref['field']}", f"tham chieu toi '{v}' khong ton tai trong {ref['to']}"))
    # D05 khoang vat ly hop ly
    for key, (lo, hi) in (ranges or {}).items():
        t, f = key.split(".", 1)
        for rid, rec in cat.tables.get(t, {}).items():
            v = rec.get(f)
            if isinstance(v, (int, float)) and not lo <= v <= hi:
                iss.append(issue("WARN", "D05", f"{t}.{rid}.{f}", f"{v} ngoai dai thuong gap [{lo}, {hi}] - nghi sai don vi?"))
    # D08 gia tri do Gateway tu dien (default)
    for t, per_id in cat.prov.items():
        for rid, fields in per_id.items():
            for f, src in fields.items():
                if src == "default":
                    iss.append(issue("WARN", "D08", f"{t}.{rid}.{f}", "thieu trong dataset, Gateway dung gia tri mac dinh"))
    # D09 rang buoc cheo co nghia
    for rid, rec in cat.tables.get("instruments", {}).items():
        if not _as_list(rec.get("compatible_orbit_ids")):
            iss.append(issue("WARN", "D09", f"instruments.{rid}", "khong tuong thich quy dao nao"))
    for rid, rec in cat.tables.get("scenarios", {}).items():
        if not _as_list(rec.get("allowed_orbit_ids")):
            iss.append(issue("WARN", "D09", f"scenarios.{rid}", "khong cho phep quy dao nao"))
    # D12 kha thi: moi mission co it nhat mot thiet ke dong du budget
    feas = []
    if feasibility_fn:
        feas = feasibility_fn(cat)
        for mid, n in feas:
            if n == 0:
                iss.append(issue("WARN", "D12", mid, "KHONG co thiet ke kha thi voi du lieu hien tai (xem advisor)"))
    # D14 hash on dinh sau khi luu/doc lai
    again = Catalog.from_dict(json.loads(json.dumps(cat.to_dict())))
    if again.hash != cat.hash:
        iss.append(issue("ERROR", "D14", "catalog", "hash khong on dinh sau khi luu/doc lai"))
    n = {lv: sum(1 for i in iss if i["level"] == lv) for lv in ("ERROR", "WARN", "INFO")}
    return {"catalog_hash": cat.hash, "errors": n["ERROR"], "warnings": n["WARN"], "info": n["INFO"],
            "issues": iss, "feasibility": feas, "sources": cat.meta.get("sources", [])}


def to_markdown(rep):
    out = [f"# DATA DOCTOR  catalog {rep['catalog_hash']}", "",
           f"nguon: {', '.join(rep['sources']) or '(khong co)'}",
           f"ERROR {rep['errors']}   WARN {rep['warnings']}   INFO {rep['info']}", ""]
    for lv in ("ERROR", "WARN", "INFO"):
        for i in rep["issues"]:
            if i["level"] == lv:
                out.append(f"- **{lv}** `{i['code']}` {i['where']}: {i['msg']}")
    for mid, n in rep.get("feasibility", []):
        out.append(f"- FEAS {mid}: {'OK (' + str(n) + ' thiet ke)' if n else 'KHONG co thiet ke kha thi'}")
    return "\n".join(out) + "\n"


def provenance_markdown(cat):
    out = ["# Provenance (gia tri KHONG nguyen van tu library)", "", "| bang.id.truong | nguon |", "|---|---|"]
    for t, per_id in sorted(cat.prov.items()):
        for rid, fields in sorted(per_id.items()):
            for f, src in sorted(fields.items()):
                out.append(f"| {t}.{rid}.{f} | {src} |")
    return "\n".join(out) + "\n"
