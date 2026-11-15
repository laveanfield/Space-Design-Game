"""Vercel ASGI entrypoint for the FastAPI backend."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT / "engine") not in sys.path:
    sys.path.insert(0, str(ROOT / "engine"))

from mission_engine.api.app import create_app

app = create_app(str(ROOT))
