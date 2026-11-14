"""Khoi chay Space Mission Design Game API Backend tai http://127.0.0.1:8000."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "engine"))

import uvicorn
from mission_engine.api.app import create_app


def main():
    app = create_app(str(ROOT))
    print("Space Mission Design Game Backend API dang chay tai: http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
