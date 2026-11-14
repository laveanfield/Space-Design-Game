"""Kiem tra moi preset cua moi mission pack khop `expect`. Thoat 1 neu co preset sai (dung cho CI va `make packs`)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "engine"))
from mission_engine import Engine, check_presets


def main():
    eng = Engine.from_root(Path(__file__).resolve().parent.parent)
    bad = 0
    for m in eng.missions.values():
        for r in check_presets(m, eng.catalog):
            flag = "OK  " if r["ok"] else "SAI "
            bad += 0 if r["ok"] else 1
            print(f"{flag}{r['mission']:24s} {r['preset']:15s} expect={r['expect']:16s} diem={r['score']:5.1f} {r['grade']} loi={r['failed']}")
    print("tat ca preset khop" if not bad else f"{bad} preset SAI")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
