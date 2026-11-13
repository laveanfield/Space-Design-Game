"""Dam phan: de xuat sua slot cua nguoi khac. Tac dong len constraint duoc TU TINH bang hieu hai EvaluationReport."""
import uuid
import time
from ..errors import PermissionDenied, NotFound, Conflict
from . import roles as R
from .rooms import _member, _with_slot, _commit


def impact(before, after):
    """{constraint_id: delta bien} + delta diem. Duong = tot hon cho constraint do."""
    b = {c["id"]: c["margin"] for c in before["constraints"]}
    out = {c["id"]: round(c["margin"] - b[c["id"]], 4) for c in after["constraints"] if c["id"] in b}
    out["_score"] = round(after["score"]["total"] - before["score"]["total"], 2)
    return out


def propose(room, player_id, slot, value, rationale, evaluate_fn, table, now=None):
    now = time.time() if now is None else now
    _member(room, player_id)
    before, cand = evaluate_fn(room["design"]), _with_slot(room["design"], slot, value)
    after = evaluate_fn(cand)
    owners = R.owners(slot, room["members"], table)
    pr = {"id": uuid.uuid4().hex[:8], "from": player_id, "slot": slot, "value": value, "rationale": rationale,
          "impact": impact(before, after), "owners": owners, "status": "pending", "base_version": room["version"], "t": now}
    room["proposals"][pr["id"]] = pr
    return pr


def respond(room, proposal_id, player_id, accept, evaluate_fn, table, now=None):
    """Chu slot hoac nguoi quan ly nguon luc duyet. Khong co chu slot trong phong -> bat ky ai khac nguoi de xuat."""
    now = time.time() if now is None else now
    pr = room["proposals"].get(proposal_id)
    if not pr:
        raise NotFound("khong co de xuat nay", proposal=proposal_id)
    _member(room, player_id)
    if pr["status"] != "pending":
        raise Conflict("de xuat da duoc xu ly", status=pr["status"])
    eligible = set(R.owners(pr["slot"], room["members"], table)) | set(R.arbiters(room["members"], table))
    if not eligible:
        eligible = set(room["members"]) - {pr["from"]}
    if player_id not in eligible:
        raise PermissionDenied("ban khong co quyen duyet de xuat nay", slot=pr["slot"])
    if not accept:
        pr["status"] = "rejected"
        return pr, None
    design = _with_slot(room["design"], pr["slot"], pr["value"])
    report = evaluate_fn(design)
    _commit(room, design, report, pr["from"], {"slot": pr["slot"], "value": pr["value"], "proposal": pr["id"], "accepted_by": player_id}, now)
    pr["status"] = "accepted"
    return pr, report
