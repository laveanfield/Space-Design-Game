"""Loi chuan cua engine. Moi loi co ma (code) de client hien thi ro rang."""


class EngineError(Exception):
    code = "ENGINE_ERROR"

    def __init__(self, message="", **details):
        super().__init__(message)
        self.details = details

    def to_dict(self):
        return {"error": {"code": self.code, "message": str(self), "details": self.details}}


class CatalogIdMissing(EngineError): code = "CATALOG_ID_MISSING"
class OrbitNotAllowed(EngineError): code = "ORBIT_NOT_ALLOWED"
class NoGoCapacity(EngineError): code = "NO_GO_CAPACITY"
class PackInvalid(EngineError): code = "PACK_INVALID"
class SchemaMismatch(EngineError): code = "SCHEMA_MISMATCH"
class PermissionDenied(EngineError): code = "PERMISSION_DENIED"
class Conflict(EngineError): code = "CONFLICT"
class UnitError(EngineError): code = "UNIT_ERROR"
class NotFound(EngineError): code = "NOT_FOUND"
class ScoreRejected(EngineError): code = "SCORE_REJECTED"
