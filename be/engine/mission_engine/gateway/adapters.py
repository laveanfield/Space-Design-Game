"""Doc dataset tho -> {ten_sheet: [dong dict]}. KHONG import file .py la: chi doc hang so literal bang ast."""
import ast
import csv
import json
from pathlib import Path


def read_tables(path):
    p = Path(path)
    ext = p.suffix.lower()
    if ext == ".json":
        return _json(p)
    if ext == ".csv":
        return {p.stem: _csv(p)}
    if ext in (".xlsx", ".xlsm"):
        return _xlsx(p)
    if ext == ".py":
        return _pyliteral(p)
    raise ValueError(f"dinh dang chua ho tro: {ext}")


def _json(p):
    d = json.loads(p.read_text(encoding="utf-8"))
    d = d.get("sheets", d)
    return {k: v for k, v in d.items() if isinstance(v, list)}


def _csv(p):
    with open(p, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def _xlsx(p):
    from openpyxl import load_workbook          # chi can khi dung xlsx
    wb = load_workbook(p, read_only=True, data_only=True)
    out = {}
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue
        head = [str(h).strip() if h is not None else "" for h in rows[0]]
        out[ws.title] = [dict(zip(head, r)) for r in rows[1:] if any(c is not None for c in r)]
    return out


def _pyliteral(p):
    """Doc cac hang so cap cao nhat la list[dict] hoac dict[id -> dict] (vd space_mission_library.py)."""
    tree = ast.parse(p.read_text(encoding="utf-8"))
    out = {}
    for n in tree.body:
        if isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name):
            try:
                val = ast.literal_eval(n.value)
            except Exception:
                continue                          # bo qua gia tri khong phai literal
            name = n.targets[0].id
            if isinstance(val, list) and val and all(isinstance(x, dict) for x in val):
                out[name] = val
            elif isinstance(val, dict) and val and all(isinstance(x, dict) for x in val.values()):
                out[name] = [{"_key": k, **x} for k, x in val.items()]
    return out
