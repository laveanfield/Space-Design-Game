"""L1 CATALOG: bang du lieu chuan hoa + provenance + hash on dinh."""
import json
import hashlib
from pathlib import Path
from ..errors import CatalogIdMissing, SchemaMismatch

SCHEMA = "catalog/1"


def canonical(obj):
    """JSON chuan hoa (khoa sap xep, khong khoang trang) -> hash on dinh giua cac lan build."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


class Catalog:
    def __init__(self, tables, prov=None, meta=None):
        self.tables = tables          # {table: {id: record}}
        self.prov = prov or {}        # {table: {id: {field: 'default'|'estimate'|'public'|'calibrated'}}}
        self.meta = meta or {}

    def get(self, table, id_):
        try:
            return self.tables[table][id_]
        except KeyError:
            raise CatalogIdMissing(f"khong co {table}/{id_}", table=table, id=id_)

    def ids(self, table):
        return sorted(self.tables.get(table, {}))

    def rows(self, table):
        return [self.tables[table][i] for i in self.ids(table)]

    def source_of(self, table, id_, field):
        """Nguon goc cua mot truong; khong ghi gi nghia la 'library'."""
        return self.prov.get(table, {}).get(id_, {}).get(field, "library")

    @property
    def hash(self):
        return hashlib.sha256(canonical({"t": self.tables, "p": self.prov}).encode()).hexdigest()[:8]

    def to_dict(self):
        return {"schema_version": SCHEMA, "catalog_hash": self.hash, "tables": self.tables,
                "_prov": self.prov, "meta": self.meta}

    def save(self, path):
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(self.to_dict(), ensure_ascii=False, indent=1), encoding="utf-8")

    @classmethod
    def from_dict(cls, d):
        if not str(d.get("schema_version", "")).startswith("catalog/1"):
            raise SchemaMismatch("catalog khong dung schema_version", got=d.get("schema_version"))
        return cls(d["tables"], d.get("_prov"), d.get("meta"))

    @classmethod
    def load(cls, path):
        return cls.from_dict(json.loads(Path(path).read_text(encoding="utf-8")))
