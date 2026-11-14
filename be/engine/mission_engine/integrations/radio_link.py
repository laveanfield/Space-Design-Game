"""HTTP-facing adapter for the vendored cubesat-link solver."""

from typing import Any

from cubesat_link import InputError, __version__, load_request, run_request
from cubesat_link.interface import error_response, schema_document


def solve_json_body(body: bytes) -> tuple[int, dict[str, Any]]:
    """Run one strict UTF-8 JSON request and return an HTTP status and envelope."""
    try:
        text = body.decode("utf-8-sig")
    except UnicodeDecodeError:
        error = InputError("INVALID_JSON", "Request body must be UTF-8 JSON")
        return 400, error_response(error)

    try:
        request = load_request(text)
        return 200, run_request(request)
    except InputError as exc:
        return 400, error_response(exc)


def get_schema(name: str) -> dict[str, Any]:
    """Return one of the versioned JSON schemas shipped with the solver."""
    return schema_document(name)


def info() -> dict[str, Any]:
    """Describe the solver contract exposed by this backend."""
    return {
        "name": "cubesat-link",
        "release": __version__,
        "schema_version": "1.0",
        "operations": ["evaluate_link", "contact_windows"],
    }
