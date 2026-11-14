"""Model dau vao cua API (pydantic). Core engine khong phu thuoc pydantic; schema JSON xuat bang tools/export_schemas.py."""
from typing import Any, Literal
from pydantic import BaseModel, Field


class LaunchModel(BaseModel):
    vehicle: str
    site: str


class CommunicationsModel(BaseModel):
    station_id: str = "GS-GOLDSTONE"
    target_id: str = "all"
    tx_scale: float = Field(default=1., ge=.25, le=1.)
    rate_scale: float = Field(default=1., ge=.1, le=1.)
    strategy: Literal["balanced", "data_first", "save_power"] = "balanced"


class DesignSpecModel(BaseModel):
    schema_version: str = "design/1"
    mission: str
    orbit: str
    instruments: list[str]
    bus: str
    power: str
    battery: str
    comm: str
    obc: str
    adcs: str
    launch: LaunchModel
    seed: int = 0
    communications: CommunicationsModel | None = None


class OpsStep(BaseModel):
    dt: float = Field(gt=0, le=3600)
    actions: list[dict[str, Any]] = []


class TimedAction(BaseModel):
    t: float
    action: dict[str, Any]


class SessionLogModel(BaseModel):
    schema_version: str = "session/1"
    engine_version: str
    catalog_hash: str
    mission_hash: str
    mission: str
    seed: int
    design: dict[str, Any]
    actions: list[TimedAction]
    t_end: float


class AdviseRequest(BaseModel):
    mission_id: str
    objective: str = "max_score"
    k: int = Field(5, ge=1, le=20)


class RoomCreate(BaseModel):
    mission_id: str
    player_id: str
    name: str
    roles: list[str]


class RoomJoin(BaseModel):
    player_id: str
    name: str
    roles: list[str]


class RoomEdit(BaseModel):
    player_id: str
    slot: str
    value: Any
    expected_version: int


class ProposalCreate(BaseModel):
    player_id: str
    slot: str
    value: Any
    rationale: str = ""


class ProposalRespond(BaseModel):
    player_id: str
    accept: bool


class ScoreSubmit(BaseModel):
    player_id: str
    display_name: str
    session: SessionLogModel
    claimed_hash: str
    room_id: str | None = None
