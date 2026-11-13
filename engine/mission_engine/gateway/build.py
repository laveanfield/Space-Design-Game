"""Gateway: ingest dataset tho -> build/catalog.json + bao cao.
Chay:  python -m mission_engine.gateway.build --root .
Ngay thi: tha dataset vao data/raw/, viet/sua data/mapping/*.map.yaml, chay lai lenh tren."""
import argparse
import re
import sys
from pathlib import Path
import yaml
from ..catalog import Catalog
from .adapters import read_tables
from .mapper import map_table, issue
from . import doctor


def _yaml(p):
    return yaml.safe_load(Path(p).read_text(encoding="utf-8")) or {}


def ingest(root, write=True, feasibility_fn=None):
    """Tra ve (catalog, report). write=True thi ghi build/catalog.json va build/reports/*.md."""
    root = Path(root)
    data = root / "data"
    aliases = _yaml(data / "mapping" / "aliases.yaml") if (data / "mapping" / "aliases.yaml").exists() else {}
    tables, prov, issues, sources, cache = {}, {}, [], [], {}
    for mf in sorted((data / "mapping").glob("*.map.yaml")):
        for spec in _yaml(mf).get("tables", []):
            src = spec["source"]
            path = data / "raw" / src["file"]
            if str(path) not in cache:
                cache[str(path)] = read_tables(path)
                sources.append(src["file"])
            rows = cache[str(path)].get(src.get("sheet"))
            if rows is None:
                issues.append(issue("ERROR", "D01", spec["table"], f"khong thay sheet '{src.get('sheet')}' trong {src['file']}"))
                continue
            recs, pv, iss = map_table(spec, rows, aliases)
            tables[spec["table"]], prov[spec["table"]] = recs, pv
            issues += iss
    _kind_rules(tables, prov, data)
    _geo(tables, data)
    issues += _overrides(tables, prov, data)
    cat = Catalog(tables, {t: p for t, p in prov.items() if p}, {"sources": sorted(set(sources))})
    schema = _yaml(data / "schema.yaml")
    ranges = _yaml(data / "ranges.yaml").get("ranges", {}) if (data / "ranges.yaml").exists() else {}
    report = doctor.run(cat, schema, ranges, issues, feasibility_fn)
    if write:
        out = root / "build"
        cat.save(out / "catalog.json")
        (out / "reports").mkdir(parents=True, exist_ok=True)
        (out / "reports" / "data_doctor.md").write_text(doctor.to_markdown(report), encoding="utf-8")
        (out / "reports" / "provenance.md").write_text(doctor.provenance_markdown(cat), encoding="utf-8")
    return cat, report


def _kind_rules(tables, prov, data):
    """Gan instrument.kind tu tu khoa trong ten neu dataset khong co cot kind."""
    p = data / "mapping" / "kind_rules.yaml"
    if not p.exists():
        return
    rules = _yaml(p).get("instruments", [])
    for rid, rec in tables.get("instruments", {}).items():
        if rec.get("kind"):
            continue
        for r in rules:
            if re.search(r["match"], str(rec.get("name", "")), re.I):
                rec["kind"] = r["kind"]
                prov.setdefault("instruments", {}).setdefault(rid, {})["kind"] = "default"
                break


def _geo(tables, data):
    """Bang dia ly khong co trong dataset: tram mat dat, muc tieu, (neu thieu) bai phong."""
    g = data / "geo"
    if (g / "ground_stations.yaml").exists():
        tables["ground_stations"] = {r["id"]: r for r in _yaml_list(g / "ground_stations.yaml")}
    if (g / "launch_sites.yaml").exists() and not tables.get("launch_sites"):
        tables["launch_sites"] = {r["id"]: r for r in _yaml_list(g / "launch_sites.yaml")}
    tg = {}
    for f in sorted((g / "targets").glob("*.yaml")) if (g / "targets").exists() else []:
        d = _yaml(f)
        for it in d.get("items", []):
            rec = tg.setdefault(it["id"], {**it, "mission_tags": []})
            rec["mission_tags"].append(d.get("set", f.stem))
    if tg:
        tables["targets"] = tg


_FLOAT = re.compile(r"^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$")


def _numify(x):
    """PyYAML doc '2.2e5' (khong co dau + o so mu) thanh CHUOI. Ep lai thanh so de khoi vo am tham."""
    if isinstance(x, str) and _FLOAT.match(x.strip()):
        return float(x)
    if isinstance(x, list):
        return [_numify(i) for i in x]
    if isinstance(x, dict):
        return {k: _numify(v) for k, v in x.items()}
    return x


def _yaml_list(p):
    d = yaml.safe_load(Path(p).read_text(encoding="utf-8"))
    return d if isinstance(d, list) else []


def _overrides(tables, prov, data):
    """Gop data/overrides/<bang>.yaml vao catalog, moi khoa ghi provenance (mac dinh 'estimate')."""
    iss = []
    for f in sorted((data / "overrides").glob("*.yaml")) if (data / "overrides").exists() else []:
        table = f.stem
        for rid, fields in _yaml(f).items():
            if rid not in tables.get(table, {}):
                iss.append(issue("WARN", "D04", f"overrides/{table}.{rid}", "override cho id khong co trong catalog"))
                continue
            meta = fields.pop("_prov", {})
            for k, v in fields.items():
                v = _numify(v)
                tables[table][rid][k] = v
                prov.setdefault(table, {}).setdefault(rid, {})[k] = (meta.get(k) or {}).get("source", "estimate")
    return iss


def main(argv=None):
    ap = argparse.ArgumentParser(description="Ingest dataset -> build/catalog.json")
    ap.add_argument("--root", default=".")
    a = ap.parse_args(argv)
    try:
        from ..rules.advisor import feasibility_report
        fn = feasibility_report(a.root)
    except Exception:
        fn = None
    cat, rep = ingest(a.root, True, fn)
    print(doctor.to_markdown(rep))
    return 1 if rep["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
