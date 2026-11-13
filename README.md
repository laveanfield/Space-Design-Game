# Space Mission Design Game — sườn code (skeleton)

Sườn code theo `docs/architecture.md` (NASA Space Apps 2026, Space Mission Design Game).
Dữ liệu vào → kernel vật lý cố định → luật/điểm → viewer. Ngày thi chỉ sửa **dữ liệu** (mapping, mission YAML).

> **Dữ liệu trong `data/raw/` là số liệu MẪU TỔNG HỢP**, không phải `space_mission_library` thật.
> **K-ASC (ascent) là placeholder giải tích** — cắm code vật lý đã kiểm chứng bằng `ascent.register_backend()`.

## Chạy nhanh
```bash
pip install -e ".[api,xlsx,dev]"
make ingest      # data/raw + mapping -> build/catalog.json + build/reports/data_doctor.md
make packs       # mọi preset của mọi mission phải khớp `expect`
make test        # pytest
make api         # FastAPI :8000  (docs tại /docs)
make web         # giao diện Vite :5173 (cần Node >= 20)
```

## Cấu trúc
| Thư mục | Vai trò |
|---|---|
| `data/` | dataset thô, mapping, overrides (có provenance), địa lý (trạm, mục tiêu) |
| `missions/` | `ruleset.yaml` (10 constraint chuẩn là dữ liệu), `mode_resolver.yaml`, `rewards.yaml`, `*.mission.yaml` |
| `engine/mission_engine/` | gateway · catalog · mission · kernels · rules · modes · session · collab · rewards · storage · api |
| `tools/` | sinh dữ liệu mẫu, kiểm tra preset, xuất schema |
| `web/` | vỏ web Vite + React + TS (`EngineClient`, màn hình, hợp đồng figure cho `/anatomy`) |
| `legacy/` | đặt file Ursina/vật lý cũ để tham chiếu (không import) |

## Cắm vật lý đã kiểm chứng vào K-ASC
```python
from mission_engine.kernels import ascent
ascent.register_backend(my_backend)   # my_backend(vehicle, site, target, payload_kg, seed) -> dict cùng khung _placeholder
```
Bundle trả về có `meta.physics`; UI phải hiện cảnh báo khi còn `placeholder-analytic`.

## Database làm sau
Engine chỉ biết `engine/mission_engine/storage/ports.py` (SessionRepo, ScoreRepo, RoomRepo, PlayerRepo).
Mặc định RAM (`MemoryRepos`); có sẵn `SqliteRepos` + `schema.sql`. Đổi DB = viết adapter mới, không sửa engine.

## Đa người chơi, thưởng, bảng xếp hạng
- `collab/`: phòng ≤ 4 người, vai trò quyết định slot được sửa, đề xuất + tác động tự tính bằng `evaluate()`.
- `rewards/` + `missions/rewards.yaml`: thành tích và XP là dữ liệu; level mở khoá tier thiết bị (`basic`/`advanced`).
- **Bảng xếp hạng chống gian lận**: client gửi `session.json`; server **chạy lại** phiên (engine tất định, bước thời gian theo lưới 5 s) và chỉ nhận nếu hash khớp.
