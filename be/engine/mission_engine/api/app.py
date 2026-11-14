"""FastAPI backend cho Space Mission Design Game. Moi route goi vao Engine facade."""
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from ..errors import EngineError
from ..kernels import ascent, attitude, cost, decay, dv_budget, geometry, insertion, link, orbit, power, radiation, relative
from ..service import Engine


class DesignRequest(BaseModel):
    design: Dict[str, Any]
    mission_id: Optional[str] = None
    with_hints: bool = True
    seed: Optional[int] = None
    allow_nofit: bool = False


class OpsOpenRequest(BaseModel):
    design: Dict[str, Any]
    mission_id: Optional[str] = None
    seed: Optional[int] = None


class OpsStepRequest(BaseModel):
    dt: float = Field(default=5.0, ge=0.0, le=3600.0)
    actions: List[Dict[str, Any]] = Field(default_factory=list)


class AdviseRequest(BaseModel):
    mission_id: str
    objective: str = "max_score"
    k: int = Field(default=5, ge=1, le=20)


def _kernel_manifests():
    mods = [orbit, dv_budget, insertion, geometry, power, link, radiation, decay, attitude, relative, ascent, cost]
    out = []
    for m in mods:
        mf = getattr(m, "MANIFEST", None)
        if mf:
            out.append(mf)
        else:
            out.append({"id": m.__name__.split(".")[-1].upper(), "doc": (m.__doc__ or "").strip()})
    return out


def create_app(root: str = ".") -> FastAPI:
    root_path = Path(root).resolve()
    eng = Engine.from_root(root_path)
    ops_sessions: Dict[str, Any] = {}

    app = FastAPI(title="Space Mission Design Game API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def _handle_err(exc: Exception):
        if isinstance(exc, EngineError):
            raise HTTPException(status_code=400, detail={"code": exc.code, "message": str(exc), "details": exc.details})
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(exc)})

    @app.get("/health")
    def health():
        return eng.health()

    @app.get("/catalog")
    def catalog():
        return eng.catalog.to_dict()

    @app.get("/missions")
    def list_missions():
        return eng.missions_meta()

    @app.get("/missions/{mission_id}")
    def get_mission(mission_id: str):
        try:
            m = eng.mission(mission_id)
            return {
                "id": m.id,
                "meta": m.meta,
                "objective": m.raw.get("objective", {}),
                "scenario": m.scenario,
                "design_space": m.design_space,
                "gameplay": m.gameplay,
                "hazards": m.hazards,
                "narrative": m.narrative,
                "presets": m.presets,
                "starter": m.starter,
                "scoring": m.weights,
                "life_years": m.life_years,
                "hash": m.hash,
            }
        except Exception as exc:
            _handle_err(exc)

    @app.post("/evaluate")
    def evaluate(req: DesignRequest):
        try:
            return eng.evaluate(req.design, mission_id=req.mission_id, with_hints=req.with_hints)
        except Exception as exc:
            _handle_err(exc)

    @app.post("/fly")
    def fly(req: DesignRequest):
        try:
            return eng.fly(req.design, mission_id=req.mission_id, seed=req.seed, allow_nofit=req.allow_nofit)
        except Exception as exc:
            _handle_err(exc)

    @app.get("/campaign/accommodation")
    def campaign_accommodation():
        try:
            return eng.accommodation()
        except Exception as exc:
            _handle_err(exc)

    @app.post("/campaign/lifetime")
    def campaign_lifetime(req: DesignRequest):
        try:
            return eng.lifetime(req.design, mission_id=req.mission_id, seed=req.seed)
        except Exception as exc:
            _handle_err(exc)

    @app.post("/ops")
    def ops_open(req: OpsOpenRequest):
        try:
            sess = eng.ops_open(req.design, mission_id=req.mission_id, seed=req.seed)
            ops_id = uuid.uuid4().hex[:12]
            ops_sessions[ops_id] = sess
            return {"ops_id": ops_id, "snapshot": sess.snapshot()}
        except Exception as exc:
            _handle_err(exc)

    @app.post("/ops/{ops_id}/step")
    def ops_step(ops_id: str, req: OpsStepRequest):
        sess = ops_sessions.get(ops_id)
        if not sess:
            raise HTTPException(status_code=404, detail={"code": "OPS_NOT_FOUND", "message": f"Khong tim thay phien {ops_id}"})
        try:
            return sess.step(req.dt, req.actions)
        except Exception as exc:
            _handle_err(exc)

    @app.post("/ops/{ops_id}/finish")
    def ops_finish(ops_id: str):
        sess = ops_sessions.get(ops_id)
        if not sess:
            raise HTTPException(status_code=404, detail={"code": "OPS_NOT_FOUND", "message": f"Khong tim thay phien {ops_id}"})
        try:
            return sess.finish()
        except Exception as exc:
            _handle_err(exc)

    @app.post("/advise")
    def advise(req: AdviseRequest):
        try:
            return eng.advise(req.mission_id, objective=req.objective, k=req.k)
        except Exception as exc:
            _handle_err(exc)

    @app.get("/validity")
    def validity():
        doctor_path = root_path / "build" / "reports" / "data_doctor.md"
        doctor_md = doctor_path.read_text(encoding="utf-8") if doctor_path.exists() else ""
        return {
            "engine_version": eng.health()["engine_version"],
            "catalog_hash": eng.catalog.hash,
            "kernels": _kernel_manifests(),
            "data_doctor_md": doctor_md,
            "assumptions": [
                "Quy dao 2 vat RK4 (buoc <= 5s), bo qua nhieu loan J2 va ap suat buc xa Mat Troi.",
                "K-ASC dung mo hinh giai tich (placeholder-analytic) cho den khi cam backend ascent chi tiet.",
                "Hieu suat ha du lieu (downlink_efficiency) mac dinh 0.85 (calibrated).",
            ],
        }

    fe_dist = root_path.parent / "fe" / "dist"
    web_dir = fe_dist if fe_dist.exists() else (root_path / "web")
    if web_dir.exists():
        @app.get("/")
        def index():
            return FileResponse(web_dir / "index.html")

        app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="web")

    return app
