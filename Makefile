PY ?= python3
.PHONY: install sample ingest packs test api schemas web validate clean

install:
	$(PY) -m pip install -e ".[api,xlsx,dev]"

sample:
	$(PY) tools/make_sample_library.py

ingest:
	PYTHONPATH=engine $(PY) -m mission_engine.gateway.build --root .

packs:
	$(PY) tools/check_packs.py

test:
	$(PY) -m pytest -q

api:
	PYTHONPATH=engine uvicorn mission_engine.api.app:create_app --factory --reload --port 8000

schemas:
	PYTHONPATH=engine $(PY) tools/export_schemas.py

web:
	cd web && npm install && npm run dev

validate: ingest packs test

clean:
	rm -rf build .pytest_cache
