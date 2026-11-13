# Space Mission Design Game — Kiến trúc hệ thống

> **NASA Space Apps Challenge 2026 · Challenge: Space Mission Design Game**
> Tài liệu v0.2 · 13-11-2026 · Trạng thái: bản kiến trúc chuẩn tích hợp tài nguyên NASA, CML, GMAT & Pipeline 3D Blender/Anatomy/Figma
> Nguồn: lịch sử dự án (v1 → v6, K-ASC, K-ORB, K-DV, K-ATT, K-LNK, K-PWR), tài liệu NASA Systems Engineering, CubeSat 101, GMAT, CML, MDL, Mission Viz, và skill `/anatomy`.

**Kiến trúc này phải làm được 6 việc**

1. Ngày thi: nhận dataset và chạy được game trong **vài giờ**, không sửa code kernel.
2. Đổi hoặc thêm mission bằng **dữ liệu** (YAML/JSON theo NASA Data Schema), không bằng code.
3. Giữ nguyên toàn bộ vật lý đã kiểm chứng; có cổng mở rộng sang GMAT và NAIF SPICE / JPL Horizons.
4. Đánh giá mission theo chuẩn NASA: Concept Maturity Levels (CML 1–4) và Mission Design Lab (MDL) trade-offs.
5. Hệ sinh thái 3D/UI rõ ràng: Blender (modular 3D assets), `/anatomy` (exploded-view SVG/cơ chế), Figma (UI/UX) và Three.js/React (runtime web).
6. Mọi con số trong game truy được nguồn (library / public / estimate / calibrated) để ăn điểm tối đa ở tiêu chí *Validity*.

---

## Mục lục

0. Cách đọc tài liệu
1. Tóm tắt và 8 nguyên tắc
2. Bài toán: đề NASA → yêu cầu hệ thống & Quy trình 6 giai đoạn NASA
3. Kiến trúc tổng thể
4. L0–L1: Dataset Gateway, Catalog & Chuẩn hóa 5 nhóm NASA Data Schemas
5. L2: Mission Pack
6. L3: Simulation Kernels & GMAT Simulation Adapter (Level 1 / Level 2)
7. L4: Rules — Constraint, Scoring, CML Maturity, MDL Trade Studies & Explainer
8. L4: Mission Modes
9. L5: Session Orchestrator
10. Contract và Engine Client
11. L7: Presentation, Figma UI/UX 4 màn hình & NASA Mission Viz Trajectory Schema
12. Figure Layer & 3D Asset Ecosystem — Phân công Blender, `/anatomy`, Figma, Three.js và React
13. Repo, stack, build, deploy
14. Validation và test
15. Runbook ngày thi
16. Tổ chức dự án: phân công, rủi ro, quyết định cần chốt
17. Tiêu chí chấm và checklist nộp bài
- Phụ lục A: prompt mẫu cho `/anatomy` · B: ký hiệu · C: quy ước làm việc · D: Ma trận phân tích 13 tài nguyên NASA

---

## 0. Cách đọc tài liệu

Tag trạng thái (so với code hiện có trong dự án):

| Tag | Nghĩa |
|---|---|
| `[OK]` | Đã có và đã kiểm chứng trong dự án |
| `[RE]` | Đã có nhưng phải tái cấu trúc / đóng gói lại |
| `[NEW]` | Chưa có, cần làm |
| `[?]` | Giả định hoặc chưa kiểm chứng — cần spike hoặc xác nhận |

Ưu tiên: **P0** bắt buộc trước ngày thi · **P1** nên có · **P2** nếu còn thời gian.

Quy ước chung: tên module/hàm bằng tiếng Anh (snake_case); chú thích trong code bằng tiếng Việt không dấu; kernel dùng đơn vị SI; ký hiệu theo sách tham khảo (V, γ, Isp, g0, μ, Λ…). Các số liệu đã đo ở các phiên trước được ghi là "baseline", chưa chạy lại trong tài liệu này.

---

## 1. Tóm tắt và 8 nguyên tắc

**Game là gì.** Một "xưởng thiết kế nhiệm vụ không gian". Người chơi nhận đề (Brief), thiết kế vệ tinh và chọn tên lửa/quỹ đạo (Design Desk), phóng bằng vật lý thật (Launch), vận hành và chơi gameplay theo loại nhiệm vụ (Ops), rồi xem điểm cùng lý do đạt/trượt (Debrief). Mỗi quyết định ở Design Desk có hậu quả nhìn và nghe thấy được ở Ops.

```
 BRIEF ──► DESIGN DESK ──► LAUNCH ──► SEPARATION ──► OPS (mode) ──► DEBRIEF
 de bai    chon linh kien   ascent     tach ve tinh    imaging /      diem + "vi sao"
 + rang    dong 9 budget    N tang     CW + 3-DOF      downlink /     + replay
 buoc      (live)           RK4        attitude        space weather
                                                       / orbit keeping
```

**Kiến trúc trong một câu.** *Dữ liệu* (catalog + mission pack) đi vào *kernel vật lý cố định* qua các *hợp đồng JSON có phiên bản*; kết quả được *viewer bất kỳ* vẽ lên (Anatomy SVG, dashboard, Ursina…).

### 8 nguyên tắc (không phá khi đang gấp)

| # | Nguyên tắc | Hệ quả cụ thể |
|---|---|---|
| 1 | **Dữ liệu vào, kernel đứng yên** | Mọi thứ đổi trong ngày thi (dataset, mission, trọng số điểm, chữ) là YAML/JSON/CSV. Code chỉ sửa khi cần kernel hoặc mode mới |
| 2 | **Contract-first** | Các layer chỉ nói chuyện qua schema có `schema_version`: Catalog, MissionPack, DesignSpec, EvaluationReport, FlightBundle, OpsFrame, Snapshot |
| 3 | **Vật lý là thẩm quyền duy nhất** | Chỉ kernel Python tính số. UI, figure, âm thanh, LLM chỉ hiển thị hoặc diễn giải; không ai tự bịa Δv, khối lượng, quỹ đạo |
| 4 | **Mọi con số có nguồn gốc** | Mỗi trường gắn `provenance`: `library`, `public`, `estimate`, `calibrated`. UI hiển thị và bài nộp tự sinh trang "Nguồn và giả định" |
| 5 | **Viewer-agnostic** | Cùng một `Snapshot` vẽ được bằng Anatomy (web), dashboard 2D, Ursina (quay video), Three.js (sau này) |
| 6 | **Suy giảm êm** | Thiếu cột → default + cảnh báo; thiếu API → bundle precompute; thiếu art → part generic. Không crash trước giám khảo |
| 7 | **Tất định, phát lại được** | `seed` + `catalog_hash` + `engine_version` → kết quả y hệt. Mọi phiên lưu được thành `session.json` để replay, test, quay video |
| 8 | **LLM tùy chọn và bị neo** | Mặc định giải thích bằng template xác định. Nếu bật LLM: chỉ nhận `EvaluationReport` làm đầu vào, không được thêm số |

### Nếu chỉ có 3 ngày trước ngày thi (11–13/11) — P0

1. Đóng gói vật lý hiện có thành package `mission_engine` (headless, có test) — §6, §14.
2. Dataset Gateway cho `space_mission_library` hiện có, kèm Data Doctor — §4.
3. Mission Pack loader, chạy được 3 mission từ dữ liệu — §5.
4. `evaluate()`, `fly()` và `EngineClient` (Bundle + HTTP) — §10.
5. Một lát cắt dọc trên web: Brief → Design Desk → Launch replay → Debrief — §11.
6. Ba figure Anatomy đầu tiên (F-10, F-01, F-03) — §12.

> Nếu nhóm vẫn muốn giữ **Ursina** làm viewer chính: Gateway, Mission Pack, kernel, rules không đổi — chỉ thay layer L7 (§11–12). Kiến trúc cố ý tách như vậy.

---

## 2. Bài toán: đề NASA → yêu cầu hệ thống

Đề (đã dán nguyên văn trong dự án) **không ấn định sẵn mission**. Đề chỉ ấn định quy trình thiết kế mà mọi mission phải đi qua, và nhấn mạnh bốn điều: mỗi quyết định có hậu quả rõ ràng; xác định mục tiêu trước khi chọn kỹ thuật; không có lời giải hoàn hảo duy nhất; phần giáo dục là giải thích *vì sao*.

| # | Yêu cầu của đề | Module đáp ứng | Trạng thái |
|---|---|---|---|
| R1 | Người chơi tự định nghĩa mục tiêu và yêu cầu nhiệm vụ | Mission Pack (§5) + màn Brief | `[NEW]` pack · `[OK]` brief demo SC-01 |
| R2 | Thiết kế tàu: cấu trúc, điện, pin, liên lạc, máy tính, điều khiển tư thế | Catalog (§4) + Design Desk (§11) | `[OK]` logic · `[RE]` UI web |
| R3 | Thiết bị khoa học có khối lượng, công suất, chi phí, dữ liệu, giá trị khoa học | Catalog `instruments` | `[OK]` |
| R4 | Chọn tên lửa và quỹ đạo; kiểm tra tương thích khối lượng / quỹ đạo / năng lực phóng | K-ASC + `capacity_policy` (§4.5, §6, §7) | `[OK]` 8 LV · `[?]` chính sách capacity |
| R5 | Sáu tài nguyên: Mass, Power, Budget, Data, Communications, Time | Constraint engine (§7): mass, power, cost, data, link, schedule + lifetime | `[OK]` 9 budget |
| R6 | Mô phỏng, chấm điểm, phản hồi vì sao thành/bại | Session (§9), Scoring + Explainer (§7), Debrief | `[OK]` scoring demo · `[NEW]` explainer chuẩn |
| R7 | Tối đa 4 người chơi, vai trò khác nhau, có đàm phán ưu tiên | Roles + Negotiation Board (§9.5) | `[NEW]` P2 |
| R8 | Nhóm tự xác định tài nguyên "nút thắt" cho từng loại mission | `constraints[*].critical` trong Mission Pack (§5) | `[NEW]` |

### 2.1 Quy trình phát triển nhiệm vụ khoa học NASA (6 giai đoạn & 4 segments)

Dựa trên tài liệu hệ thống chính thức của NASA (*NASA Systems Engineering Handbook & Design and Develop Science Missions*), một nhiệm vụ không gian khoa học không bao giờ bắt đầu từ việc lắp ráp tàu tùy ý, mà luôn tuân theo chu trình 6 giai đoạn và phân rã thành 4 phân đoạn (segments):

```
[1. Identify Need] ──► [2. Define Concept] ──► [3. Define Requirements]
      |                       |                         |
      v                       v                         v
Cau hoi khoa hoc      Kien truc: Orbiter,        Thong so ky thuat,
(vd: tim nuoc Mars)   Lander, Rover, Flyby       do phan giai, dai song
      │
      └────────────────────────────────────────────────────────┐
                                                               v
[6. Implement]     ◄── [5. Build & Verify]   ◄── [4. Detailed Design]
      |                       |                         |
      v                       v                         v
Phong tau, quy dao,    Kiem tra 9 budget,         Thiet ke bus, payload,
van hanh & du lieu     feasibility & CML          propulsion, power, link
```

#### Ánh xạ 6 giai đoạn NASA vào Gameplay:

| Giai đoạn NASA | Ý nghĩa kỹ thuật NASA | Ánh xạ vào Game (Flow người chơi) | Module đảm nhiệm |
|---|---|---|---|
| **1. Identify Need & Goals** | Xác định câu hỏi khoa học cần giải quyết (khí hậu Trái Đất, tìm nước Sao Hỏa, từ trường Mặt Trời...) | **Màn Brief & Mission Select**: Người chơi nhận mục tiêu khoa học, hạn định, tiêu chí thành công | Mission Pack (`meta.brief`, `objective.statement`) |
| **2. Define Concept** | Chọn kiến trúc nhiệm vụ phù hợp: Orbiter, Lander, Rover, Flyby hay Space Observatory | **Architecture Choice**: Chọn loại phương tiện (CubeSat, SmallSat, ESPA-class, Deep Space Probe) | Mission Pack (`design_space`, `mission_type`) |
| **3. Define Requirements** | Chuyển mục tiêu khoa học thành yêu cầu kỹ thuật: bước sóng, độ phân giải camera, góc quan sát | **Payload Requirement Matching**: Thiết lập bộ ràng buộc (phải chọn đúng loại cảm biến, quỹ đạo tương thích) | `ruleset.yaml` + `constraints` trong pack |
| **4. Detailed Design** | Thiết kế chi tiết: kết cấu tàu, nguồn điện, thông tin liên lạc, điều khiển tư thế, chọn tên lửa | **Design Desk**: Người chơi lắp ráp các module tàu trên giá 3D, đóng 9 budget thời gian thực | `catalog.json`, L3 Kernels, Blender/Anatomy F-10 |
| **5. Build & Verify** | Kiểm tra tính khả thi, đánh giá độ trưởng thành thiết kế (CML 1–4), phân tích rủi ro | **Mission Feasibility & Review Desk**: Chạy kiểm tra 10 constraint, kiểm tra launch gate, tính điểm CML | `EvaluationReport`, Advisor, Data Doctor D12 |
| **6. Implement** | Phóng tên lửa, bay vào quỹ đạo mục tiêu, vận hành thiết bị, thu thập và phân tích dữ liệu | **Launch Control & Ops**: Bay vật lý thật (RK4), tách tầng, ổn định tư thế, chụp ảnh/quét phổ và hạ dữ liệu | K-ASC, K-INS, Mission Modes, 3D Mission Viz |

#### 4 Phân đoạn nhiệm vụ NASA (4 Segments) trong Kiến trúc Game:

1. **Launch Segment**: Quản lý bãi phóng (`launch_sites.yaml`), tên lửa (`launch_vehicles`), động cơ đẩy từng tầng, tính toán lực đẩy, khí động học qua Max-Q và quỹ đạo chèn vệ tinh (K-ASC, K-GDN, K-INS).
2. **Space Segment**: Tàu vũ trụ với 7 hệ thống con (Subsystems theo chuẩn CubeSat 101): Cấu trúc Bus, Nguồn điện (Solar/Battery), Đẩy (Propulsion/RCS), Thông tin liên lạc (RF/Optical), Máy tính bay (OBC), Điều khiển tư thế (ADCS) và Thiết bị khoa học (Payload).
3. **Ground Segment**: Mạng lưới trạm mặt đất (`ground_stations.yaml` với 11 trạm toàn cầu bao gồm DSN/NEN), theo dõi góc ngẩng vệ tinh (elevation), cửa sổ liên lạc (contact passes) và link budget (Eb/N0, FSPL).
4. **User / Science Segment**: Trạm xử lý khoa học, tính toán dữ liệu thu nhận được, trừ suy hao do rung lắc (blur), mất nguồn (brownout), tính điểm khoa học phân phối (`science_delivered_pts`) và trả lời câu hỏi "vì sao" (Explainer).

### 2.2 Khoảng trống của bản hiện tại → "móc" trong kiến trúc

Những điểm sau đã lộ ra khi phát triển. Kiến trúc phải có chỗ chứa phần sửa:

| Gap | Hiện trạng | Móc sửa | Ưu tiên |
|---|---|---|---|
| G1 | Quỹ đạo chọn ở Design Desk không đổi quỹ đạo bay thật (luôn ≈ LEO 400 km); chỉ chi phối mô hình lỗi | Kernel K-INS (orbit insertion planner), §6.3 | P1 |
| G2 | Mọi chuyến phóng hướng Đông, kể cả bãi Vandenberg; độ nghiêng không phụ thuộc vĩ độ bãi | `target_orbit.inclination_deg` + `cos i = cos(lat)·sin β` trong K-INS | P1 |
| G3 | Sức tải mô hình lệch thư viện (tỉ lệ mô hình/thư viện: Vulcan ≈ 0,53, Vega-C ≈ 1,26, LVM3 ≈ 1,48, H3 ≈ 1,72) | `capacity_policy` + hiệu chỉnh/ballast có ghi `provenance` (§4.5) | P0 |
| G4 | Bộ chọn mode chỉ nhìn quỹ đạo → Greenhouse Gas Monitor bị chơi như chụp ảnh | `mode_resolver.yaml` nhìn thêm `instrument.kind` và `mission.gameplay.mode` (§5.4) | P0 |
| G5 | `evaluate()` chưa kiểm tra quỹ đạo có thuộc `allowed_orbit_ids` của scenario | Constraint `orbit_allowed` (§7.2) | P0 |
| G6 | Gravity turn là point-mass với α = 0 tức thời; chưa có động lực học tư thế khi bay lên | Ghi nhận; K-ATT có thể nối vào ascent ở giai đoạn sau (§6.2) | P2 |
| G7 | SEU/bức xạ và suy giảm quỹ đạo không cùng xuất hiện trong một cấu hình; decay chỉ là biến HUD, không bơm ngược vào quỹ đạo 3D | `hazards.force` trong Mission Pack + K-DEC nối vào K-ORB (§5, §6) | P1 |
| G8 | Tia liên lạc vẽ theo hình học hiển thị, lệch với hình học dùng để tính tín hiệu | Viewer đọc `link.boresight_error_deg` từ Snapshot, không tự suy ra (§10) | P1 |

---

## 3. Kiến trúc tổng thể

### 3.1 Các layer

Engine (L0–L5) là **package Python**; client (L6–L7) là **TypeScript**. Hai bên chỉ nói chuyện qua Contract JSON (§10).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ L7 PRESENTATION [TS]                                                         │
│     Web shell · Dashboard · Learn panel · Audio                              │
│     Figure layer (/anatomy, isometric SVG)                                   │
│     Viewer phu: OrbitMap 2D · Three.js (P2) · Ursina cinematic (quay video)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ L6 ENGINE CLIENT [TS]                                                        │
│     1 interface EngineClient, 3 transport: Bundle · Pyodide · HTTP/WS        │
╞══════════════════════════════════════════════════════════════════════════════╡
│ CONTRACT JSON co schema_version:                                             │
│     Catalog · MissionPack · DesignSpec · EvaluationReport · FlightBundle ·   │
│     OpsFrame · Snapshot                                                      │
╞══════════════════════════════════════════════════════════════════════════════╡
│ L5 SESSION [PY]                                                              │
│     FSM pha choi · Clock + time-warp · Event bus · Save/Replay               │
│     Roles + Negotiation Board (P2)                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ L4 RULES & MODES [PY]                                                        │
│     Constraint · Scoring · Fault map · Explainer · Advisor                   │
│     Mission Modes (plugin gameplay) + Mode resolver                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ L3 KERNELS [PY]                                                              │
│     thuan, SI: ascent · guidance · insertion · orbit · relative · attitude   │
│     power · link · data · radiation · decay · cost                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ L2 MISSION PACKS                                                             │
│     *.mission.yaml · ruleset.yaml · mode_resolver.yaml  (du lieu)            │
├──────────────────────────────────────────────────────────────────────────────┤
│ L1 CATALOG                                                                   │
│     catalog.json: chuan hoa, co provenance, co hash                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ L0 DATASET GATEWAY                                                           │
│     adapters · mapping.yaml · units · overrides · Data Doctor                │
└──────────────────────────────────────────────────────────────────────────────┘
   nguon: space_mission_library (xlsx/csv/json/py) · du lieu NASA mo · asset (texture, am thanh)
```

**Quy tắc phụ thuộc:** layer trên được gọi layer dưới, không ngược lại. L3 không biết L4. L4 không biết viewer. Viewer không tính vật lý.

| Vùng | Ngôn ngữ | Chạy ở đâu | Phụ thuộc chính |
|---|---|---|---|
| Engine (L0–L5) | Python ≥ 3.11 | Pyodide Worker, FastAPI, hoặc CLI | `numpy` + stdlib (dataclass) |
| Build-time tools | Python + Node | Máy dev / CI | pandas hoặc openpyxl, PyYAML, kit `/anatomy` |
| Client (L6–L7) | TypeScript | Trình duyệt | Vite, React (vỏ), kit `/anatomy` |
| Viewer phụ | Python (Ursina) hoặc TS (Three.js) | Máy dev / trình duyệt | Đọc `FlightBundle` / `Snapshot` |

### 3.2 Luồng chạy một lượt chơi

```
Player        Web (L7)              EngineClient (L6)        Engine (L0-L5, Python)
  | chon slot -->|                          |                          |
  |              |-- evaluate(design) ----->|-- evaluate() ----------->| constraints, faults, score
  |              |<-- EvaluationReport -----|<-------------------------|
  | [PHONG] ---->|-- fly(design) ---------->|-- fly() ---------------->| K-ASC (+K-INS) -> FlightBundle
  |              |<-- FlightBundle ---------|<-------------------------|
  |              |   replay theo clock; events -> audio / figure / HUD  |
  | [X: tach] -->|-- ops_open() + step() -->|-- OpsSession.step() ---->| K-REL K-ATT K-PWR K-LNK + Mode
  |              |<-- OpsFrame (>= 30 Hz) --|<-------------------------|
  | [KET THUC] ->|-- finish() ------------>|-- score() + explain() -->|
  |              |<-- Debrief --------------|<-------------------------|
```

Ascent không tương tác (vòng hở, có dẫn hướng) nên **precompute một lần rồi replay**. Ops là vòng kín (người chơi xoay vệ tinh, bấm chụp) nên **step theo thời gian**.

### 3.3 Quyết định kiến trúc (ADR)

| ADR | Quyết định | Lý do | Phương án bị loại / khi nào đổi |
|---|---|---|---|
| ADR-1 | Python `mission_engine` là *engine of record* | Vật lý đã kiểm chứng bằng Python; 3 bạn hàng không đọc và sửa được; test bằng pytest | Port toàn bộ sang TS: tốn công, dễ lệch số. Chỉ đổi nếu cả Pyodide lẫn HTTP đều hỏng |
| ADR-2 | Web là kênh giao nộp chính; Ursina giữ làm viewer quay video | Giám khảo cần link mở được ngay; `/anatomy` là web-native; Ursina phải cài local | Giữ Ursina làm chính vẫn được (xem §1) nhưng giám khảo khó chạy |
| ADR-3 | Một `EngineClient`, ba transport (§10.4) | Cùng một code Python; chọn transport theo môi trường | — |
| ADR-4 | Catalog, mission, ruleset là JSON/YAML có schema | Ngày thi chỉ sửa dữ liệu | Cấu hình bằng code Python: nhanh lúc đầu, kẹt khi đổi dataset |
| ADR-5 | Figure Anatomy **bake lúc build**; runtime chỉ ghép slot và animate (§12.3) | Giữ được audit painter's order; không tính hình học trong trình duyệt | Hình học runtime: audit không phủ được mọi tổ hợp |
| ADR-6 | Core chỉ dùng `numpy` + dataclass; `pydantic`/`FastAPI` chỉ ở lớp API | Giữ Pyodide khả thi, ít phụ thuộc | — |
| ADR-7 | Ascent precompute + replay; Ops step theo thời gian | Ascent tất định và rẻ (baseline ≈ 0,1–0,3 s/chuyến khi chạy native) | Tương tác trong ascent: đề không yêu cầu |
| ADR-8 | Gateway chạy lúc build, không chạy trong trình duyệt | Parse xlsx/yaml nặng và dễ lỗi; runtime chỉ nhận `catalog.json` đã biên dịch | — |

### 3.4 Đã lấy gì từ tài liệu 2D/3D của trợ lý khác

Tài liệu đó được xem là **dữ liệu tham khảo**, không phải yêu cầu. Gạn lọc như sau:

| Đề xuất trong tài liệu ngoài | Quyết định | Lý do |
|---|---|---|
| Hybrid 2D + 3D (≈ 70% giao diện kỹ thuật 2D, 30% trực quan hóa 3D) | **Lấy** | Khớp kết luận: UI/budget/dashboard là 2D, phần "vật thể" là figure isometric |
| Physics engine tính, LLM chỉ giải thích; LLM không bịa số | **Lấy nguyên** (nguyên tắc 3 và 8) | Bảo vệ điểm Validity |
| Mức mô phỏng "engineering approximation", công bố giả định và giới hạn | **Lấy** | Chính là cơ chế `provenance` và trang "Nguồn và giả định" |
| Module tách `orbital_mechanics`, `propulsion`, `power_system`, `communication`, `cost_model`, `mission_evaluator` | **Lấy, mở rộng** | Thành bộ kernel ở §6 và rules ở §7 |
| FastAPI + Python simulation; React + TypeScript | **Lấy** | Transport HTTP và vỏ web (§10, §13) |
| Three.js / React Three Fiber làm cảnh 3D chính | **Hoãn (P2)** | `/anatomy` đảm nhiệm hình 3D; Three.js chỉ cần nếu muốn quả địa cầu xoay tự do |
| NSGA-II (pymoo) để tối ưu thiết kế | **Đổi**: Advisor lọc ràng buộc và quét Pareto trước (§7.6); pymoo là P2 | Không gian thiết kế rời rạc, nhỏ (ước tính thô cỡ 10⁶–10⁷ tổ hợp từ số mục trong thư viện) nên lọc có cắt tỉa là đủ |
| PostgreSQL / SQLite | **Bỏ** | Không cần DB; save/replay bằng JSON, lưu cục bộ bằng IndexedDB |
| 4 màn hình (Selection, Designer, Simulation, AI Analysis) | **Mở rộng** thành 8 màn (§11.1) | Thêm Brief, Ops, Debrief, Validity |

---

## 4. L0–L1: Dataset Gateway và Catalog

Đây là phần quyết định ngày thi có "dễ" hay không. Nguyên tắc: **dataset thô không bao giờ được đọc trực tiếp bởi kernel**. Mọi thứ đi qua Gateway và ra thành `catalog.json` chuẩn.

### 4.1 Pipeline

```
 data/raw/            data/mapping/        data/overrides/
 xlsx csv json py     *.map.yaml           *.yaml (+provenance)
      |                    |                     |
      v                    v                     v
 [1 doc] --> [2 anh xa cot -> truong chuan] --> [3 chuan hoa don vi] --> [4 merge overrides]
                                                                              |
                                     +----------------------------------------+
                                     v                                        v
                            [5 DATA DOCTOR]                          [6 phat hanh catalog]
                            schema, tham chieu,                      build/catalog.json
                            khoang vat ly, feasibility               build/reports/*.md
                            -> ERROR / WARN / INFO                   hash = sha256
```

Nhóm tự đo từng bước: bước 1–4 phải chạy dưới vài giây với dataset cỡ thư viện hiện tại (`[?]` chưa đo, ghi vào `validation.md`).

### 4.2 Bảng chuẩn (canonical tables)

Tên trường có hậu tố đơn vị (`_kg`, `_w`, `_musd`, `_deg`…) theo đúng quy ước của `space_mission_library` hiện có. `(lib)` = trường đã thấy trong library; `(new)` = trường đề xuất thêm. **Tên cột thật có thể khác ở dataset ngày thi** — mapping lo phần đó.

| Bảng | Khoá | Trường chính |
|---|---|---|
| `scenarios` | `id` | `name`, `mission_type` (new), `objective_text`, `budget_musd` (lib), `min_science_pts` (lib), `min_mission_life_years` (lib), `deadline_months` (lib), `allowed_orbit_ids` (lib), `learning_goal` (lib) |
| `orbits` | `id` | `name`, `class` (new: LEO, SSO, POLAR, MEO, GTO, GEO), `altitude_km` và `inclination_deg` (lib nếu có, không thì suy từ `id` + bảng default), `eclipse_fraction` (lib), `ground_contact_min_per_day` (lib), `radiation_dose_krad_per_year` (lib), `orbital_lifetime_years_no_reboost` (lib), `lv_payload_factor` (lib), `description_simple` (lib) |
| `instruments` | `id` | `name`, `kind` (new), `tier` (lib), `science_value_pts`, `mass_kg`, `power_operating_w`, `data_generated_gb_per_day`, `pointing_required_deg`, `cost_musd`, `lead_time_months`, `compatible_orbit_ids` (đều lib) |
| `buses` | `id` | `name`, `class`, `max_total_mass_kg`, `dims_m` (new), `cost_musd`, `lead_time_months` |
| `power_arrays`, `batteries` | `id` | `name`, `kind` (body hoặc deployable), `generation_w` hoặc `capacity_wh`, `mass_kg`, `cost_musd` (tên cột thật: tra library) |
| `comms` | `id` | `name`, `band`, `antenna_gain_dbi` (lib), `tx_power_w` (lib), `downlink_mbps`, `pointing_required_deg` (lib), `max_range_km` (lib), `mass_kg`, `power_w`, `cost_musd` |
| `avionics` | `id` | `type` (obc hoặc adcs), `rad_tolerance_krad` (obc), `pointing_accuracy_deg` (adcs), `mass_kg`, `power_w`, `cost_musd` |
| `launch_vehicles` | `id` | `name`, `height_m`, `diameter_m`, `liftoff_mass_kg`, `stage_count`, `propulsion`, `fuel` (lib); `leo_capacity_kg`, `sso_capacity_kg`, `compatible_site_ids`; `stages[]` (xem 4.5, thường nằm ở overrides) |
| `launch_sites` | `id` | `name`, `lat_deg`, `lon_deg` |
| `ground_stations` | `id` | `name`, `lat_deg`, `lon_deg`, `min_elevation_deg`, `bands[]` (đã có 11 trạm trong dự án) |
| `targets` (new) | `id` | `name`, `lat_deg`, `lon_deg`, `kind`, `priority`, `mission_tags[]` (cho imaging và spectral scan) |

Bảng nào dataset không có → lấy từ `data/geo/` hoặc `data/overrides/`. Thiếu hẳn bảng bắt buộc là lỗi D01 (§4.6).

### 4.3 Mapping: cột nguồn → trường chuẩn

Mỗi bảng có một file mapping. Ngày thi, việc chính của người phụ trách Gateway là viết/sửa các file này.

```yaml
# data/mapping/instruments.map.yaml   (tên cột bên dưới là VÍ DỤ minh hoạ)
table: instruments
source: { file: space_mission_library.xlsx, sheet: Instruments }
id: { from: "Instrument ID", expect_prefix: "INS-" }
fields:
  name:                       { from: "Name" }
  tier:                       { from: "Tier" }
  science_value_pts:          { from: "Science Value (pts)" }
  mass_kg:                    { from: "Mass (kg)",            unit: kg }
  power_operating_w:          { from: "Operating Power (W)",  unit: W }
  data_generated_gb_per_day:  { from: "Data (GB/day)",        unit: GB/day }
  pointing_required_deg:      { from: "Pointing (deg)",       unit: deg }
  cost_musd:                  { from: "Cost (M$)",            unit: MUSD }
  lead_time_months:           { from: "Lead Time (mo)" }
  compatible_orbit_ids:       { from: "Compatible Orbits",    split: ";" }
defaults:
  tier: basic          # dùng khi cột trống; Gateway gắn provenance=default
```

**Gợi ý mapping tự động** (`make suggest-map`) — để tiết kiệm giờ ngày thi. Với mỗi trường chuẩn, xếp hạng cột nguồn theo: (a) độ giống tên sau khi bỏ dấu/hoa thường/ký tự lạ; (b) token đơn vị trong header như `(kg)`, `[W]`; (c) kiểu giá trị; (d) khoảng giá trị so với `ranges.yaml`. Kết quả là bản nháp `*.draft.yaml` kèm `# confidence`, **người duyệt rồi mới dùng**.

Hai file phụ cùng thư mục:

- `aliases.yaml`: ánh xạ id lạ về id chuẩn (ví dụ `LEO_400 → ORB-LEO-400`).
- `kind_rules.yaml`: gán `instrument.kind` / `bus.class` từ từ khóa trong tên khi dataset không có cột này.

```yaml
# data/mapping/kind_rules.yaml
instruments:
  - { match: "camera|imager|rgb",            kind: imager_rgb }
  - { match: "multispectral",                kind: imager_multispectral }
  - { match: "hyperspectral|spectromet",     kind: spectrometer }
  - { match: "radar|sar",                    kind: radar_sar }
  - { match: "magnetomet|fluxgate",          kind: magnetometer }
  - { match: "particle|radiation|dosimet",   kind: particle_detector }
  - { match: "telescope|astro",              kind: telescope }
  - { match: ".*",                           kind: generic }   # luôn có fallback
```

### 4.4 Chuẩn hoá đơn vị

Catalog dùng đơn vị kỹ thuật (kg, W, Wh, deg, M$, GB, Mbps); kernel đổi sang SI ở biên.

| Đại lượng | Chuẩn catalog | Alias được đổi tự động | Chú ý |
|---|---|---|---|
| Khối lượng | kg | g, t, lb (×0,45359237) | |
| Chiều dài | m (độ cao quỹ đạo: km) | cm, mm, ft (×0,3048), mi | |
| Công suất / năng lượng | W / Wh | kW, mW, J, kWh | |
| Dữ liệu | GB = 10⁹ byte | MB, TB, bit | Phân biệt GB và GiB; ghi giả định vào report |
| Tốc độ dữ liệu | Mbps = 10⁶ bit/s | kbps, Gbps, MB/s (×8) | |
| Liều bức xạ | krad(Si) | Gy (1 krad = 10 Gy), rad | |
| Góc | deg | rad, arcsec (÷3600), mrad | |
| Chi phí | M$ (triệu USD) | $, k$, B$ | |
| Thời gian | s (nhiệm vụ: tháng, năm) | min, h, day | |

### 4.5 Overrides, provenance và hiệu chỉnh

Library hiện có thiếu những thứ kernel cần (khối lượng nhiên liệu, lực đẩy, Isp từng tầng). Phần bù nằm ở `data/overrides/*.yaml`; mỗi giá trị bù **phải** có nguồn gốc.

| `provenance` | Nghĩa | Hiển thị trong UI |
|---|---|---|
| `library` | Nguyên văn từ dataset | không huy hiệu |
| `public` | Từ tài liệu công khai, có `ref` | huy hiệu P + tooltip nguồn |
| `estimate` | Nhóm tự ước tính, có `reason` | huy hiệu E (hổ phách) |
| `calibrated` | Hiệu chỉnh để khớp library (ballast, `capacity_scale`, `kick_deg`) | huy hiệu C |
| `default` | Gateway tự điền vì thiếu | huy hiệu D + vào danh sách cảnh báo |

```yaml
# data/overrides/launch_vehicles.yaml   (số dưới đây là VÍ DỤ minh hoạ, KHÔNG phải số của library)
LV-EXAMPLE:
  stages:
    - name: stage_1
      engine_type: liquid
      propellant: kerolox
      thrust_n: 7.0e6
      isp_s: 310
      propellant_kg: 400000
      dry_kg: 25000
      _prov: { source: public, ref: "user guide của nhà sản xuất, mục ...", confidence: medium }
  guidance:
    kick_deg: 3.0
    kick_dur_s: 12
    _prov: { source: calibrated, reason: "bisection để apogee 400 km, tools/tune_guidance.py" }
```

**Chính sách sức tải (`capacity_policy`)** — quyết định D1 (§16.3). Library và mô hình vật lý cho hai con số khác nhau (gap G3). Cách xử lý:

```yaml
# missions/ruleset.yaml (trích)
capacity_policy: library   # library | model | min
ballast:
  mode: auto               # tự thêm ballast để mô hình ra đúng quỹ đạo mục tiêu
  label: true              # UI ghi rõ "đã thêm ballast X kg" và gắn provenance=calibrated
```

- `library` (đề xuất mặc định): pass/fail về sức tải theo dataset (bám đề). Chuyến bay vẫn chạy bằng mô hình + ballast; UI hiện **cả hai số** như ở màn chọn v4.
- `model`: pass/fail theo mô hình vật lý.
- `min`: lấy số nhỏ hơn; nghiêm nhất.

**Công cụ build-time cho Gateway:**

- `tools/reconcile_capacity.py`: chạy K-ASC cho từng LV × lớp quỹ đạo, so với sức tải library, ghi `build/reports/capacity.md` (cảnh báo khi tỉ lệ mô hình/library ngoài [0,8; 1,25]).
- `tools/synth_stages.py`: với LV mới thiếu dữ liệu tầng, tổng hợp `stages[]` từ (khối lượng cất cánh, sức tải LEO, số tầng, loại nhiên liệu) và Isp mặc định theo loại. Dải Isp chân không điển hình để làm default `[?]` (kiểm lại với nguồn công khai trước khi dùng): rắn ≈ 260–290 s; kerolox ≈ 310–350 s; methalox ≈ 350–380 s; hydrolox ≈ 430–460 s. Mọi giá trị sinh ra mang `provenance: estimate`.
- `tools/tune_guidance.py`: dò `kick_deg` bằng bisection cho LV mới để lên được quỹ đạo mục tiêu (đã làm thủ công ở phiên gravity turn; cần đóng gói lại `[RE]`).

### 4.6 Data Doctor

Chạy ở cuối `make ingest`; xuất `build/reports/data_doctor.md`; **ERROR chặn build, WARN không chặn**.

| ID | Kiểm tra | Mức |
|---|---|---|
| D01 | Có đủ bảng bắt buộc (scenarios, orbits, instruments, buses, comms, launch_vehicles, launch_sites) | ERROR |
| D02 | Trường bắt buộc có giá trị, đúng kiểu | ERROR |
| D03 | `id` duy nhất và đúng tiền tố (sau khi áp alias) | ERROR |
| D04 | Tham chiếu chéo tồn tại (`allowed_orbit_ids`, `compatible_orbit_ids`, `compatible_site_ids`) | ERROR |
| D05 | Giá trị trong khoảng vật lý hợp lý (`data/ranges.yaml`), gợi ý nghi sai đơn vị | WARN |
| D06 | Âm, NaN hoặc 0 bất thường | ERROR / WARN |
| D07 | Đơn vị suy từ header khác đơn vị khai trong mapping | WARN |
| D08 | Trường tùy chọn thiếu → điền default, gắn `provenance: default` | WARN |
| D09 | Mỗi instrument có ≥ 1 quỹ đạo tương thích; mỗi scenario có ≥ 1 quỹ đạo cho phép | WARN |
| D10 | Mỗi LV có số sức tải cho các lớp quỹ đạo cần dùng | WARN |
| D11 | Đối chiếu sức tải mô hình/library (§4.5) | WARN |
| D12 | **Feasibility**: mỗi scenario có ≥ 1 thiết kế đóng đủ budget (dùng Advisor, §7.6) | WARN hoặc ERROR (cấu hình) |
| D13 | Độ phủ figure: mỗi item catalog có figure bake; thiếu → dùng generic | INFO |
| D14 | Hash ổn định: build hai lần cho cùng `catalog_hash` | ERROR |

D12 là kiểm tra đáng giá nhất cho ngày thi: nó báo ngay "mission này không có lời giải với dữ liệu hiện tại" trước khi giám khảo gặp.

Ví dụ báo cáo (minh hoạ định dạng):

```
DATA DOCTOR   catalog 7f3a91c2   nguon: space_mission_library.xlsx
ERROR 0   WARN 3   INFO 12
WARN  D05 instruments.INS-09  pointing_required_deg = 0.001  ngoai dai thuong gap, nghi don vi?
WARN  D08 launch_vehicles.LV-X  thieu stages[].isp_s -> default theo propellant (provenance=default)
WARN  D11 launch_vehicles.LV-Y  ty le model/library = 1.48  -> xem tools/reconcile_capacity.py
FEAS  SC-01 OK (3 thiet ke)   SC-04 OK (1)   SC-0X KHONG co thiet ke kha thi -> xem advisor
```

### 4.7 Lệnh và đầu ra

| Lệnh | Việc | Đầu ra |
|---|---|---|
| `make suggest-map` | Gợi ý mapping từ file thô | `data/mapping/*.draft.yaml` |
| `make ingest` | Đọc → ánh xạ → chuẩn hoá → merge overrides → Data Doctor | `build/catalog.json`, `build/reports/data_doctor.md`, `build/reports/provenance.md` |
| `make packs` | Biên dịch và validate mission pack với catalog mới | `build/missions/*.json`, `build/reports/packs.md` |
| `make bundles` | Precompute `FlightBundle` và `EvaluationReport` cho preset | `build/bundles/` |
| `make figures` | Bake figure cho mọi item catalog (§12.3) | `build/figures/`, `build/reports/figures.md` |
| `make validate` | Toàn bộ test + validation | `build/reports/validation.md` |

### 4.8 Độ bền và an toàn

- **Không `import` file `.py` lạ.** Với `space_mission_library.py`, đọc hằng số bằng `ast.literal_eval` trên cây cú pháp; chỉ cho phép literal (dict, list, số, chuỗi).
- YAML dùng `safe_load`. Giới hạn kích thước file đầu vào. Không gọi mạng trong Gateway và trong engine.
- Hash catalog tính trên JSON chuẩn hoá (khoá sắp xếp, số định dạng cố định) để cùng dữ liệu cho cùng hash.
- Lỗi parse không làm chết cả bảng: bỏ dòng hỏng, ghi vào report với số dòng gốc, tiếp tục.
- Giữ `data/raw/` bất biến: mọi chỉnh sửa tay đi qua `mapping/` hoặc `overrides/` để truy vết được.

### 4.9 Chuẩn hóa 5 nhóm dữ liệu NASA Mission Data Schemas

Để tránh hardcode nhiệm vụ vào source code và đảm bảo tiếp nhận mọi challenge dataset trong tương lai, hệ thống chuẩn hóa toàn bộ dữ liệu thành 5 nhóm schema có phiên bản (`schema_version`):

```
                       NASA RAW DATA / CHALLENGE PACKS
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    NASA Mission Data Schemas   │
                      └───────┬───────────────┬───────┘
                              │               │
       ┌──────────────────────┼───────────────┼──────────────────────┐
       ▼                      ▼               ▼                      ▼
1. Mission Def        2. Components    3. Celestial/Physics   4. Constraints/Events
(Mục tiêu khoa học,   (Linh kiện bus,  (Trọng trường, bán     (9 budgets, sự cố,
 destination, quỹ đạo) payload, power) kính, ephemeris)       timeline bay)
```

#### 1. Mission Definition Schema (`missions/*.mission.yaml`)
Định nghĩa mục tiêu khoa học, đối tượng khảo sát, yêu cầu payload và tiêu chí thành công theo chuẩn NASA Science Mission:
```yaml
schema: mission-def/1
mission_id: "mars_surface_001"
name: "Mars Geologic & Hydrology Survey"
difficulty: "hard"
science_theme: "planetary_science"          # earth_science | planetary_science | astrophysics | heliophysics
destination:
  body_id: "BODY-MARS"
  orbit_class: "AREO"                       # Low Mars Orbit (LMO) / Areostationary
  target_altitude_km: 400
  target_inclination_deg: 93.0              # Sun-synchronous Mars
objective:
  statement: "Khảo sát bề mặt Sao Hỏa để xác định khoáng vật ngậm nước và trầm tích cổ."
  min_science_pts: 45
  expected_findings: ["hydrated_silicates", "ancient_riverbed_strata"]
requirements:
  payload: ["spectrometer", "imager_multispectral"]
  pointing_accuracy_deg: 0.05
  min_downlink_gb_per_day: 12.0
  min_lifetime_years: 2.0
constraints:
  max_mass_kg: 850
  max_cost_musd: 450
  max_lead_time_months: 48
```

#### 2. Spacecraft Components Schema (Chuẩn CubeSat 101 Subsystems)
Mỗi component thuộc một subsystem chuẩn trong tài liệu NASA CubeSat 101: Structure, Power, Comms, Attitude Control, Propulsion, On-board Computer, Payload:
```yaml
schema: component/1
component_id: "INS-HYPER-02"
name: "Miniaturized Hyperspectral Surface Imager"
category: "payload"                         # payload | power | comms | adcs | obc | propulsion | bus
subsystem: "scientific_payload"
heritage: "TRL-7"                           # Technology Readiness Level (1-9)
mass_kg: 8.5
power_operating_w: 32.0
power_standby_w: 4.0
data_generated_gb_per_day: 15.0
pointing_required_deg: 0.02
cost_musd: 14.5
lead_time_months: 18
dimensions_m: [0.2, 0.1, 0.1]               # 2U form factor
fov_deg: [12.0, 12.0]
spectral_bands_nm: [400, 1000]
provenance: { source: "public", ref: "NASA Small Spacecraft Technology State of the Art 2023" }
```

#### 3. Physics & Celestial Parameters Schema (`data/geo/celestial_bodies.yaml`)
Tham số hấp dẫn, hình học và khí quyển của các thiên thể phục vụ mô phỏng quỹ đạo và hạ cánh:
```yaml
schema: celestial-body/1
body_id: "BODY-MARS"
name: "Mars"
gm_m3_s2: 4.282837e13                      # Gravitational parameter mu = GM
radius_equatorial_km: 3396.2
radius_polar_km: 3376.2
mass_kg: 6.4171e23
rotation_period_s: 88642.66                # 1 sol
j2_perturbation: 1.96045e-3
atmosphere:
  has_atmosphere: true
  surface_density_kg_m3: 0.020
  scale_height_km: 11.1
  surface_pressure_pa: 610.0
ephemeris_source: "JPL_HORIZONS_DE440"
```

#### 4. Mission Constraints & Engineering Rules Schema
Tham số cho 9 budget kỹ thuật và các quy tắc trade-off (MDL), xem chi tiết tại `ruleset.yaml` (§7).

#### 5. Mission Events & Timeline Schema (`FlightBundle.events`)
Lịch trình diễn tiến sự kiện sau phóng từ Liftoff đến Scientific Operation:
```json
{
  "mission_id": "mars_survey_001",
  "timeline": [
    { "event_id": "T00", "t_sec": 0, "name": "LIFTOFF", "type": "launch" },
    { "event_id": "T01", "t_sec": 165, "name": "MECO_STAGE1_SEP", "type": "staging" },
    { "event_id": "T02", "t_sec": 540, "name": "PARKING_ORBIT_INSERTION", "type": "insertion" },
    { "event_id": "T03", "t_sec": 3600, "name": "TRANS_MARS_INJECTION_TMI", "type": "maneuver", "dv_ms": 3600.0 },
    { "event_id": "T04", "t_sec": 17280000, "name": "MARS_ORBIT_INSERTION_MOI", "type": "maneuver", "dv_ms": 1100.0 },
    { "event_id": "T05", "t_sec": 17366400, "name": "SOLAR_ARRAY_DEPLOY", "type": "mechanism" },
    { "event_id": "T06", "t_sec": 17452800, "name": "SCIENCE_OPS_PHASE_START", "type": "science" }
  ]
}
```

### 4.10 Tích hợp Ephemeris và Dữ liệu Khoa học Mở (SPICE / Horizons / PDS)

Để đảm bảo tính khoa học chân thực (*Validity*), engine hỗ trợ tích hợp với các nguồn dữ liệu vũ trụ uy tín:

1. **NAIF SPICE (NASA's Observation Geometry System)**:
   - Cung cấp định vị thiên thể (SPK kernels), hướng trục quay (PCK kernels), khung tọa độ thiết bị (IK/FK kernels).
   - Ở bản web client: Sử dụng dữ liệu ép phẳng (baked ephemeris table) nội suy Chebyshev hoặc spline.
   - Ở môi trường Python backend: Hỗ trợ `SpiceyPy` để tính toán chính xác vector vị trí $r(t)$ và vận tốc $v(t)$ theo thời gian thực.
2. **JPL Horizons API**:
   - Sử dụng để truy vấn tọa độ thiên thể theo mốc thời gian thực (Epoch J2000), đồng bộ quỹ đạo Trái Đất – Mặt Trăng – Sao Hỏa. Dữ liệu được fetch ở bước build (`tools/fetch_horizons.py`) và lưu vào `data/geo/ephemeris_cache.json`.
3. **NASA Planetary Data System (PDS) & Solar System Exploration**:
   - Nguồn cung cấp đặc tính quang phổ bề mặt, suất phản chiếu (albedo), bản đồ số độ cao (DEM/MOLA cho Mars, LOLA cho Moon) dùng làm texture và độ dốc địa hình cho viewer 3D.

### 4.11 Pipeline xử lý dữ liệu tự động từ tài liệu NASA

Khi ban tổ chức cung cấp tài liệu dạng PDF hoặc Excel ngày thi:
- **PyMuPDF (`fitz`)**: Đọc trích xuất text và metadata từ PDF kỹ thuật.
- **Camelot / Tabula**: Tự động parse bảng biểu thông số kỹ thuật (mass, power, specific impulse, frequencies).
- **Pydantic Data Models**: Validate kiểu dữ liệu, bắt buộc đơn vị SI, kiểm tra khoảng hợp lý trước khi nạp vào Catalog.
- **Data Doctor**: Chạy tự động ở cuối bước `make ingest` để đảm bảo 0 lỗi nghiêm trọng.

---

## 5. L2: Mission Pack

### 5.1 Ý tưởng

**Mission = scenario trong catalog (kế thừa) + override + cấu hình gameplay + preset.** Pack là file YAML trong `missions/`, được biên dịch thành `build/missions/*.json` và validate với catalog. Đổi mission = sửa YAML, không sửa code.

Hai file dùng chung cho mọi pack:

- `missions/ruleset.yaml`: trọng số điểm mặc định, `capacity_policy`, hồ sơ độ khó (`gentle`/`standard`/`harsh`), ngưỡng LOCK/MARGINAL, dải điểm xếp hạng.
- `missions/mode_resolver.yaml`: luật chọn mode (§5.4).

### 5.2 Schema

Khung dưới đây là YAML hợp lệ; trường nào không cần thì bỏ. Chuỗi bắt đầu bằng `@` luôn đặt trong dấu nháy.

```yaml
schema: mission-pack/1
id: MP-EXAMPLE
extends: { table: scenarios, id: SC-01 }        # kế thừa mọi trường của scenario trong catalog (tùy chọn)

meta:
  title: { vi: "Tiêu đề", en: "Title" }
  brief: { vi: "Đề bài cho người chơi", en: "Player brief" }
  learning_goals: [ "delta-v", "radiation hardening" ]
  difficulty: 2                                 # 1..5
  est_play_min: 8

objective:
  statement: { vi: "Mục tiêu nhiệm vụ", en: "Mission objective" }
  success:                                      # tiêu chí thắng, máy đọc được
    - { metric: science_delivered_pts, op: ">=", value: "@scenario.min_science_pts" }

design_space:
  allow:                                        # lọc lựa chọn hiển thị ở Design Desk
    orbits: "@scenario.allowed_orbit_ids"
    instruments: { tier: [ basic ] }            # lọc theo thuộc tính
    buses: "*"
  force: { }                                    # khoá một số slot (dùng cho tutorial)

constraints:                                    # mặc định là 10 constraint chuẩn (§7.2); ghi đè hoặc thêm ở đây
  - { id: cost,      limit: "@scenario.budget_musd" }
  - { id: radiation, margin_factor: 1.5, critical: true }   # "nút thắt" của mission này (R8)
  - id: data_headroom                           # constraint tự thêm, không cần code
    metric: data.downlink_gb_per_day
    op: ">="
    value: "@design.data.generated_gb_per_day * 1.1"
    why: { vi: "Hạ dữ liệu phải lớn hơn lượng sinh ra", en: "Downlink must exceed data generated" }

scoring: { science: 0.4, efficiency: 0.2, margin: 0.2, decisions: 0.2 }   # tổng = 1

gameplay:
  mode: auto                                    # auto | imaging | downlink | space_weather | spectral_scan | ...
  overlays: [ ]                                 # lớp thêm: orbit_keeping ...
  params: { }                                   # tham số riêng của mode

hazards:
  profile: standard                             # gentle | standard | harsh
  seed: 42
  force: [ ]                                    # ép bật sự cố để demo, ví dụ [ seu, decay ]

roles: { enabled: false }                       # xem §9.5

narrative:
  briefing: { vi: "Lời dẫn đầu nhiệm vụ", en: "Briefing" }
  debrief:
    pass: { vi: "Nhiệm vụ thành công vì ...", en: "Mission success because ..." }
    fail: { vi: "Nhiệm vụ trượt vì ...", en: "Mission failed because ..." }

presets:                                        # thiết kế mẫu: vừa để demo, vừa là test CI
  - id: good
    design: { }                                 # DesignSpec đầy đủ, xem ví dụ 5.5
    expect: pass
  - id: fail_data
    from: good
    swap: { comm: COM-UHF }
    expect: "fail:data"
```

### 5.3 Biểu thức tham chiếu

Giá trị có thể là số hoặc biểu thức bắt đầu bằng `@`:

- Tham chiếu: `@scenario.<trường>`, `@orbit.<trường>`, `@design.<đường dẫn>`, `@catalog.<bảng>.<id>.<trường>`.
- Phép tính: `+ - * /`, `min(...)`, `max(...)`.
- **Không dùng `eval`.** Parser duyệt cây AST với danh sách trắng (số, tên có dấu chấm, phép tính cơ bản, hai hàm trên). Sai cú pháp → lỗi rõ ràng ở `make packs`.

### 5.4 Chọn mode gameplay (`mode_resolver.yaml`)

Luật đọc từ trên xuống, **luật đầu tiên khớp thì thắng**. Trong một `when`, mọi khóa phải khớp (AND); giá trị dạng danh sách nghĩa là "một trong". Luật theo `instrument.kind` đứng **trước** luật theo quỹ đạo để sửa gap G4.

```yaml
# missions/mode_resolver.yaml
rules:
  - when: { "mission.gameplay.mode": { not: auto } }     # pack chỉ định rõ thì dùng
    use: "@mission.gameplay.mode"
  - when: { "design.instrument.kind": [ particle_detector, magnetometer ] }
    use: space_weather
  - when: { "design.instrument.kind": [ spectrometer ] }   # [NEW] Greenhouse Gas Monitor
    use: spectral_scan
  - when: { "design.instrument.kind": [ radar_sar ] }      # [NEW]
    use: radar_swath
  - when: { "design.instrument.kind": [ telescope ] }      # [NEW]
    use: stare
  - when: { "orbit.class": [ MEO, GTO ] }                  # [RE] luật v6 theo quỹ đạo
    use: space_weather
  - when: { "orbit.class": [ POLAR, GEO ] }
    use: downlink
  - when: { "orbit.id": [ ORB-LEO-500 ] }
    use: downlink
default: imaging
overlays:                                                  # lớp phủ, không thay mode chính
  - when: { "metrics.orbit_lifetime_years": { lt: "@mission.life_years" } }
    add: orbit_keeping
```

Mode chưa có code (`spectral_scan`, `radar_swath`, `stare`) thì resolver **rơi về `imaging`** và ghi cảnh báo trong report; game vẫn chạy. Cách viết mode mới: §8.

### 5.5 Ví dụ 1 — SC-01 First Eyes on Earth

Số liệu ghi trong comment là baseline từ phiên trước. Thiết kế "good" đóng đủ 9/9 budget (điểm 78); UHF làm trượt budget Dữ liệu vì tốc độ hạ chỉ cỡ 0,0096 Mbps so với 0,4 GB ảnh mỗi ngày.

```yaml
schema: mission-pack/1
id: MP-SC01-FIRST-EYES
extends: { table: scenarios, id: SC-01 }   # library: ngân sách 12 M$, tối thiểu 10 điểm KH, tuổi thọ 1 năm, hạn 18 tháng
meta:
  title: { vi: "Đôi mắt đầu tiên nhìn Trái Đất", en: "First Eyes on Earth" }
  difficulty: 1
gameplay: { mode: auto }                   # LEO-400 + imager_rgb → imaging
presets:
  - id: good
    expect: pass
    design:
      orbit: ORB-LEO-400
      instruments: [ INS-01 ]              # Compact RGB Camera
      bus: BUS-3U
      power: PWR-SA-DEP                    # Deployable Solar Panels (6U-12U)
      battery: BAT-S                       # Small Li-ion Battery (40 Wh)
      comm: COM-S-CUBE                     # S-band CubeSat Transmitter
      obc: OBC-CUBE
      adcs: ADCS-WHEEL
      launch: { vehicle: LV-ELECTRON, site: SITE-MAHIA }
  - id: fail_data
    from: good
    swap: { comm: COM-UHF }
    expect: "fail:data"
```

### 5.6 Ví dụ 2 — SC-04 Greenhouse Gas Monitor với mode mới

Đây là trường hợp gap G4: bộ chọn cũ chỉ nhìn quỹ đạo nên chơi thành "chụp ảnh". Pack chỉ định `spectral_scan` (dừng trên vùng mục tiêu đủ lâu trong khi sai số hướng nhỏ hơn dung sai, thay vì bấm chụp một khoảnh khắc).

Baseline thiết kế "good" (đã kiểm bằng code ở phiên trước): chi phí 161,5/300 M$; điện sinh 1202 W so với tải 116 W; hạ 350 GB/ngày so với sinh 40 GB/ngày; ADCS 0,001° so với yêu cầu 0,05°; bức xạ chịu 50 krad so với tích lũy 15 krad/5 năm; khối lượng khô ≈ 217,5 kg so với năng lực Vega-C lên SSO ≈ 2300 kg.

```yaml
schema: mission-pack/1
id: MP-SC04-GHG
extends: { table: scenarios, id: SC-04 }
meta:
  title: { vi: "Giám sát khí nhà kính", en: "Greenhouse Gas Monitor" }
  difficulty: 4
gameplay:
  mode: spectral_scan                      # [NEW] ghi đè resolver
  params: { target_set: ghg_hotspots, dwell_s: 20, sun_elevation_min_deg: 25 }
constraints:
  - { id: power, critical: true }          # Hyperspectral Imager rất ngốn điện
presets:
  - id: good
    expect: pass
    design:
      orbit: ORB-SSO-600
      instruments: [ INS-04 ]              # Hyperspectral Imager
      bus: BUS-ESPA
      power: PWR-SA-LARGE                  # Large LEO Solar Array (2.5 kW)
      battery: BAT-L                       # Large Li-ion Battery (1 kWh)
      comm: COM-OPT-LEO                    # Optical (Laser) Terminal
      obc: OBC-SPACE
      adcs: ADCS-FINE
      launch: { vehicle: LV-VEGAC, site: SITE-KOUROU }
```

### 5.7 Preset là test

Mỗi preset có `expect`: `pass`, `fail:<constraint_id>` hoặc `fault:<fault_id>`. `make packs` chạy `evaluate()` cho mọi preset và **báo lỗi nếu kết quả khác kỳ vọng**. Nhờ vậy:

- Đổi dataset mà làm vỡ mission thì biết ngay (preset "good" không còn pass).
- Preset thất bại có chủ đích (`fail:data`, `fault:brownout`) là kịch bản dạy học: "chọn sai thì thấy hậu quả gì".
- Menu "Tải cấu hình demo" trong UI lấy thẳng từ danh sách preset.

### 5.8 Tạo mission mới trong ngày thi (mục tiêu ≤ 30 phút)

1. Copy `missions/_template.mission.yaml`; đặt `id` và `extends`.
2. Điền `meta`, `objective`, `narrative` (vi/en).
3. Chọn `gameplay.mode` hoặc để `auto`; điền `params` nếu mode cần (tập mục tiêu nằm ở `data/geo/targets/<tên>.yaml`).
4. Đánh dấu `critical: true` cho tài nguyên nút thắt của mission (R8).
5. Viết ≥ 2 preset: một `good` và một `fail:<constraint>` (dùng `from` + `swap` cho nhanh).
6. `make packs`, sửa đến khi sạch, rồi mở web thử.

Tùy chọn P2: màn **Mission Builder** trong web — form sinh từ JSON Schema của pack, xuất ra `*.mission.yaml`. Dùng cho phần "Creativity" khi giám khảo muốn thử tự chỉnh mission.

---

## 6. L3: Simulation Kernels

Kernel là phần **không đổi trong ngày thi**. Đây là nơi vật lý đã kiểm chứng nằm; mọi thứ khác gọi vào đây.

### 6.1 Quy ước kernel

- **Hàm thuần**: `f(params, state, dt) → (state', outputs)`. Không I/O, không biến toàn cục, không random nếu không truyền `seed`.
- **SI nội bộ**, góc dùng radian; đổi đơn vị ở biên (Gateway và API).
- **Ký hiệu theo sách** (Cornelisse, Anderson): `V`, `γ`, `Isp`, `g0`, `μ`, `Λ`… Mỗi phương trình viết trên **một dòng**. Hàm ngắn, hạn chế hàm nâng cao (đúng sở thích code của nhóm).
- Mỗi kernel có `MANIFEST` (phương trình, giả định, dải hiệu lực, tài liệu, test). Script `tools/export_manifests.py` gom lại thành trang **Validity** (§11.1, S7).
- Mỗi kernel có `selftest()` và test pytest với kết quả tham chiếu giải tích hoặc trong sách.
- Kernel không import UI, viewer hay Gateway.

Khung mẫu (đã chạy thử khi viết tài liệu: `dt = 5 s`, một vòng LEO 400 km → `|Δr| ≲ 2,2·10⁻⁴ m`, `|ΔE/E| ≈ 10⁻¹²`):

```python
# engine/kernels/orbit.py   (comment tieng Viet khong dau theo quy uoc)
"""K-ORB: chuyen dong 2 vat bang RK4"""
import numpy as np

MANIFEST = {
    "id": "K-ORB",
    "equations": ["r'' = -mu*r/|r|^3", "E = 0.5*V^2 - mu/r", "T = 2*pi*sqrt(a^3/mu)"],
    "assumptions": ["2 vat, Trai Dat cau", "khong J2, khong drag (drag nam o K-DEC)"],
    "valid_range": "LEO den GEO, buoc con dt <= 5 s",
    "refs": ["Anderson, Introduction to Flight, chuong Astronautics (eq 8.57, 8.58)"],
    "tests": ["circular_closure", "vis_viva", "energy_drift", "period_vs_kepler"],
}
MU = 3.986004418e14                                   # m^3/s^2

def accel(r, mu=MU):  return -mu*r/np.linalg.norm(r)**3

def step_rk4(r, v, dt, mu=MU):
    k1r = v;              k1v = accel(r, mu)
    k2r = v+0.5*dt*k1v;   k2v = accel(r+0.5*dt*k1r, mu)
    k3r = v+0.5*dt*k2v;   k3v = accel(r+0.5*dt*k2r, mu)
    k4r = v+dt*k3v;       k4v = accel(r+dt*k3r, mu)
    return r+dt/6*(k1r+2*k2r+2*k3r+k4r), v+dt/6*(k1v+2*k2v+2*k3v+k4v)
```

### 6.2 Danh mục kernel

| ID | Chức năng | Phương trình / phương pháp | Trạng thái | Code hiện có |
|---|---|---|---|---|
| K-ASC | Ascent N tầng trong hệ quán tính có Trái Đất quay; booster song song + tầng nối tiếp; tách tầng, fairing | `r'' = −μ·r/\|r\|³ + (F·û − D·v̂rel)/m`; `vrel = v − ω×r`; `F = ṁ·g0·Isp(p)`; `D = ½·ρ·Vrel²·S·CD(M)`; ISA; RK4 | `[OK]` 8 LV | `rocket_orbit_multi.py`, `rocket_orbit_realtime.py`, `rocket_stages.py` |
| K-GDN | Dẫn hướng: dựng đứng → pitch-kick (`kick_deg`, `kick_dur`) → gravity turn (lực đẩy ∥ vrel, α = 0) → bàn giao ≈ 55 km → vòng kín tầng trên tới apoapsis → tròn hoá | `dγ/dt = (V/r − g/V)·cosγ` (dạng tham chiếu 2D đã dùng để kiểm chứng) | `[OK]` | `rocket_orbit_multi.py` + `GUIDE` trong `rocket_catalog.py` |
| K-INS | Orbit insertion planner: đưa lên **quỹ đạo mục tiêu** (G1, G2) | Hohmann, đổi mặt phẳng, vis-viva (§6.3) | `[NEW]` P1 | — |
| K-DV | Sổ Δv và bóc tách tổn hao | `v_burnout = Δv_ideal − L_g − L_d − L_s + v_rot`; `Δv = Isp·g0·ln(M0/Mf)` | `[OK]` | `dv_budget.py` |
| K-ORB | Hai vật; Kepler và vis-viva để đối chiếu | khung §6.1 | `[OK]` | `rocket_orbit_realtime.py` |
| K-REL | Chuyển động tương đối sau tách (lò xo ≈ 1 m/s) | Clohessy–Wiltshire | `[OK]` | `sat_ops.py` |
| K-ATT | Tư thế 3-DOF; xung RCS; `RATE NULL`, `NADIR`, `TRACK` | `q̇ = ½·q⊗ω`; `I·ω̇ = τ − ω×(I·ω)`; `Δω = τ·t/I`; RK4 | `[OK]` | `sat_ops.py` |
| K-PWR | Phát điện, eclipse, pin | `Pgen = A·η·cosθsun` (0 khi eclipse); SoC theo năng lượng; SADA bám Mặt Trời | `[OK]` | `sat_ops.py`, `mission_design.py` |
| K-LNK | Link budget; AOS/LOS với 11 trạm | FSPL, EIRP, G/T, suy hao lệch hướng; `margin = Eb/N0 − yêu cầu` | `[OK]` | `sat_ops.py` |
| K-DATA | Bộ đệm dữ liệu: sinh ra, hạ xuống, tràn | `dBuf/dt = gen − rate·1[in window]` | `[RE]` | `mission_design.py`, `mission_ops2.py` |
| K-RAD | Tích lũy liều, SEU, reset | `dose = krad/năm × năm`; so với `rad_tolerance_krad`; SEU theo tốc độ + `seed` | `[RE]` | `fault_fx.py` |
| K-DEC | Suy giảm quỹ đạo, tuổi thọ, reboost | tốc độ tụt theo độ cao; reboost trừ nhiên liệu | `[RE]` (hiện chỉ là biến HUD, G7) | `mission_ops2.py` |
| K-COST | Chi phí và tiến độ | `Σ cost_musd`; `max lead_time_months` | `[OK]` | `mission_design.py` |
| K-THM | Nhiệt (ước lượng cho dashboard) | `T·(1 + 0,2·M²)` từ nhiệt độ tĩnh của dòng khí | `[?]` chỉ để hiển thị, chưa hiệu chỉnh | `rocket_dashboard.py` |

Baseline kiểm chứng của các kernel `[OK]` nằm ở §14.

### 6.3 K-INS — chọn quỹ đạo có ý nghĩa vật lý (mới, P1)

Gap G1/G2: hiện quỹ đạo ở Design Desk không đổi chuyến bay. K-INS sửa điều đó mà **không viết lại ascent**.

| Quỹ đạo mục tiêu | Cách làm | Mức |
|---|---|---|
| LEO, SSO, POLAR | K-ASC bay thật tới quỹ đạo đỗ; hướng phóng β chọn từ độ nghiêng mục tiêu | Thật |
| MEO, GTO, GEO | K-ASC tới quỹ đạo đỗ LEO, rồi chuỗi đốt tầng trên (khởi động lại) tính bằng công thức giải tích, kiểm chứng bằng K-ORB | Giải tích (ghi rõ trong UI) |

Công thức (mỗi dòng một phương trình):

```
cos(i) = cos(lat)·sin(β)                       # độ nghiêng đạt được từ vĩ độ bãi và hướng phóng; yêu cầu i >= |lat|
v_rot  = ωE·RE·cos(lat)·sin(β)                 # lợi từ quay Trái Đất (≈ 409 m/s ở 28,5°N, hướng Đông)
cos(i_SSO) = −(a/12352 km)^(7/2)               # quỹ đạo tròn; 600 km → i ≈ 97,79°
Δv1 = sqrt(μ/r1)·( sqrt(2·r2/(r1+r2)) − 1 )    # Hohmann: đốt nâng apogee
Δv2 = sqrt(μ/r2)·( 1 − sqrt(2·r1/(r1+r2)) )    # Hohmann: tròn hoá
Δv_pc = 2·V·sin(Δi/2)                          # đổi mặt phẳng (gộp ở apogee nếu cần)
Δv_avail = Isp·g0·ln(m0/mf)                    # Tsiolkovsky cho tầng trên → so với Δv cần
```

Kiểm tra nhanh khi viết tài liệu: Hohmann từ LEO 400 km lên GEO cho `Δv1 ≈ 2397 m/s`, `Δv2 ≈ 1456 m/s` (tổng ≈ 3854 m/s, chưa tính đổi mặt phẳng). Nếu `Δv_avail < Δv_cần` → `NO_GO` kèm lượng thiếu (giá trị giáo dục: "vì sao GEO cần tầng trên mạnh hơn").

Giới hạn đã biết: mô hình 2D trong mặt phẳng; độ nghiêng chỉ tác động qua năng lượng và hình học hiển thị, chưa mô phỏng lệch ngoài mặt phẳng khi bay lên. Ghi vào trang "Nguồn và giả định".

### 6.4 Bản đồ tái sử dụng code cũ (legacy → engine)

Tên file lấy từ lịch sử dự án — **đối chiếu lại với thư mục thật**. Nguyên tắc: `legacy/` giữ nguyên để tham chiếu, **không import**; chép logic sang package mới rồi chạy lại bộ test baseline để chứng minh số không đổi.

| File cũ | Việc | Đích |
|---|---|---|
| `07-11-2026-rocket_orbit_multi.py` | Tách ascent và guidance; bỏ tham chiếu UI | `engine/kernels/ascent.py`, `guidance.py` |
| `07-11-2026-rocket_catalog.py` | Dữ liệu 8 LV, `GUIDE`, `COMMS` → dữ liệu | `data/overrides/launch_vehicles.yaml`, `data/overrides/guidance.yaml`; `COMMS` thuộc dataset |
| `07-11-2026-plan_table.py` | Bảng kế hoạch bay viết tay → sinh tự động | `tools/build_bundles.py` |
| `07-11-2026-dv_budget.py` | Giữ nguyên logic | `engine/kernels/dv_budget.py` |
| `06-11-2026-rocket_orbit_realtime.py`, `06-11-2026-rocket_stages.py` | Gộp vào K-ORB và K-ASC | `engine/kernels/orbit.py`, `ascent.py` |
| `08-11-2026-sat_ops.py` | Tách làm bốn | `relative.py`, `attitude.py`, `power.py`, `link.py` + `data/geo/ground_stations.yaml` |
| `08-11-2026-mission_design.py` | Tách luật và điểm | `engine/rules/constraints.py`, `scoring.py` |
| `08-11-2026-fault_fx.py` | Tách logic sự cố khỏi hiệu ứng | logic → `engine/rules/faults.py`; hình/âm → viewer (`fx_cues.yaml`) |
| `08-11-2026-mission_ops.py`, `mission_ops2.py` | Mỗi mode một file; resolver thành dữ liệu | `engine/modes/*.py` + `missions/mode_resolver.yaml` |
| `08-11-2026-mission_flow.py` | Máy trạng thái phiên | `engine/session/fsm.py` |
| `06-11-2026-rocket_audio.py`, `08-11-2026-fault_audio.py` | Đổi thành bước build sinh asset | `tools/synth_audio.py` → `web/public/audio/` + `audio_cues.yaml` |
| `08-11-2026-satellite_models.py`, `06-11-2026-rocket_models.py`, `06-11-2026-rocket_gfx.py` | Chỉ còn phục vụ Ursina; bản web dùng Part Kit Anatomy | `viewers/ursina/` |
| `07-11-2026-rocket_dashboard.py`, `rocket_select.py`, `08-11-2026-mission_design_ui.py`, `imaging_ops.py`, `rocket_game_ursina_v6.py` | Phần UI/viewer; logic đã chuyển sang engine | `viewers/ursina/` (mỏng, gọi `mission_engine`) |
| `07-11-2026-launch_sites_m2.py` | Lấy vĩ/kinh độ ra dữ liệu; cảnh quan giữ ở Ursina | `data/geo/launch_sites.yaml` + `viewers/ursina/` |
| `space_mission_library.py` + file Excel | Dữ liệu đầu vào | `data/raw/` |

### 6.5 Thêm một kernel mới (checklist)

1. Tạo `engine/kernels/<tên>.py` với `MANIFEST`, hàm thuần, `selftest()`.
2. Đăng ký trong `kernels/__init__.py`; khai báo các khoá metric nó sinh ra trong `MetricSet`.
3. Nếu có ràng buộc đi kèm: thêm `Constraint` mặc định ở `rules/` (§7.2), kèm `drivers` và `why`.
4. Viết test tham chiếu (giải tích hoặc trong sách) trong `tests/kernels/`.
5. Chạy `make validate`; số baseline cũ không được đổi.

### 6.6 Kiến trúc mô phỏng quỹ đạo 2 cấp độ & GMAT Simulation Adapter

Nhằm cân bằng giữa tính mượt mà (real-time responsiveness) của một trò chơi và độ chính xác kỹ thuật chuẩn NASA (*Technical Validity*), engine hỗ trợ kiến trúc mô phỏng quỹ đạo hai cấp độ:

```
                          DESIGN SPEC & MISSION PARAMS
                                       │
                                       ▼
                     ┌──────────────────────────────────┐
                     │    Simulation Router / Engine    │
                     └─────────┬───────────────┬────────┘
                               │               │
                 Mặc định / Real-time          │ Yêu cầu High-Fidelity / Offline
                               │               │
                               ▼               ▼
                     ┌──────────────────┐ ┌───────────────────────────┐
                     │  LEVEL 1 ENGINE  │ │      LEVEL 2: GMAT        │
                     │  (Python Pure)   │ │  Headless Adapter (.py)   │
                     │  - RK4 Two-body  │ ├───────────────────────────┤
                     │  - Kepler / CW   │ │ - Sinh .script từ template│
                     │  - Hohmann       │ │ - GMAT CLI execution      │
                     │  - Point mass    │ │ - Parse ephemeris / orbit │
                     └─────────┬────────┘ └─────────────┬─────────────┘
                               │                        │
                               └───────────┬────────────┘
                                           ▼
                                 FlightBundle / Snapshot
                                 (Chuẩn hóa schema chung)
```

#### Level 1: Simplified Physics Engine (Ưu tiên P0, chạy nội tuyến)
- **Mô hình**: Bài toán hai vật (two-body problem) sử dụng tích phân số RK4, định luật Kepler, phương trình vis-viva, chuyển tiếp quỹ đạo Hohmann và phương trình Clohessy-Wiltshire (CW) cho tiếp cận tương đối.
- **Môi trường**: 100% Python thuần (`numpy`), chạy cực nhanh (≤ 50 ms cho một quỹ đạo hoàn chỉnh, ≤ 300 ms cho ascent), tương thích hoàn hảo cả trên Pyodide Web Worker và backend native.
- **Độ tin cậy**: Đã qua ma trận kiểm chứng khắt khe (§14.1), độ lệch bán kính LEO $\le 5\cdot 10^{-6}$ m, bảo toàn cơ năng ở mức $10^{-14}$.

#### Level 2: High-Fidelity Simulation qua GMAT Adapter (Nâng cấp P1/P2)
- **Vị trí kiến trúc**: Tuyệt đối không gọi GMAT trực tiếp từ trình duyệt/frontend. GMAT được tích hợp tại simulation backend thông qua adapter `mission_engine/kernels/gmat_adapter.py`.
- **Nhiệm vụ**: Phục vụ các quỹ đạo liên hành tinh phức tạp (Earth–Moon Cycler, Trans-Mars Injection, chèn quỹ đạo Mặt Trăng/Sao Hỏa, mô hình nhiễu loạn trường xuyên tâm $J_2, J_3, J_4$, áp suất bức xạ Mặt Trời - SRP, lực cản khí quyển phi tuyến).
- **Quy trình hoạt động**:
  1. `gmat_adapter.py` nhận thông số tàu vũ trụ (khối lượng khô, nhiên liệu, $I_{sp}$, diện tích cản $S$, $C_D$) và kế hoạch cơ động từ `DesignSpec`.
  2. Adapter kết xuất file kịch bản GMAT (.script) từ Jinja2 template (`templates/gmat/earth_moon_transfer.script.j2`).
  3. Gọi tiến trình GMAT dạng headless:
     ```bash
     gmat --run --minimize --exit mission_run.script
     ```
  4. Trình phân tích kết quả (`GmatReportParser`) đọc các file log `.report` và file quỹ đạo `.ephem`, trích xuất chuỗi vector trạng thái Cartesian $[X, Y, Z, V_x, V_y, V_z]$ cùng các sự kiện cơ động (burnout, periapsis, apoapsis).
  5. Đóng gói dữ liệu đầu ra về đúng chuẩn `FlightBundle` JSON của game.
- **Cơ chế suy giảm êm (Graceful Fallback)**: Nếu môi trường chạy chưa cài đặt GMAT (ví dụ khi giám khảo mở link web tĩnh), adapter tự động chuyển về Level 1 Simplified Physics và gắn cờ `meta.physics = "simplified-analytic"` kèm cảnh báo minh bạch trên giao diện để không bao giờ bị crash.

---

## 7. L4: Rules — Constraint, Scoring, Fault, Explainer, Advisor

Rules **không tính vật lý**: chúng gọi kernel lấy số (`MetricSet`), so với giới hạn, rồi suy ra hậu quả và lời giải thích.

### 7.1 Constraint là dữ liệu

```python
# engine/rules/constraints.py
from dataclasses import dataclass, field

@dataclass(frozen=True)
class Constraint:
    id: str                       # "power"
    metric: str                   # khoa trong MetricSet, vd "power.margin_w"
    op: str                       # ">=" hoac "<="
    limit: float                  # da resolve tu "@..." (xem 5.3)
    unit: str
    kind: str = "hard"            # hard | soft
    critical: bool = False        # "nut that" cua mission (R8)
    drivers: tuple = ()           # cac khoa metric giai thich ket qua (cho Explainer)
    why: dict = field(default_factory=dict)       # {"vi": "...", "en": "..."}
    fault: str | None = None      # id su co khi truot (7.3)

def check(c, metrics):
    v = metrics[c.metric]
    ok = v >= c.limit if c.op == ">=" else v <= c.limit
    return {"id": c.id, "pass": ok, "value": v, "limit": c.limit,
            "margin": (v - c.limit) if c.op == ">=" else (c.limit - v)}
```

Luồng `evaluate()`: `design` + `catalog` + `mission` → kernel tính `MetricSet` (phẳng, khoá kiểu `mass.dry_kg`) → danh sách `Constraint` (chuẩn + từ pack) → `EvaluationReport`.

### 7.2 Constraint chuẩn

**10 constraint lúc thiết kế** (9 budget + `orbit_allowed`) và **1 chỉ số lúc vận hành** (`link`). Pack có thể ghi đè giới hạn hoặc thêm mới (§5.2).

| id | Metric (kernel) | Điều kiện | Sự cố khi trượt |
|---|---|---|---|
| `science` | `Σ science_value_pts` của thiết bị chọn | ≥ `min_science_pts` | — (điểm giao thực giảm theo availability, §7.4) |
| `mass` | khối lượng khô + tải so với sức tải LV theo quỹ đạo (`capacity_policy`) và `bus.max_total_mass_kg` | ≤ | `NO_GO` (chặn phóng vì không có quỹ đạo để bay) |
| `power` | `Pgen·(1 − eclipse_fraction)` so với `Pload` (theo duty cycle) và SoC sau eclipse (K-PWR) | `margin_w` ≥ 0 | `brownout`, nặng hơn là `blackout` |
| `data` | `downlink_gb_per_day = rate_mbps · contact_min · 60 · η / 8000` so với `data_generated_gb_per_day`; `η = 0,85` là giả định (`calibrated`) | ≥ | `memory_full` |
| `pointing` | `adcs.pointing_accuracy_deg` | ≤ yêu cầu chặt nhất của thiết bị khoa học | `blur` |
| `cost` | `Σ cost_musd` | ≤ `budget_musd` | — (soft) |
| `lifetime` | `orbital_lifetime_years_no_reboost` | ≥ `min_mission_life_years` | `decay` |
| `radiation` | `radiation_dose_krad_per_year · life_years · margin_factor` | ≤ `obc.rad_tolerance_krad` | `seu`, nặng hơn là `reset` |
| `schedule` | `max lead_time_months` | ≤ `deadline_months` | — (soft) |
| `orbit_allowed` | `orbit.id` | ∈ `allowed_orbit_ids` | — (hard; sửa gap G5) |
| `link` (vận hành) | link margin (dB) từ K-LNK | ≥ 3 → `LOCK`; 0–3 → `MARGINAL`; < 0 → `DEGRADED` | `no_link` |

Chính sách chặn phóng nằm ở `ruleset.yaml` (`launch_gate`). Mặc định giống v5: **chỉ `NO_GO` ở `mass` chặn phóng**; các budget khác vẫn cho phóng để người chơi thấy hậu quả ở Ops.

### 7.3 Bản đồ sự cố (constraint trượt → hậu quả nhìn và nghe thấy)

Logic nằm ở engine (`rules/faults.py`, tất định theo `seed`); hình/âm nằm ở viewer (`fx_cues.yaml`). Độ nặng `severity ∈ [0, 1]` tăng theo mức trượt, nên thiết kế "gần đạt" vẫn chơi được nhưng khổ.

| Sự cố | Gameplay | Hình (viewer) | Âm (viewer) |
|---|---|---|---|
| `brownout` → `blackout` (power) | Mất nguồn: không chụp được; thiết bị tự tắt dần; vào eclipse tối dần | HUD nhấp nháy, vignette tối, chữ LOW BUS VOLTAGE / NO POWER | Ù điện sụt tông, relay click, báo động chậm dần |
| `memory_full` (data) | Chụp bị từ chối; ảnh cũ bị ghi đè | Thanh bộ nhớ đỏ, chữ MEMORY FULL | Bíp cảnh báo, nhiễu số |
| `blur` (pointing) | Ảnh nhòe, điểm khoa học bị trừ theo sai số hướng | Khung ngắm rung, ảnh mờ | Bánh phản lực rít lẫn tạp âm |
| `seu` → `reset` (radiation) | Ngắt tích lũy/chụp; máy tính reset khoảng 6 s | Nhiễu "tuyết", log khởi động lại có thanh tiến trình | Crackle, chuỗi bíp khởi động |
| `no_link` (link) | Không hạ được dữ liệu | Scanline, xé hình, chữ NO LINK | Nhiễu tĩnh + bíp mất tín hiệu |
| `decay` (lifetime) | Độ cao tụt dần; phải đốt RCS giữ quỹ đạo; hết nhiên liệu và dưới sàn thì mất vệ tinh | Viền đỏ ORBIT DECAY | Còi cảnh báo |

Pack có thể ép sự cố để demo (`hazards.force`) và đổi mức khắc nghiệt (`hazards.profile`). Kinh nghiệm từ phiên trước: SEU/bức xạ và suy giảm quỹ đạo gần như không đồng xảy ra theo luật thường, nên `force` là cách duy nhất để demo cả hai trong một lượt (gap G7).

### 7.4 Chấm điểm

```
score        = 100 · Σ_i w_i · s_i                     # w_i từ mission pack, Σ w_i = 1
s_science    = min(1, science_delivered / science_required)
s_efficiency = clamp(1 − cost/budget, 0, 1)
s_margin     = mean( clamp(margin_i / margin_ref_i, 0, 1) )   # trên các constraint hard
s_decisions  = 1 − (số constraint hard trượt)/(tổng constraint hard)    # có thể cộng thưởng nếu constraint critical đạt
grade        = band(score)                              # dải A/B/C/D trong ruleset.yaml (ví dụ A≥85, B≥70, C≥50: chốt theo playtest)
```

- `science_delivered` do **mode** trả về (§8), đã nhân availability và trừ ảnh hưởng sự cố.
- Công thức trên là đề xuất chuẩn hoá. Công thức thật trong `mission_design.py` `[RE]` cần được đối chiếu khi đóng gói; chốt ở quyết định D4 (§16.3).

### 7.5 Explainer (giải thích "vì sao")

Mặc định **template tất định**, đọc `EvaluationReport` và `drivers` của constraint:

```
Trượt "Dữ liệu": hạ được {value} GB/ngày < sinh ra {limit} GB/ngày.
Nguyên nhân: {drivers}            (ví dụ COM-UHF {rate} Mbps × {contact} phút liên lạc/ngày)
Hệ quả: {fault} → điểm khoa học giao được còn {x}/{y}.
Gợi ý: đổi {slot} từ {A} sang {B} (+{Δcost} M$, {Δmass} kg) → đạt.   # lấy từ Advisor.why_not
```

**LLM coach (tùy chọn, mặc định tắt)**: đầu vào chỉ là `EvaluationReport`; prompt cấm thêm số; đầu ra đi qua **kiểm tra neo số** — mọi con số trong văn bản phải có trong report (hoặc là phép tính tầm thường từ nó), nếu không thì bỏ kết quả LLM và dùng template. Cache theo hash của report; hết hạn mức hoặc mất mạng thì tự rơi về template.

### 7.6 Advisor

Dùng cho: kiểm tra D12 (feasibility), nút "Gợi ý" trong Design Desk, mục "Cách khác để đạt" ở Debrief, và test.

1. **Lọc tương thích**: quỹ đạo ↔ thiết bị, bus ↔ tải, LV ↔ bãi, `allowed_orbit_ids`.
2. **Liệt kê có cắt tỉa**, thứ tự rẻ → đắt: `orbit_allowed`, `schedule`, `cost`, `mass`, `pointing`, `radiation`, `lifetime`, rồi mới tới `power` và `data`.
3. **Chấm điểm** và giữ top-k cùng **tập Pareto** theo (điểm, chi phí, biên nhỏ nhất).
4. `why_not(design)`: với mỗi constraint trượt, tìm các phép **thay một slot** sửa được, xếp theo Δchi phí; ghép tham lam nếu cần nhiều thay đổi.

Không gian thiết kế rời rạc cỡ 10⁶–10⁷ tổ hợp (ước tính thô từ số mục trong thư viện). Mục tiêu: vài giây cho một mission nhờ cắt tỉa `[?]` (đo khi làm). Nếu không đủ nhanh thì mới dùng NSGA-II qua `pymoo` (P2).

### 7.7 Đánh giá độ trưởng thành nhiệm vụ CML (Concept Maturity Levels)

Dựa trên framework chuẩn của NASA (*Measuring the Maturity of Robotic Planetary Mission Concepts - JPL/NASA Science*), game không chỉ chấm một con số điểm khô khan mà đánh giá xem ý tưởng thiết kế của người chơi đã đạt tới cấp độ trưởng thành kỹ thuật nào:

```
[ CML 1: Concept ] ──► [ CML 2: Feasibility ] ──► [ CML 3: Trade Space ] ──► [ CML 4: Point Design ]
Muc tieu khoa hoc      Dong du mass/power       So sanh phuong an        Thiet ke hoan chinh,
& kien truc co ban     co ban tren giay         (Trade studies)          san sang de phong
```

#### Các cấp độ CML trong Gameplay:

| Level CML | Tên chuẩn NASA | Điều kiện đạt trong Game | Cơ chế Unlock / Gameplay tương ứng |
|---|---|---|---|
| **CML 1** | **Initial Concept** | Xác định mục tiêu khoa học rõ ràng (`science.pts >= min`) và chọn kiến trúc phù hợp. | Mở khóa kho linh kiện và bàn thiết kế Design Desk. |
| **CML 2** | **Initial Feasibility** | Khối lượng khô nằm trong sức tải danh định, năng lượng phát trung bình $> 0$, không vi phạm các ràng buộc cấm. | Mở khóa chạy mô phỏng quỹ đạo sơ bộ và kiểm tra biên độ an toàn. |
| **CML 3** | **Trade Space** | Người chơi đã thực hiện so sánh ít nhất 2 cấu hình khác nhau (ví dụ: Solar Array tĩnh vs Xoay; RF S-band vs Optical laser). | Mở khóa Advisor Pareto và bảng so sánh phương án tối ưu. |
| **CML 4** | **Point Design** | Đóng trọn vẹn 10/10 constraint (9 budget + quỹ đạo), xác định rõ rủi ro, phân tích lỗi (fault analysis). | **Cấp phép phóng (Flight Readiness Review - FRR GO)** cho phép bước sang Launch Control. |

#### Thuật toán tính Mission Maturity Score (MMS):
$$MMS = \sum w_k \cdot \mu_k$$
- Có Scientific Objective phù hợp: $+15$ pts
- Mission Architecture hợp lệ: $+15$ pts
- Quỹ đạo tương thích mọi cảm biến: $+15$ pts
- Power budget dương qua vùng tối (eclipse): $+15$ pts
- Downlink budget đủ xả hết bộ đệm: $+15$ pts
- ADCS đáp ứng dung sai trỏ của camera: $+15$ pts
- Kế hoạch kiểm soát rủi ro bức xạ / suy giảm quỹ đạo: $+10$ pts
- **Mức trưởng thành**: $MMS \ge 90 \rightarrow \text{CML 4 (Point Design)}$; $70-89 \rightarrow \text{CML 3}$; $50-69 \rightarrow \text{CML 2}$; $< 50 \rightarrow \text{CML 1}$.

### 7.8 Mission Design Lab (MDL) Trade-off Engine

Mô phỏng quy trình thiết kế kỹ thuật đồng thời (Concurrent Engineering) từ phòng thí nghiệm **Mission Design Lab (MDL)** thuộc NASA Goddard Space Flight Center:

1. **Đồng bộ đa hệ thống (Multi-subsystem Coupling)**: Thay vì thiết kế tách rời, mọi thay đổi ở một phân hệ lập tức kéo theo phản ứng dây chuyền ở các phân hệ khác:
   - **Tăng cảm biến khoa học**: Tăng `science_value` $\rightarrow$ Tăng khối lượng (`mass_kg`) $\rightarrow$ Giảm biên sức tải tên lửa $\rightarrow$ Tăng công suất tiêu thụ (`power_operating_w`) $\rightarrow$ Cần mảng pin lớn hơn và ắc quy dung lượng cao hơn $\rightarrow$ Lại tiếp tục tăng khối lượng tổng.
   - **Tăng công suất phát sóng (High-gain antenna / Optical)**: Tăng tốc độ truyền downlink $\rightarrow$ Xả sạch bộ đệm dữ liệu nhanh hơn $\rightarrow$ Đòi hỏi độ chính xác chỉ hướng ADCS khắt khe hơn ($< 0.005^\circ$) $\rightarrow$ Buộc phải nâng cấp từ bánh đà phản lực thường lên cảm biến sao (Star Tracker) và bánh đà siêu chính xác $\rightarrow$ Đội chi phí ngân sách (`cost_musd`).
   - **Thay đổi quỹ đạo**: Quỹ đạo thấp (LEO 400 km) cho độ phân giải mặt đất cực cao nhưng chịu lực cản khí quyển lớn (tuổi thọ quỹ đạo tụt nhanh, cần nhiên liệu reboost) $\rightarrow$ Lên quỹ đạo SSO 600–800 km thì môi trường ổn định nhưng liều bức xạ tăng cao, đòi hỏi máy tính bay chống bức xạ (Rad-Hard OBC).
2. **Bảng đánh giá Trade Studies**: Advisor (§7.6) hiển thị trực tiếp đồ thị phân tán Pareto (Pareto Front) giữa hai trục: **Điểm khoa học (Science Return)** và **Chi phí / Rủi ro (Cost & Risk)**, giúp người chơi rèn luyện tư duy kỹ sư trưởng (Chief Engineer) của NASA.

---

## 8. L4: Mission Modes

Mode là **plugin gameplay**: nó trả lời "trong Ops người chơi làm gì và điểm khoa học đến từ đâu". Engine chỉ cần biết interface.

### 8.1 Interface

```python
# engine/modes/base.py
from typing import Protocol

class MissionMode(Protocol):
    id: str
    def arm(self, ctx) -> dict: ...                       # tim cua so (windows), muc tieu, tham so
    def on_action(self, state, action) -> tuple: ...      # (state', events) khi nguoi choi bam
    def tick(self, state, dt, env) -> tuple: ...          # (state', events) theo thoi gian (ke ca warp)
    def score(self, state) -> dict: ...                   # science_delivered_pts + chi tiet
    def hud(self, state) -> dict: ...                     # mo hinh panel: lines, bars, prompts
    def view_hint(self, state) -> dict: ...               # goi y camera/POV cho viewer
```

- `ctx` gồm: `design`, các mục catalog liên quan, `mission.gameplay.params`, truy cập quỹ đạo vệ tinh theo thời gian, trạng thái sự cố, `targets`, `ground_stations`.
- `hud()` trả mô hình **viewer-agnostic** (dòng chữ, thanh, lời nhắc), nên mode mới không cần viết code UI nếu dùng panel chuẩn.
- Helper dùng chung ở `modes/_common.py`: `find_passes(ephemeris, site, min_el_deg)`, `sun_elevation(site, t)`, `target_in_fov(...)`.

### 8.2 Danh mục mode

| Mode | Nhiệm vụ | Thao tác người chơi | Thắng khi | Sự cố liên quan | Trạng thái |
|---|---|---|---|---|---|
| `imaging` | Chụp vùng mục tiêu khi bay qua, đủ ánh sáng | `J` nhảy tới cửa sổ; `C` vào nadir; mũi tên xoay; `C` chụp | Ảnh đạt chất lượng; điểm theo ảnh tốt nhất | `blur`, `brownout`, `memory_full` | `[OK]` |
| `downlink` | Hạ dữ liệu về trạm mặt đất | `J` tới lượt bay qua; tự hạ khi trong cửa sổ và còn liên lạc; `T` để track | % dữ liệu hạ được | `no_link`, `brownout` | `[OK]` |
| `space_weather` | Giữ thiết bị lấy mẫu liên tục ở quỹ đạo bức xạ cao | Chờ/warp, giữ nguồn | Live-time % | `seu`, `reset` | `[OK]` |
| `orbit_keeping` (lớp phủ) | Bù suy giảm quỹ đạo | `K` đốt RCS (số lần có hạn) | Không rơi dưới sàn | `decay` | `[OK]` |
| `spectral_scan` | Dừng trên mục tiêu đủ lâu khi sai số hướng nhỏ hơn dung sai | Vào nadir, giữ mục tiêu ở tâm | Tổng dwell đạt | `blur`, `pointing` | `[NEW]` P1 |
| `radar_swath` | Quét dải radar mọi thời tiết; bỏ điều kiện ánh sáng; dữ liệu rất nhiều | Bật/tắt quét theo dải; quản lý bộ nhớ | Diện tích quét giao được | `memory_full` | `[NEW]` P2 |
| `stare` | Giữ hướng quán tính vào một điểm trời, phơi dài (kính thiên văn) | Bắt mục tiêu rồi giữ | Thời gian phơi hợp lệ | `blur` (rung) | `[NEW]` P2 |
| `tutorial` | Hướng dẫn từng bước | — | Hoàn thành bước | — | `[NEW]` P2 |

Gợi ý gán theo tên scenario đã biết (id còn lại tra trong library): First Eyes on Earth → `imaging`; Coastal Watch → `imaging` với `target_set: coast`; Space Weather Sentinel → `space_weather`; Greenhouse Gas Monitor → `spectral_scan`; All-Weather Radar Eye → `radar_swath` kèm lớp `downlink`.

### 8.3 Thêm một mode mới (mục tiêu ≤ 1 giờ)

1. `engine/modes/<id>.py` cài interface §8.1.
2. Đăng ký trong `modes/__init__.REGISTRY`.
3. Thêm luật vào `mode_resolver.yaml` hoặc đặt `gameplay.mode: <id>` trong pack.
4. Khai báo schema `params` và giá trị mặc định.
5. Dùng panel HUD chuẩn qua `hud()`; chỉ viết UI mới nếu mode cần POV đặc biệt (khai báo ở `view_hint`).
6. Test: một preset + một test headless "chạy một lượt từ Ops đến Debrief".
7. Thêm cue âm thanh (§11.4).

Mode chưa cài đặt mà pack gọi tới thì engine **rơi về `imaging`** và ghi cảnh báo (nguyên tắc 6).

---

## 9. L5: Session Orchestrator

Orchestrator giữ **trạng thái một lượt chơi** và điều phối thời gian. Nó không tính vật lý và không vẽ.

### 9.1 Máy trạng thái

```
BOOT -> BRIEF -> DESIGN -> REVIEW -> COUNTDOWN -> ASCENT -> SEPARATION -> OPS -> DEBRIEF
                   ^         |                                                      |
                   +---------+  (quay lai sua thiet ke)          RETRY -> DESIGN <--+--> REPLAY
```

| Trạng thái | Engine làm gì | Viewer hiện gì |
|---|---|---|
| `BOOT` | Nạp catalog + pack; khởi động engine (tải Pyodide nếu dùng) | Màn tải có tiến độ |
| `BRIEF` | Trả metadata pack | Đề bài, ràng buộc, mục tiêu học |
| `DESIGN` | `evaluate()` mỗi lần đổi slot; Advisor gợi ý; preset | Design Desk, bảng budget trực tiếp |
| `REVIEW` | Tóm tắt constraint, kiểm `NO_GO`, `launch_gate` | Danh sách kiểm tra trước phóng, xác nhận "vẫn phóng" nếu chưa đạt |
| `COUNTDOWN` | Phát lịch sự kiện trước phóng | Đếm ngược, cần đu thu về, đánh lửa |
| `ASCENT` | Phát lại `FlightBundle` theo clock | Dashboard Launch Control, sự kiện tách tầng |
| `SEPARATION` | `PAYLOAD_SEP` khi người chơi bấm (chỉ sau `SECO2`); K-REL | Cảnh tách, camera vệ tinh |
| `OPS` | `OpsSession.step()`: K-REL/K-ATT/K-PWR/K-LNK + Mode | HUD của mode, SAT // OPS, tín hiệu, nguồn, dữ liệu |
| `DEBRIEF` | `score()` + `explain()` | Điểm, bảng constraint, lý do, scrubber replay |

### 9.2 Sự kiện (event bus)

Sự kiện là dữ liệu: `{ t, name, payload }`. Engine phát; audio, figure và HUD **đăng ký** nghe, không ai gọi trực tiếp ai.

| Nhóm | Sự kiện |
|---|---|
| Phóng | `COUNTDOWN`, `IGNITION`, `LIFTOFF`, `MACH1`, `MAXQ`, `BOOSTER_SEP`, `FAIRING_SEP`, `MECO`, `STAGE_SEP`, `SECO1`, `SECO2`, `PAYLOAD_SEP` |
| Vận hành | `ANT_DEPLOY`, `SOLAR_DEPLOY`, `AOS`, `LOS`, `WINDOW_OPEN`, `WINDOW_CLOSE`, `CAPTURE`, `ORBIT_BURN` |
| Sự cố | `FAULT_START`, `FAULT_END`, `SEU`, `RESET` |
| Phiên | `STATE_CHANGE`, `SCORE_UPDATE` |

### 9.3 Đồng hồ và time-warp

- Mức warp: **×1, ×2, ×5, ×50, ×100** (đã dùng trong game; không có ×10).
- **Engine là thẩm quyền**: client xin mức warp, engine trả mức được phép (`clock.allowed_warp(state)`).
- Quy tắc kìm warp (baseline từ v3 và giai đoạn B): tối đa ×5 khi dưới 120 km và trong ±15 s quanh sự kiện; tối đa ×5 trong 30 s đầu sau tách và khi cánh pin đang mở.
- `step(dt)` chia thành bước con theo `max_substep` khai trong `MANIFEST` của từng kernel (ví dụ quỹ đạo ≤ 5 s); client không phải lo ổn định số.

### 9.4 Lưu, phát lại, tất định

`session.json` gồm: `schema_version`, `engine_version`, `catalog_hash`, `mission_hash`, `seed`, `design`, và `actions: [{ t, action }]`. Vì engine tất định nên **cùng file → cùng kết quả**. Dùng để:

- test hồi quy tự động (replay một phiên mẫu, so điểm và sự kiện);
- quay video demo bằng viewer bất kỳ (Web hoặc Ursina) từ cùng một phiên;
- chia sẻ thiết kế: chỉ `design + seed` mã hoá vào URL fragment (không cần server);
- tự lưu cục bộ bằng IndexedDB.

### 9.5 Vai trò và đàm phán (P2)

Đề yêu cầu tối đa 4 người chơi với vai trò khác nhau và có đàm phán ưu tiên. Có 5 vai trò gợi ý trong đề, nên **một người có thể giữ hai vai**. Làm hot-seat trước (cùng máy, đổi người); thời gian thực qua WebSocket chỉ làm nếu dư thời gian.

| Vai | Được sửa slot | Thấy nổi bật | Mục tiêu riêng (nguồn đàm phán) |
|---|---|---|---|
| Mission Planner | `orbit`, `launch.vehicle`, `launch.site` | scenario, tiến độ, sức tải LV | Đúng hạn, quỹ đạo phù hợp |
| Spacecraft Engineer | `bus`, `power`, `battery`, `obc`, `adcs` | khối lượng, điện, chỉ hướng, bức xạ | Biên khối lượng và điện, độ tin cậy |
| Science Lead | `instruments` | điểm khoa học, dữ liệu sinh ra | Tối đa điểm khoa học |
| Comms/Data Officer | `comm`, kế hoạch trạm | dữ liệu, link, thời gian liên lạc | Hạ đủ dữ liệu |
| Resource Manager | không sửa slot; duyệt đề xuất | chi phí, tiến độ | Giữ ngân sách |

**Cơ chế đàm phán** tận dụng `evaluate()`: mỗi đề xuất là `Proposal { id, from_role, slot, new_value, rationale, impact }` trong đó `impact = { constraint_id: Δmargin }` được **tự tính** bằng hiệu hai `EvaluationReport`. Các vai bị ảnh hưởng thấy tác động lên mục tiêu của mình rồi chấp nhận, từ chối hoặc đối đề xuất. Xung đột bế tắc do Resource Manager quyết (hoặc bỏ phiếu). Pack bật tính năng qua `roles.enabled` và `roles.assignments`.

---

## 10. Contract và Engine Client

### 10.1 Nguyên tắc

- Mọi payload có `schema_version`. Schema sinh từ model `pydantic` ở lớp API (`tools/export_schemas.py` → `build/schemas/*.json`), type TypeScript sinh từ JSON Schema.
- Core engine trả `dict` và dataclass thuần; test hợp đồng kiểm tra đầu ra **hợp lệ với JSON Schema**.
- Khác biệt **major** của `schema_version` → client từ chối rõ ràng (không crash); **minor** → tương thích ngược.

### 10.2 API Python công khai (6 hàm)

Mọi viewer, transport và test chỉ gọi những hàm này:

```python
# engine/__init__.py
load_catalog(path)                          # -> Catalog
load_mission(path, catalog)                 # -> MissionPack
evaluate(design, mission, catalog)          # -> EvaluationReport
fly(design, mission, catalog, seed=0)       # -> FlightBundle   (ascent, co the them K-INS)
ops_open(flight, design, mission, catalog, seed=0)   # -> OpsSession;  OpsSession.step(dt, actions) -> Snapshot
advise(mission, catalog, objective="max_score", k=5) # -> list[AdvisorResult]
```

### 10.3 Hình dạng payload (số trong ví dụ chỉ để minh hoạ định dạng)

`DesignSpec` — người chơi chọn gì:

```json
{
  "schema_version": "design/1",
  "mission": "MP-SC01-FIRST-EYES",
  "orbit": "ORB-LEO-400",
  "instruments": ["INS-01"],
  "bus": "BUS-3U",
  "power": "PWR-SA-DEP",
  "battery": "BAT-S",
  "comm": "COM-S-CUBE",
  "obc": "OBC-CUBE",
  "adcs": "ADCS-WHEEL",
  "launch": { "vehicle": "LV-ELECTRON", "site": "SITE-MAHIA" },
  "seed": 42
}
```

`EvaluationReport` — kết quả đóng budget, nguồn của mọi bảng/figure ở Design Desk và Debrief:

```json
{
  "schema_version": "evaluation/1",
  "catalog_hash": "7f3a91c2",
  "mission_hash": "b21e04aa",
  "engine_version": "0.1.0",
  "ok": true,
  "launch_allowed": true,
  "score": { "total": 78, "grade": "B", "parts": { "science": 1.0, "efficiency": 0.4, "margin": 0.5, "decisions": 1.0 } },
  "constraints": [
    { "id": "power", "pass": true, "value": 6.2, "limit": 0.0, "unit": "W", "margin": 6.2, "critical": false,
      "drivers": { "power.gen_w": 14.1, "power.load_w": 7.9 } }
  ],
  "faults": [],
  "mass": { "dry_kg": 4.1, "capacity_kg": 200.0, "ballast_kg": 0.0 },
  "provenance": [ { "path": "launch_vehicles.LV-ELECTRON.stages[0].isp_s", "source": "public" } ],
  "hints": []
}
```

`FlightBundle` — kết quả ascent; mảng số nén dạng Float32 base64 để file nhỏ:

```json
{
  "schema_version": "flight/1",
  "meta": { "catalog_hash": "7f3a91c2", "engine_version": "0.1.0", "seed": 42, "ballast_kg": 0.0 },
  "events": [ { "t": 36.0, "name": "MACH1" }, { "t": 54.8, "name": "MAXQ" } ],
  "series": {
    "dt_s": 1.0,
    "t": "f32:BASE64", "alt_km": "f32:BASE64", "v_inertial_ms": "f32:BASE64", "v_rel_ms": "f32:BASE64",
    "gamma_deg": "f32:BASE64", "mass_kg": "f32:BASE64", "thrust_n": "f32:BASE64",
    "q_pa": "f32:BASE64", "mach": "f32:BASE64", "stage_idx": "u8:BASE64"
  },
  "eci_km": "f32:BASE64",
  "orbit": { "a_km": 6778.137, "e": 0.0003, "i_deg": 28.5, "period_s": 5553.62 },
  "separation": { "t": 661.0, "dv_ms": 1.0 }
}
```

`Snapshot` — **thứ duy nhất viewer và figure đọc** mỗi tick (≈ 30 Hz). Viewer không suy ra số nào khác (sửa gap G8):

```json
{
  "schema_version": "snapshot/1",
  "t": 1234.5, "phase": "OPS", "warp": 5, "mode": "imaging",
  "flight": { "alt_km": 402.1, "v_inertial_ms": 7672.6, "v_rel_ms": 7260.1, "gamma_deg": 0.01,
              "mass_kg": 4.1, "stage": 2, "thrust_n": 0.0, "q_pa": 0.0, "mach": 0.0 },
  "attitude": { "q": [1, 0, 0, 0], "omega_dps": [0.0, 0.0, 0.0], "boresight_error_deg": 1.2 },
  "power": { "gen_w": 14.1, "load_w": 7.9, "soc": 0.82, "eclipse": false },
  "link": { "station": "GOLDSTONE", "el_deg": 31.2, "margin_db": 4.1, "state": "LOCK", "rate_mbps": 2.0 },
  "data": { "buffer_gb": 0.4, "capacity_gb": 8.0, "downlinked_gb": 1.2 },
  "radiation": { "dose_krad": 0.31, "tolerance_krad": 10.0, "seu_active": false },
  "faults": [],
  "mode_hud": { "title": "IMAGING", "lines": [], "prompts": [], "windows": [] },
  "events": [ { "t": 1230.0, "name": "WINDOW_OPEN" } ]
}
```

> `OpsFrame` trong sơ đồ §3.2 chính là `Snapshot` ở pha OPS; hai tên dùng chung một schema.

### 10.4 Một `EngineClient`, ba transport

```ts
// web/src/engine-client/types.ts
export interface EngineClient {
  init(): Promise<{ engineVersion: string; catalogHash: string }>;
  catalog(): Promise<Catalog>;
  missions(): Promise<MissionMeta[]>;
  evaluate(d: DesignSpec): Promise<EvaluationReport>;
  fly(d: DesignSpec): Promise<FlightBundle>;
  opsOpen(f: FlightBundle, d: DesignSpec): Promise<OpsHandle>;
  finish(h: OpsHandle): Promise<Debrief>;
  advise(missionId: string, objective?: string): Promise<AdvisorResult[]>;
}
export interface OpsHandle {
  step(dt: number, actions: Action[]): Promise<Snapshot>;   // dt = thoi gian mo phong (da nhan warp)
  close(): void;
}
```

| Transport | Dùng khi | Ưu | Nhược | Trạng thái |
|---|---|---|---|---|
| `BundleEngine` | Demo mặc định, first paint, offline, giám khảo | Không cần server; chắc chắn chạy | Chỉ phủ các tổ hợp đã precompute (tải được làm tròn về "lớp tải" gần nhất, UI ghi rõ); Ops chỉ phát lại | `[NEW]` P0 |
| `PyodideEngine` | Thiết kế tuỳ ý + Ops tương tác nhưng vẫn host tĩnh | Một nguồn Python, không port; host tĩnh | Tải lần đầu nặng, chạy chậm hơn native, **chưa spike** | `[?]` P1 (spike) |
| `HttpEngine` (REST + WebSocket) | Dev, tối ưu nặng, phương án dự phòng nếu Pyodide hỏng | Nhanh, dễ debug | Cần host sống suốt thời gian chấm | `[NEW]` P0 |

Thứ tự tự chọn: `Bundle` (first paint) → `Pyodide` nếu qua cổng spike → `Http`. Có thể ép bằng `?engine=bundle|pyodide|http`.

**Cổng spike Pyodide** (làm trước ngày thi, khoảng 2–3 giờ; ngưỡng là đề xuất `[?]`):

| Cổng | Ngưỡng |
|---|---|
| Tải lạnh lần đầu (có thanh tiến độ, sau đó có cache) | ≤ 15 s trên laptop tầm trung |
| `fly()` một chuyến | ≤ 3 s |
| `OpsSession.step` cho 1/30 s mô phỏng | ≤ 8 ms |
| Chạy được trên điện thoại tầm trung | Không treo, không hết bộ nhớ |
| Phụ thuộc | Chỉ `numpy`; không `scipy`, không `pydantic` trong core |

Không qua cổng nào → dùng `Bundle` + `Http`, kiến trúc không đổi.

### 10.5 Lỗi, cache, luồng

- Lỗi: `{ "error": { "code": "...", "message": "...", "details": {} } }` với mã `CATALOG_ID_MISSING`, `ORBIT_NOT_ALLOWED`, `NO_GO_CAPACITY`, `PACK_INVALID`, `SCHEMA_MISMATCH`, `ENGINE_TIMEOUT`.
- Cache: khoá = `sha256(design chuẩn hoá + mission_hash + catalog_hash + engine_version + seed)`. `evaluate` và `fly` thuần nên cache an toàn (bộ nhớ + IndexedDB/HTTP cache).
- Pyodide chạy trong **Web Worker** để không chặn luồng UI; `step()` gộp nhiều bước nhỏ nếu client chậm.

### 10.6 Endpoint HTTP (FastAPI; mỗi route gọi đúng một hàm ở §10.2)

| Phương thức | Đường dẫn | Hàm | Trả về |
|---|---|---|---|
| GET | `/health` | — | `{ engine_version, catalog_hash }` |
| GET | `/catalog` | `load_catalog` | Catalog chuẩn hoá |
| GET | `/missions` | — | Metadata các pack |
| POST | `/evaluate` | `evaluate` | `EvaluationReport` |
| POST | `/fly` | `fly` | `FlightBundle` |
| POST | `/ops` | `ops_open` | `ops_id` + `Snapshot` đầu |
| POST | `/ops/{id}/step` | `OpsSession.step` | `Snapshot` |
| WS | `/ws/ops/{id}` | `OpsSession.step` liên tục | `Snapshot` ≈ 30 Hz |
| POST | `/finish` | `score` + `explain` | `Debrief` |
| POST | `/advise` | `advise` | Danh sách thiết kế |

---

## 11. L7: Presentation

Presentation chỉ **đọc `Snapshot`/`EvaluationReport`/`FlightBundle`** và gửi `Action` về engine. Không tính vật lý, không tự suy ra số.

### 11.1 Các màn hình

| ID | Màn | Nội dung | Gọi engine | Figure dùng |
|---|---|---|---|---|
| S1 | Mission Select | Thẻ mission từ pack: độ khó, mục tiêu học, thời lượng | `missions()` | F-10 (hình thu nhỏ) |
| S2 | Brief | Đề bài, ràng buộc, tài nguyên "nút thắt" (`critical`) | metadata pack | — |
| S3 | **Design Desk** | Chọn slot theo vai; bảng budget trực tiếp (10 hàng xanh/đỏ + thanh biên); nút Gợi ý; preset; huy hiệu provenance | `evaluate()`, `advise()` | F-10, F-01, F-03 |
| S4 | **Launch Control** | Dashboard 9 khung, log sự kiện, time-warp, âm thanh | `fly()` hoặc bundle | F-02 (P1), F-11 (P2) |
| S5 | **Ops** | HUD của mode, SAT // OPS, tín hiệu, nguồn, dữ liệu | `OpsSession.step()` | F-04, F-05, F-06, F-07, F-12 |
| S6 | Debrief | Điểm, bảng constraint, nguyên nhân gốc, "cách khác để đạt", scrubber replay, thẻ chia sẻ | `finish()` | Ảnh tĩnh F-02, F-03 |
| S7 | Validity và Nguồn | Phương trình (Learn), kết quả validation, bảng provenance, giả định và giới hạn | file build | — |
| S8 | Mission Builder (P2) | Form sinh từ JSON Schema của pack | không | — |

Màn **S7** dành cho giám khảo: mọi số liệu về độ tin cậy gom ở một chỗ, sinh tự động từ `MANIFEST` kernel, `build/reports/validation.md` và `provenance.md`.

### 11.2 Dashboard 9 khung (đăng ký được)

Baseline hiện có 9 khung: Flight Data, Throttle, Fuel/Stage, Radar PPI, Trajectory, Signal, Radio/Communication, Temperature, NAV/Control. Bản web cho phép **đổi bố cục bằng dữ liệu** để mode mới thêm khung mà không sửa code lõi.

```ts
// web/src/dashboard/types.ts
export interface PanelModule {
  id: string;                                   // "signal"
  title: string;
  render(el: HTMLElement, snap: Snapshot): void; // doc Snapshot, khong tinh vat ly
}
```

- `web/src/dashboard/layouts/launch.json` và `ops.json` khai báo khung nào nằm ô nào (đề xuất lưới 3×3 như ảnh mẫu; bản Ursina hiện là 5 + 4).
- `hud()` của mode có thể thêm khung qua `mode_hud` (dòng chữ, thanh, lời nhắc) dùng panel chuẩn.
- Khung nhiệt (`K-THM`) và link budget giữ nhãn "ước lượng" cho tới khi hiệu chỉnh.

### 11.3 Learn panel (phương trình sống)

Khớp với tinh thần giáo dục của đề và với bản Pygame cũ ("LEARN EQUATIONS" + bảng phương trình realtime). Kernel xuất các **số hạng** của phương trình vào `Snapshot.flight.terms` (tùy chọn: `F`, `D`, `g`, `rho`, `isp_s`, `m0_kg`, `dVdt`…); Learn panel chỉ việc thay số.

```yaml
# docs/equations.yaml   (moi phuong trinh tren mot dong; ky hieu theo sach)
- id: tsiolkovsky
  plain: "dV = g0 * Isp * ln(M0 / Me)"
  tex: "\\Delta V = g_0 \\, I_{sp} \\ln\\frac{M_0}{M_e}"
  symbols: { g0: "m/s^2", Isp: "s", M0: "kg", Me: "kg" }
  kernel: K-DV
  live: { Isp: "flight.terms.isp_s", M0: "flight.terms.m0_kg", Me: "flight.mass_kg" }
- id: drag
  plain: "D = 0.5 * rho * V^2 * S * CD"
  tex: "D = \\tfrac{1}{2}\\,\\rho V^2 S\\, C_D"
  symbols: { rho: "kg/m^3", V: "m/s", S: "m^2", CD: "-" }
  kernel: K-ASC
  live: { rho: "flight.terms.rho", V: "flight.v_rel_ms", S: "flight.terms.S", CD: "flight.terms.CD" }
```

Hiển thị bằng KaTeX. Phương trình lấy từ `MANIFEST` của kernel để không lệch với code.

### 11.4 Âm thanh

- Tái dùng bộ tổng hợp numpy → WAV đã có (23 âm phóng + 13 âm sự cố). Bước build `tools/synth_audio.py` sinh file `.ogg/.wav` vào `web/public/audio/`; runtime dùng **Web Audio API**.
- Mọi cue khai báo bằng dữ liệu; một số vòng lặp có tham số theo trạng thái (âm lượng và cao độ theo lực đẩy và độ cao, mờ dần khi ra chân không).
- Trình duyệt chặn âm tới khi có thao tác người dùng: nút **PHÓNG** là cử chỉ mở khoá.
- **Chưa nghe bằng tai**: các âm mới chỉ được kiểm bằng phổ và biên độ. Cần buổi nghe thử (§14.3).

```yaml
# web/src/audio/audio_cues.yaml   (id am thanh la VI DU; ten that theo thu muc am thanh da sinh)
cues:
  - { on: COUNTDOWN,   play: beep_tick,     gain: 0.6 }
  - { on: IGNITION,    play: ignition_roar, gain: 0.9 }
  - { on: MACH1,       play: shock_nwave,   gain: 0.8 }
  - { on: MAXQ,        play: wind_buffet,   gain: 0.5 }
  - { on: BOOSTER_SEP, play: sep_bang,      gain: 0.8 }
  - { on: FAULT_START, when: { fault: brownout }, play: hum_sag, loop: true, gain: 0.5 }
loops:
  engine: { play: engine_loop, gain_from: "flight.thrust_n", gain_curve: sqrt,
            pitch_from: "flight.alt_km", fade_out_above_km: 100 }
```

### 11.5 Theme, chữ, phím, truy cập

- **Hai theme**: `cosmic-dark` (mặc định) và `cosmic-light` ("sáng hơn nhưng vẫn cosmic" như yêu cầu trước). Đặt `data-theme` đồng bộ với theme của kit `/anatomy`. Token tối thiểu: `--cosmic-bg`, `--cosmic-panel`, `--cosmic-edge` (viền kem), `--crt-green`, `--alert-amber`, `--alert-red`, `--text`, `--muted`.
- **Chữ**: HUD dùng font retro (ứng viên `VT323`, `Share Tech Mono`, `Press Start 2P`; thường là OFL — kiểm lại giấy phép khi tải và **tự host**); đoạn văn dài dùng sans dễ đọc.
- **Phím** là dữ liệu (`web/src/input/keymap.yaml`) để đổi nhanh. Baseline: `1–5` warp, `.`/`,` tăng giảm warp, `Space` tạm dừng, `M` tắt tiếng, `D` dashboard/HUD cũ, `V` bảng Δv, `B` về menu, `F` kết thúc, `X` tách vệ tinh, mũi tên + `Q`/`E` xoay RCS, `R` rate null, `N` nadir, `T` track, `O` mở pin, `P` cỡ xung, `J` nhảy tới cửa sổ, `K` đốt giữ quỹ đạo. **`C` đang mang hai nghĩa** (đổi camera ở SAT // OPS; vào/chụp nadir ở imaging) — cần tách trước khi dựng lại UI `[RE]`.
- **Responsive**: phải đọc được ở 390 px (cũng là yêu cầu của `/anatomy` cho mỗi figure); dashboard thu thành tab trên điện thoại.
- **Truy cập**: tôn trọng `prefers-reduced-motion`; `aria-live` cho sự kiện quan trọng (tách tầng, mất liên lạc, sự cố); mỗi figure có `aria-label` và giá trị mô tả bằng lời.

### 11.6 NASA Mission Viz & 3D Trajectory Rendering Schema (Three.js)

Học tập cách tổ chức dữ liệu trực quan từ **NASA Mission Viz** (web-based visualizer chính thức của NASA), client Three.js hiển thị quỹ đạo chuyển tiếp Earth–Moon / Earth–Mars mà không tính lại vật lý:

```
                  SIMULATION BACKEND / FLIGHT BUNDLE
                                  │
                 JSON Trajectory (ECI J2000, km, UTC)
                                  │
                                  ▼
                   ┌─────────────────────────────┐
                   │    Three.js Mission Viz     │
                   ├─────────────────────────────┤
                   │ - Celestial Bodies (Shaders)│
                   │ - Trajectory Spline Curve   │
                   │ - Spacecraft Marker / Orient│
                   │ - Time-scrubber / Epoch HUD │
                   └─────────────────────────────┘
```

#### Trajectory Schema cho Three.js:
```json
{
  "schema_version": "trajectory/1",
  "mission_id": "earth_moon_001",
  "reference_frame": "ECI_J2000",
  "unit": "km",
  "epoch_start": "2026-11-14T00:00:00Z",
  "points": [
    { "t_sec": 0, "pos": [6778.14, 0.0, 0.0], "vel": [0.0, 7.67, 0.0] },
    { "t_sec": 3600, "pos": [12500.0, 24000.0, 3100.0], "vel": [-2.1, 4.3, 0.6] },
    { "t_sec": 72000, "pos": [180000.0, 195000.0, 21000.0], "vel": [-0.8, 1.2, 0.1] }
  ],
  "burn_markers": [
    { "t_sec": 3600, "name": "TLI_BURN", "dv_ms": 3150.0, "color": "#ffaa00" },
    { "t_sec": 259200, "name": "LOI_BURN", "dv_ms": 850.0, "color": "#00ffcc" }
  ]
}
```
Client Three.js nhận cấu trúc này, chuyển đổi sang `CatmullRomCurve3`, render đường quỹ đạo phát sáng (`Line2` với `LineMaterial`), vẽ nón FOV cảm biến hướng về mục tiêu và cho phép người chơi tua nhanh/chậm dòng thời gian bằng thanh scrubber.

---

## 12. Figure Layer & 3D Asset Ecosystem — Phân công Blender, `/anatomy`, Figma, Three.js và React

Để không lãng phí thời gian vào sai công cụ, dự án phân định ranh giới chức năng 1-1 cho từng công cụ trong chuỗi sản xuất trực quan (Visual & 3D Pipeline):

```
       [ 01. Research & Engineering ]  (NASA Docs, CubeSat 101, GMAT)
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
[ 02. Anatomy Skill ]         [ 03. Blender ]
Exploded Views, Cơ chế        Modular 3D Spacecraft Assets
(SVG Isometric / React)       (Mesh, LOD, PBR, GLB/glTF)
       │                             │
       │                             ▼
       │                      [ 05. Three.js ]
       │                      Render 3D Spacecraft, Turntable
       │                      & NASA Mission Viz Trajectory
       │                             │
       └──────────────┬──────────────┘
                      ▼
               [ 04. Figma ]  ──►  [ 06. React + TS ]
               UI/UX Mockups,      Game Shell, 9-budget Dashboard,
               Wireframes, Flows   Controls & Presentation
```

| Công cụ | Vai trò chuyên biệt trong dự án | Định dạng đầu ra | Không dùng vào việc gì |
|---|---|---|---|
| **Blender** | Dựng thư viện mô hình 3D thực tế dạng mô-đun (Modular Spacecraft Asset Library): Bus, Solar panels, ăng-ten, động cơ, cảm biến. | `.glb` / `.gltf` (PBR, low-poly) | **Không** dùng để vẽ wireframe UI hay layout nút bấm. |
| **`/anatomy`** | Tạo sơ đồ bóc tách (Exploded-view), minh họa cơ cấu kỹ thuật (cân đòn mass, phễu buffer, gimbal RCS, bàn quang học link). | SVG tương tác, React component | **Không** dùng để xuất mesh 3D cho cảnh bay tự do. |
| **Figma** | Thiết kế UI/UX mockup, wireframe 4 màn hình chính, typography retro CRT, color token và user flow. | Wireframe, Prototype link | **Không** dùng để tính toán vật lý hay dựng 3D. |
| **Three.js** | Tích hợp vào Web client: xoay/lắp ráp tàu 3D thời gian thực (Screen 2) và vẽ quỹ đạo hành tinh Mission Viz (Screen 4). | Canvas WebGL runtime | **Không** tự tính toán quỹ đạo (chỉ render từ backend). |
| **React** | Xây dựng vỏ giao diện game, bảng 9 budget, HUD điều khiển, xử lý phím tắt và đồng bộ âm thanh. | Web App DOM / HTML5 | **Không** can thiệp vào vòng lặp tính toán RK4 của Python. |

### 12.1 Thư viện Modular Spacecraft Asset Library (Blender Pipeline)

Thay vì dựng sẵn các con tàu cố định, nhóm sử dụng Blender để xây dựng **Thư viện linh kiện mô-đun hóa**. Mỗi bộ phận là một asset độc lập có thể ghép nối qua các điểm neo (Mount Points / Anchors):

```
Spacecraft (Root)
│
├── 1. Structure / Bus Frame
│   ├── CubeSat 1U / 3U / 6U / 12U Frame (chuẩn CubeSat 101)
│   ├── ESPA-class Ring Bus (vệ tinh cỡ trung)
│   └── Deep Space Probe Bus (khung tải trọng nặng)
│
├── 2. Power Subsystem
│   ├── Body-mounted Solar Cells (ốp thân)
│   ├── Deployable Solar Array (cánh pin gập 2–4 tấm có bản lề)
│   └── Internal Li-ion Battery Pack
│
├── 3. Communication Subsystem
│   ├── Deployable Dipole / Whip Antenna (UHF)
│   ├── S-band / X-band Patch Antenna
│   ├── Parabolic High-Gain Dish Antenna (gimbal 2 trục)
│   └── Optical Laser Communication Terminal
│
├── 4. Propulsion & RCS Subsystem
│   ├── Cold Gas RCS Thruster Nozzle Cluster (4 hướng)
│   ├── Monopropellant Hydrazine Thruster
│   ├── Miniaturized Gridded Ion Engine
│   └── Propellant Tank (hình cầu/hình trụ)
│
├── 5. Payload / Science Instruments Bay
│   ├── High-Resolution Earth/Planetary Camera Barrel
│   ├── Hyperspectral Spectrometer Slit & Optics
│   ├── Deployable Magnetometer Boom (cần dài tránh nhiễu từ thân tàu)
│   └── Synthetic Aperture Radar (SAR) Flat Array
│
└── 6. Avionics & Attitude Control
    ├── Flight Computer Stack (OBC)
    ├── 3-Axis Reaction Wheels Module
    └── Star Tracker Optical Head
```

#### Quy chuẩn kỹ thuật xuất khẩu từ Blender sang Three.js:
- **Hệ tọa độ**: Blender sử dụng Right-Handed $Z$-up $\rightarrow$ Khi xuất glTF, tick chọn `+Y Up` để đồng bộ hoàn hảo với camera Three.js.
- **Điểm gốc (Pivot Point / Origin)**: Luôn đặt tại mặt tiếp xúc lắp ghép (Mount Interface) để khi người chơi đổi linh kiện, part mới tự động bắt dính chính xác vào khung bus mà không bị lệch tâm.
- **Ngân sách đa giác (Polycount Budget)**:
  - CubeSat / SmallSat hoàn chỉnh: $\le 12.000$ triangles.
  - Tên lửa đầy đủ các tầng: $\le 20.000$ triangles.
- **Vật liệu (Material & PBR)**: Dùng chuẩn Metallic-Roughness PBR, gom texture thành một atlas $1024\times 1024$ px hoặc $2048\times 2048$ px, nén bằng Draco / KTX2 để tải dưới 2 giây trên mạng web.

### 12.2 Vai trò và phạm vi của skill `/anatomy`

`/anatomy` tạo **figure isometric** (SVG nhiều chi tiết, đổ bóng bốn tông, có chuyển động nhẹ và số đọc trực tiếp) trong đó **một vật thể thật có cơ chế chính là khái niệm cần giải thích**. Trong dự án, figure layer đảm nhiệm:

- **"Vật thể" của Design Desk** (S3), **bộ dụng cụ của Ops** (S5) và **ảnh tĩnh ở Debrief** (S6);
- **tài liệu in** (poster A4) cho bài nộp (§12.10);
- **Sơ đồ cấu tạo Exploded-view** minh họa sự tương tác cơ khí và luồng năng lượng/dữ liệu giữa các phân hệ (Power Flow, Data Downlink, Thermal Paths) nhằm phục vụ mục tiêu giáo dục (*Learn Panel*).

### 12.3 Quy tắc của skill → hệ quả cho dự án

| Quy tắc của skill | Áp vào dự án |
|---|---|
| Vật thể chính là lời giải thích: chọn một máy/dụng cụ có cơ chế khớp 1-1 với khái niệm; không vẽ hộp và mũi tên | Mỗi figure chọn một dụng cụ thật (cân đòn, thước tính, phễu, bàn quang học, gimbal…) |
| **Truth first**: model thuần (`model.ts`), mọi số trên readout đến từ model | `model.ts` nhận `Snapshot`/`EvaluationReport` và ra mục tiêu + readout. **Không tự tính vật lý** (nguyên tắc 3) |
| Ba cỡ: **Figure** 40–80 chi tiết; **Hero** 80–150; **Epic** (cả phương tiện/công trình) ≥ 6 giờ, **không bắt đầu**, đề xuất bản Hero | Mỗi figure gắn cỡ ở §12.6; Epic bị hạ xuống Hero |
| Tông: nền `lo`, kết cấu `mid`, chủ thể `hi`, đúng một điểm nhấn `lit`; chỉ dùng màu khi màu là dữ liệu | Màu Cosmic nằm ở khung ngoài và HUD. Trong figure chỉ dùng màu cho LED trạng thái, nhiệt của plume, tia link |
| Chữ không nằm trong hình (tối đa một nhãn khắc nhỏ); không logo | Khớp chính sách asset: không in tên hãng/NASA lên thân tên lửa |
| Lấy "độ hoàn thiện" của ảnh tham chiếu, không sao chép vật thể | Ảnh tên lửa thật chỉ để tham chiếu tỉ lệ và bảng màu |
| Chuyển động theo thời gian (easing hoặc lò xo thật); một vòng lặp mỗi figure; **không re-render React mỗi frame**; dừng khi ngoài màn hình; tôn trọng reduced-motion | `update(snapshot)` chỉ đặt **mục tiêu**; figure tự easing; readout lấy từ trạng thái đang hiển thị |
| Kiểm chứng như nhà phê bình: `--audit` ra `audit passed`, `lines.mjs` ra `line ends: 0`, chụp desktop + 390 px, cả hai theme | Cổng chấp nhận §12.9 |

### 12.3 Bake lúc build, ghép slot lúc chạy

Điểm khác biệt so với các ví dụ của skill: hình học của skill được tính **một lần lúc build** (và audit chứng minh thứ tự vẽ). Figure của dự án lại **phụ thuộc dataset**. Giải pháp: **bake từng item catalog** lúc build, runtime chỉ ghép.

```
catalog.json --> figures/<fig>/params.json --> build.mjs (Node, kit /anatomy)
                                                  |  hinh hoc + --audit + line check
                                                  v
                      build/figures/<fig>/<item>.json   (paths, anchors, depth slot)
                                                  |
 RUNTIME:  Snapshot --> model.ts (muc tieu) --> live loop (easing / lo xo) --> setAttribute tren ref
                          ^ chon art da bake theo item id; dat vao mount anchor co dinh
```

- Lệnh `make figures` (§4.7) duyệt mọi item catalog, chạy build + audit, ghi `build/reports/figures.md` (item nào qua/hỏng).
- Dataset ngày thi có item mới → chạy lại `make figures`; item không qua audit hoặc chưa có art → dùng `generic_*` (Data Doctor D13, INFO).
- Bước xuất JSON là **thích ứng của dự án**: skill có quy trình build + audit nhưng không có sẵn bước này, cần viết `tools/bake_figures.mjs` mỏng bọc `build.mjs` `[NEW]`.

### 12.4 Part Kit tham số hoá và quy tắc slot

Part Kit là thư viện builder dùng các hàm hình khối của kit (`slabOf`, `cylinder`, `extrude`, `lathe`, `tubePieces`, `coil`…). Mỗi builder: `(params) → PartSpec { solids, anchors, envelope, tone }`.

| Nhóm | Builder (tham số chính) |
|---|---|
| Tên lửa | `tank(d, h, dome)`, `engine_bell(d, expansion)`, `nozzle_cluster(n, pitch)`, `interstage(d0, d1, h)`, `fairing_ogive(d, h, split)`, `booster(d, h, nose)`, `stage_ring`, `strut` |
| Tàu vũ trụ | `bus_frame(class, dims)`, `solar_wing(n_panels, w, h, hinge)`, `boom`, `thruster_cluster`, `reaction_wheel`, `star_tracker` |
| Ăng-ten | `whip`, `patch`, `horn`, `dish(d)`, `ka_reflector`, `optical_head` |
| Thiết bị khoa học | `camera_barrel`, `spectrometer_slit`, `sar_panel`, `magnetometer_boom`, `particle_detector`, `telescope_tube`, `generic_payload(dims)` |
| Mặt đất / bệ phóng | `pad_deck`, `flame_trench`, `tower_truss`, `swing_arm`, `water_tower`, `lightning_mast`, `ground_dish` |

`figures/kit/kind_map.yaml` ánh xạ `kind` (từ catalog, §4.3) sang builder; `kind` lạ → `generic_*`.

**Quy tắc slot (để thứ tự vẽ luôn đúng và audit phủ được).** Mỗi loại lựa chọn chiếm một **slot cố định** với *envelope* và *khe độ sâu* dành riêng trong thứ tự painter's order: bus cradle ở giữa, khoang thiết bị, cột ăng-ten, hai bản lề cánh pin, giá avionics (OBC, ADCS). Part được **chuẩn hoá vào envelope** (kích thước thật hiển thị trên bảng thông số bằng số, không bằng tỉ lệ vẽ). Nhờ đó đổi part trong slot không làm đổi thứ tự vẽ hay gây va chạm; hai vệ tinh khác nhau hàng chục lần về kích thước vẫn dùng chung một bố cục audit được. Đây là kỹ thuật "khe dành riêng trong thứ tự đã settle" mà skill dùng cho các thành phần sống.

### 12.5 Hợp đồng `FigureModule`

```ts
// web/src/figures/contract.ts
export type Tier = "figure" | "hero" | "epic";

export interface FigureModule<P = unknown> {
  id: string;                                       // "F-03-mass-balance"
  tier: Tier;
  needs: string[];                                  // khoa Snapshot / EvaluationReport ma figure doc (data binding)
  paramsOf(catalog: Catalog, d: DesignSpec): P;     // tham so tinh tu dataset (kich thuoc, so luong)
  mount(el: HTMLElement, opts: { theme: "dark" | "light"; params: P }): FigureHandle;
}

export interface FigureHandle {
  setParams(p: unknown): void;                      // doi slot -> chon art da bake khac
  update(src: Snapshot | EvaluationReport): void;   // dat MUC TIEU (<= 30 Hz); figure tu easing
  describe(): string;                               // aria value text, chi cap nhat khi nguoi dung doi lua chon
  destroy(): void;
}
```

Bố cục thư mục mỗi figure (theo skill, bản React): `web/src/figures/<id>/` gồm `model.ts` (số thật, lò xo, chữ readout; không DOM) · `view.ts` (hằng số bố cục, phép chiếu) · `geometry.ts` (đường vẽ tĩnh) · `frame.ts` (đường vẽ của phần đổi hình dạng) · `art.tsx` (phần tĩnh) · `live.tsx` (ref, vòng lặp, con trỏ/bàn phím, aria) · `figure.css` · `figure.tsx` (thẻ `Plate`). Trong SPA Vite không có server component: vẫn tách **phần tĩnh** và **phần sống** như trên.

**Quy tắc readout** (từ skill): chữ trạng thái và con số đi cùng nhau phải lấy **cùng một thời điểm từ cùng một nguồn**; không trộn số đã easing với từ của trạng thái khác.

### 12.6 Danh mục figure

Vật thể ở cột 2 là **đề xuất**; vật thể cuối cùng chốt ở bước "Invent the object" khi build. Cỡ theo phân loại của skill.

| ID | Vật thể (đề xuất) | Khái niệm | Dữ liệu gắn vào | Cỡ | Ưu tiên |
|---|---|---|---|---|---|
| F-01 | **Giàn xếp tầng tên lửa**: tên lửa treo trong giàn lắp ráp dọc, mắt kính mức nhiên liệu từng tầng, booster song song | Staging, nhiên liệu theo tầng | `stages[]` (catalog), `flight.mass_kg`, `flight.stage`, `flight.thrust_n`, sự kiện `*_SEP` | Hero | P0 |
| F-02 | **Thước tính sổ Δv**: thước 0–10 km/s, các khối trượt (ideal, trọng lực, khí động, lái, quay Trái Đất), con trỏ kính chỉ `v_burnout` | Δv budget và tổn hao | kết quả K-DV | Figure | P1 |
| F-03 | **Cân đòn khối lượng**: đĩa trái bus + thiết bị, đĩa phải sức tải LV, con mã ballast | Biên khối lượng, `capacity_policy` | `EvaluationReport.mass`, constraint `mass` | Figure | P0 |
| F-04 | **Bàn thử điện mặt trời – eclipse**: đèn trên cánh tay quay quanh cánh pin, đĩa bóng, cột pin có mắt kính, đồng hồ tải | Phát điện, tải, SoC | `power.*` | Figure | P1 |
| F-05 | **Phễu đệm dữ liệu với van quay**: băng tải nạp từ thiết bị, van xả theo cửa sổ liên lạc, máng tràn | Data budget, bộ nhớ đầy | `data.*`, `link.state` | Figure | P1 |
| F-06 | **Bàn quang học hai chảo**: chảo phát trên pan-tilt, chảo thu ở đầu kia, thước đo góc, nón chùm bằng nét mảnh | Link margin, sai số hướng | `link.*`, `attitude.boresight_error_deg` | Figure (có thể Hero) | P1 |
| F-07 | **Gimbal 3 vòng** mang vệ tinh, xung RCS | Tư thế 3-DOF, RATE NULL | `attitude.*` | Hero (3D beta) | P1 |
| F-08 | **Tủ đo liều**: cửa kính chì, bộ đếm cơ khí đếm krad, bảng định mức, cần gạt bit-flip | Liều tích lũy so với mức chịu, SEU | `radiation.*` | Figure | P2 |
| F-09 | **Mô hình quỹ đạo để bàn (orrery)** có trục vít hạ cánh tay vệ tinh theo thời gian | Suy giảm quỹ đạo, reboost | `flight.alt_km`, lớp `orbit_keeping` trong `mode_hud` | Figure | P2 |
| F-10 | **Giá lắp ráp vệ tinh**: bus trên cradle, ray và khe cho thiết bị, ăng-ten, cánh pin, OBC, ADCS; mô-đun nổi trên lò xo khi "tách" | Bạn đang xây gì; chọn slot | `design.*`, `constraints[]` (một LED mỗi constraint trên bảng thông số) | Hero | P0 |
| F-11 | **Mô hình bệ phóng**: tháp, cần đu, rãnh dẫn lửa, plume bằng shader | Khoảnh khắc phóng | sự kiện, `flight.thrust_n` | **Epic → Hero** (chỉ tháp + bệ + bóng tên lửa + plume) | P2 |
| F-12 | **Bệ ăng-ten mặt đất az-el**: đĩa, vòng che góc ngẩng, dải thời gian lượt bay qua | AOS/LOS, góc ngẩng | `link.station`, `link.el_deg` | Figure | P2 |

**MVP trước ngày thi:** F-10 + F-01 (Hero) và F-03 (Figure). Tiếp theo F-06, F-07, F-02, F-04, F-05.

### 12.7 Spec chi tiết cho figure ưu tiên

**F-10 — Giá lắp ráp vệ tinh (Hero)**

- *Khái niệm:* mỗi lựa chọn ở Design Desk là một mô-đun vật lý được lắp lên giá.
- *Vật thể:* giá lắp ráp có bàn xoay, cột dẫn hướng, ray ngang; bus nằm trên cradle ở giữa.
- *Chuyển động → ý nghĩa:* mô-đun trượt theo ray vào khe khi chọn; "explode" = các mô-đun nổi lên theo lò xo so le; bảng thông số có LED, mỗi LED là một constraint đạt/trượt.
- *Truth (`model.ts`):* `design.*` → mô-đun nào ở slot nào; `EvaluationReport.constraints[]` → LED; `mass.dry_kg` → số đọc.
- *Tham số từ dataset:* `bus.class`/`dims_m`, `instrument.kind`, `comm.kind`, `power.kind`, số cánh pin; art bake theo id từng item.
- *Slot:* bus cradle, khoang thiết bị, cột ăng-ten, hai bản lề cánh pin, giá avionics.
- *Readout:* `<bus> · <n> mô-đun · <khối lượng> kg khô`.
- *Tương tác:* chọn slot bằng bàn phím hoặc chuột, mũi tên đổi lựa chọn; idle tour tự lắp rồi tách.
- *Fallback:* item không có art → `generic_payload(dims)`; kích thước thật hiển thị bằng số trên bảng thông số.

**F-01 — Giàn xếp tầng tên lửa (Hero)**

- *Khái niệm:* staging và nhiên liệu theo tầng.
- *Vật thể:* tên lửa treo trong giàn lắp ráp dọc; mỗi tầng có mắt kính mức nhiên liệu; booster song song nếu có.
- *Chuyển động → ý nghĩa:* mức nhiên liệu tụt theo `FlightBundle`; tại mỗi sự kiện `*_SEP` tầng rời ra theo lò xo so le rồi trôi; plume (lớp WebGL duy nhất, P1) bật theo `thrust_n`.
- *Truth:* `stages[]` từ catalog, `series.mass_kg`, `series.stage_idx`, `series.thrust_n`, `events`.
- *Tham số:* số tầng, số booster, đường kính và chiều cao từng tầng; fairing có chia đôi hay không.
- *Readout:* `S2 · 38,2 t · T+412 s`.
- *Tương tác:* đồng bộ clock replay của dashboard; idle tour chạy trọn chu trình phóng.
- *Fallback:* LV mới không qua audit → generic stack theo kích thước tầng (tông xám).

**F-03 — Cân đòn khối lượng (Figure)**

- *Khái niệm:* biên khối lượng so với sức tải theo `capacity_policy`.
- *Vật thể:* cân đòn phòng thí nghiệm (đòn, dao tựa, hai đĩa, con mã, thang cung).
- *Chuyển động → ý nghĩa:* đòn nghiêng theo biên `capacity − (dry + payload)`; thêm thiết bị thì một quả cân hạ xuống đĩa trái; con mã trượt = ballast.
- *Truth:* `EvaluationReport.mass` và constraint `mass`.
- *Tham số:* số quả cân bằng số mục trong thiết kế; khối lượng tỉ lệ.
- *Readout:* `biên +312 kg · 87 % sức tải` (số minh hoạ).
- *Fallback:* `capacity_policy: min` thì hiện hai con mã (library và mô hình).

**F-07 — Gimbal 3 vòng (Hero, 3D beta)**

- *Khái niệm:* tư thế 3-DOF; xung RCS làm đổi tốc độ quay (`Δω = τ·t/I`); hướng ăng-ten so với trạm.
- *Vật thể:* gimbal ba vòng lồng nhau mang mô hình vệ tinh, nón chùm ăng-ten.
- *Chuyển động → ý nghĩa:* ba vòng quay theo `attitude.q` (đổi sang roll/pitch/yaw); mỗi xung RCS có phụt nhỏ; vạch sai số hướng.
- *Truth:* `attitude.q`, `omega_dps`, `boresight_error_deg`.
- *Chế độ:* dùng **3D mode (beta)** của skill vì "vật chuyển động theo chiều sâu" chính là ý tưởng; chỉ **một chủ thể** quay 3D mỗi figure (quay nhiều chủ thể là cỡ Epic). Theo skill: engine mới được chứng minh trên ví dụ của skill và một figure thử, chưa trên figure sản xuất; figure nhỏ chạy ≈ 60 fps, nhưng hình rất dày (≈ 380 chi tiết) chỉ ≈ 20 fps ở 1440 px và 13–15 fps trên cấu hình điện thoại giả lập; audit xoay kết thúc bằng `turn audit passed` và chạy đầy đủ mất khoảng 15–20 phút cho 30 chi tiết nên chạy nền. Vì vậy giữ gimbal **thưa chi tiết** và có **fallback**: ba đồng hồ kim + khớp cầu 2.5D.
- *Readout:* `ω 0,4°/s · lệch 1,2°`.

### 12.8 Theme, hiệu năng, tích hợp vỏ web

- **Theme:** build cả dark (mặc định) và light; vỏ web đặt `data-theme` đồng bộ.
- **Hiệu năng:** tối đa **2 figure đang sống** cùng lúc trên một màn, các figure khác tạm dừng bằng `IntersectionObserver`; một scheduler `requestAnimationFrame` dùng chung; giới hạn `devicePixelRatio` ở 1,5; WebGL chỉ cho F-01 (plume) và F-11; script mỗi frame của một figure ≲ 1 ms (hướng dẫn của skill) — đo bằng `performance.measure` `[?]`.
- **Dòng dữ liệu:** engine → `Snapshot` (≈ 30 Hz) → `update()` đặt mục tiêu → figure easing. Không re-render React mỗi frame.
- **Reduced motion:** một khung tĩnh; vẫn đáp ứng input. **Không WebGL:** SVG vẫn đọc được.

### 12.9 Cổng chấp nhận cho mỗi figure

- [ ] `node build.mjs --audit` kết thúc bằng `audit passed` cho **ba bộ tham số**: nhỏ nhất, trung bình, lớn nhất trong catalog (ví dụ 3U / ESPA / GEO; Electron / Ariane 6 / Vulcan).
- [ ] `scripts/lines.mjs` in `line ends: 0` ở cả theme dark và light.
- [ ] Chụp desktop, **390 px**, hover và vài thời điểm chuyển động; đọc từng ảnh.
- [ ] Cận 4× mọi mối nối ở cả hai theme.
- [ ] Reduced motion và không-WebGL đều đọc được.
- [ ] Readout khớp số trong `Snapshot`/`EvaluationReport` mẫu (golden JSON); `aria` có mô tả.
- [ ] Không vượt ≈ 1 ms script mỗi frame.

### 12.10 In ấn và xuất bản

- Kit có công cụ in A4 với ba dạng (**poster**, **drawing**, **detailed**; `scripts/print.mjs`, `scripts/print-sheet.mjs`). Đề xuất làm poster cho F-10, F-01, F-07 làm phụ lục cho bài nộp (Presentation).
- Đăng lên thư viện cộng đồng của Anatomy **chỉ khi nhóm chủ động muốn**; không nằm trên đường găng.

### 12.11 Chạy `/anatomy` thế nào

- Skill viết cho **Claude Code** (cũng chạy trên Antigravity, OpenCode, Codex, MiniMax Code), cần **Node.js ≥ 20.10** và **Chrome/Chromium** cho các bước kiểm tra. Chạy trong repo, không phải trong cuộc chat này.
- Chép thư mục `kit/` của skill vào `web/src/figures/kit/`.
- Dùng mẫu prompt ở **Phụ lục A**; mỗi lần một figure.
- Thời gian theo phân loại của skill (chưa đo ở dự án này): Figure thường dưới 1 giờ, Hero 2–4 giờ, Epic ≥ 6 giờ. MVP (F-10, F-01, F-03) vào khoảng 5–9 giờ agent, có thể chạy song song theo người.

---

## 13. Repo, stack, build, deploy

### 13.1 Cấu trúc thư mục

```
space-mission-game/
├─ README.md
├─ Makefile
├─ data/
│  ├─ raw/                 # (ngay thi) tha dataset vao day; khong sua tay
│  ├─ mapping/             # *.map.yaml · aliases.yaml · kind_rules.yaml
│  ├─ overrides/           # launch_vehicles.yaml · guidance.yaml ... (kem provenance)
│  ├─ geo/                 # launch_sites.yaml · ground_stations.yaml · targets/*.yaml
│  └─ ranges.yaml          # khoang vat ly hop ly cho Data Doctor
├─ missions/
│  ├─ ruleset.yaml · mode_resolver.yaml · _template.mission.yaml
│  └─ MP-SC01-FIRST-EYES.mission.yaml · MP-SC04-GHG.mission.yaml ...
├─ engine/                 # package Python `mission_engine` (khong UI)
│  ├─ gateway/  catalog/  kernels/  rules/  modes/  session/  contract/  api/
├─ tools/                  # tune_guidance · synth_stages · reconcile_capacity · build_bundles
│                          # export_schemas · export_manifests · synth_audio · mutate_dataset
│                          # bake_figures.mjs
├─ build/                  # SINH RA, khong commit: catalog.json · missions/ · bundles/ · figures/
│                          # schemas/ · reports/
├─ web/
│  ├─ src/  engine-client/ · state/ · screens/ · dashboard/ · learn/ · audio/ · input/ · theme/
│  ├─ src/figures/  kit/ (chep tu /anatomy) · contract.ts · <figure-id>/ ...
│  └─ public/  audio/ · textures/
├─ viewers/ursina/         # tuy chon: quay video, doc FlightBundle / Snapshot
├─ legacy/                 # file DD-MM-YYYY cu: chi tham chieu, KHONG import
├─ tests/                  # kernels/ · gateway/ · packs/ · contract/ · golden/ · fixtures/
└─ docs/                   # architecture.md (file nay) · validation.md · assumptions.md · submission/
```

### 13.2 Công nghệ

| Thành phần | Chọn | Ghi chú |
|---|---|---|
| Engine | Python ≥ 3.11, `numpy`, dataclass | Core **không** dùng `scipy`, `pydantic` |
| Gateway (build-time) | `openpyxl` hoặc `pandas`, `PyYAML` (`safe_load`), `difflib`/`rapidfuzz` cho gợi ý mapping | Không chạy trong trình duyệt |
| API | FastAPI, `pydantic` v2, `uvicorn` | Dev và phương án dự phòng |
| Test | `pytest` | Kèm golden JSON |
| Web | Vite + TypeScript + React (vỏ mỏng) | Figure viết bằng TS thuần, gắn vào React qua wrapper dùng `ref` |
| Biểu đồ | Thư viện nhẹ (ví dụ uPlot hoặc Recharts) | Debrief và trang Validity |
| Phương trình | KaTeX | Learn panel |
| Figure | kit `/anatomy` (`iso-kit.ts`, `iso.css`, `react/*`) | Node ≥ 20.10; Chrome/Chromium cho audit |
| Âm thanh | Web Audio API; asset tiền sinh | |
| Viewer phụ | Ursina (quay video); Three.js (P2) | |
| Deploy | Host tĩnh (Vercel, Netlify, GitHub Pages…) + API tùy chọn | Không phụ thuộc nhà cung cấp cụ thể |

**Khoá phiên bản ngay từ đầu** (`requirements.lock`, `package-lock.json`, phiên bản Pyodide). Đã từng vấp: `numpy` 2.x đổi tên `trapz` thành `trapezoid` làm vỡ test ở phiên Δv.

### 13.3 Build và cổng chất lượng

- `make validate` chạy **toàn bộ** test, validation và audit figure; ghi `build/reports/validation.md`.
- Cổng trước khi deploy: ERROR của Data Doctor = 0; mọi preset khớp `expect`; baseline §14.1 không đổi; `audit passed` cho figure đã bake.
- Nếu có CI thì chạy `make validate` mỗi lần đẩy code; nếu không, **chạy tay trước mỗi lần deploy**.

### 13.4 Deploy và "chống giám khảo không chạy được"

Giám khảo toàn cầu chấm sau sự kiện nên sản phẩm phải **sống lâu và không cần cài đặt**:

- **Host tĩnh**: `web/dist` + `build/` (catalog, missions, bundles, figures). Mặc định dùng `BundleEngine`; `PyodideEngine` bật nếu qua cổng spike (§10.4).
- **API (tùy chọn)**: chỉ phục vụ HttpEngine; **không** để đường găng phụ thuộc API sống.
- **Bản offline**: `make offline` đóng gói `dist/` + script chạy `python -m http.server` (trình duyệt chặn `fetch` trên `file://`).
- **Không** cần đăng nhập, khoá API hay tài khoản. Nếu có LLM coach thì phải tắt được và có kết quả cache sẵn.
- Kèm **video demo** (quay từ phiên `session.json` để lặp lại được) và README chạy trong ≤ 5 dòng lệnh.

---

## 14. Validation và test

Validity là điểm dễ thắng nhất của nhóm: vật lý đã được kiểm chứng. Mục tiêu của kiến trúc là **giữ các con số này không đổi** khi đóng gói lại, và đưa chúng ra cho giám khảo thấy.

### 14.1 Ma trận kiểm chứng (baseline)

Cột "Baseline" là số ghi nhận ở các phiên trước; **phải chạy lại và ghi vào `validation.md`** khi đóng gói (chưa chạy lại trong tài liệu này, trừ khung K-ORB ở §6.1).

| Kiểm tra | Phương pháp | Baseline đã ghi nhận | Cổng |
|---|---|---|---|
| RK4 hội tụ | Bay thẳng đứng, không cản, so với `V = g0·[Isp·ln(M0/M) − t]` | Bậc 4: giảm đôi `dt` thì sai số giảm ≈ 15,6× rồi ≈ 11,7×, tới sàn làm tròn ≈ 10⁻⁶ | bậc ≥ 3,5 |
| Hai vật, quỹ đạo tròn | Một vòng; bán kính và cơ năng | Lệch bán kính ≈ 5·10⁻⁶ m, cơ năng ≈ 10⁻¹⁴ (test v1) | ≤ 10⁻³ m |
| Vis-viva (elip) | So `v² = μ(2/r − 1/a)` | Sai số ≈ 10⁻¹¹ m/s | ≤ 10⁻⁶ |
| Chu kỳ | Đo so với `2π·√(a³/μ)` | Lệch tương đối < 10⁻⁵ | ≤ 10⁻⁵ |
| Sổ Δv | `v_burnout` so với `Δv_ideal − tổn hao + v_rot` | Khép sổ < 0,3 % (dư số ≲ 22 m/s); `v_burnout` khớp vận tốc tròn ≈ 7,67 km/s | < 0,5 % |
| Quỹ đạo 8 LV | Độ cao cuối | 396–409 km; 64 tổ hợp LV × bãi × bus đều lên quỹ đạo | 400 ± 10 km |
| Gravity turn | Góc tấn công qua Max-Q | 0,6–6,1° (gravity turn) so với 2,7–15,3° (bảng cũ) | ≤ 8° |
| CW so với Kepler | Tích phân trực tiếp | 0,13 % sau một vòng | ≤ 0,5 % |
| Tư thế | Chuẩn quaternion, phương trình Euler | Cập nhật quaternion nâng lên RK4 (lỗi bậc hai ≈ 2·10⁻⁵ đã sửa) | `‖q‖ − 1 ≤ 10⁻⁹` |
| Vận hành | Vật lý `sat_ops` và `--ops` | 11/11 và 48/48 PASS | giữ nguyên |
| Mission pack | Preset khớp `expect` | mới | 100 % |
| Gateway | Dataset đột biến (§14.2) | mới | xong mapping ≤ 30 phút, ERROR = 0 |
| Tất định | Cùng `seed` → cùng hash đầu ra | mới | hash bằng nhau |
| Hợp đồng | Payload hợp lệ với JSON Schema; golden Python ↔ TS | mới | 100 % |

### 14.2 Diễn tập dataset đột biến (P0, làm trước ngày thi)

`tools/mutate_dataset.py` biến `space_mission_library` hiện có thành một file "lạ" để rehearsal ngày thi:

- đổi tên khoảng 30 % cột; đổi vài cột sang đơn vị khác (lb, kW, MB); đổi tiền tố id;
- thêm một LV mới **thiếu dữ liệu tầng** và một scenario tham chiếu quỹ đạo không tồn tại (để D04 bắt);
- xoá một cột tùy chọn.

Người chưa thấy file phải: `make suggest-map` → sửa mapping → `make ingest` (ERROR = 0) → `make packs` → chơi được, **trong ≤ 30 phút**. Nếu không làm nổi thì cải thiện Gateway trước khi viết thêm tính năng.

### 14.3 Ngân sách hiệu năng và nghe thử

Ngưỡng là đề xuất `[?]`, đo và ghi vào `validation.md`:

| Hạng mục | Native | Pyodide |
|---|---|---|
| `evaluate()` p95 | ≤ 50 ms | ≤ 150 ms |
| `fly()` | ≤ 1 s | ≤ 3 s |
| `OpsSession.step` (1/30 s mô phỏng) | ≤ 4 ms | ≤ 8 ms |
| Script mỗi frame của một figure | ≤ 1 ms | — |
| Hiển thị đầu tiên (bundle) | ≤ 3 s | — |

**Nghe thử âm thanh** (chưa ai nghe bằng tai): đếm ngược rõ nhưng không chói; vòng lặp động cơ không "tick" ở mối nối; N-wave không méo; ù điện và nhiễu tĩnh chịu được khi lặp 1–2 phút; relay click không dồn dập; tổng mức không vượt ngưỡng khi nhiều cue chồng nhau.

---

## 15. Runbook ngày thi

Hôm nay 11/11; sự kiện 14–15/11 (theo thông tin trong dự án — kiểm tra lại lịch chính thức). Chỉ còn **3 ngày làm việc**, nên thứ tự dưới đây là *cắt lát dọc trước, mở rộng sau*.

### 15.1 Trước ngày thi (11–13/11)

Nguyên tắc nâng cấp **không phá bản đang chạy**: game Ursina v6 vẫn là "bản an toàn" cho tới khi web slice chứng minh được.

| Ngày | Việc P0 | Xong khi |
|---|---|---|
| 11/11 (hôm nay) | Duyệt tài liệu này và **chốt D1–D8** (§16.3). Tạo repo + skeleton. Chép kernel vào `engine/` **không sửa logic**. Sinh JSON Schema cho contract | Test baseline của kernel chạy được từ package mới; schema xuất được |
| 12/11 | Gateway + Data Doctor cho library hiện có → `catalog.json`. Mission Pack loader với 3 pack (SC-01, SC-04, thêm một pack). `evaluate()`. **Diễn tập dataset đột biến** (§14.2). Bắt đầu F-10 | `make ingest packs` sạch; mọi preset khớp `expect` |
| 13/11 | `fly()` + `BundleEngine` + `HttpEngine`. Lát cắt web: Brief → Design → Launch replay → Debrief. F-01, F-03. **Spike Pyodide** (2–3 giờ, §10.4). Đóng băng kernel | Một lượt chơi trọn vẹn trên web qua bundle; quyết định Pyodide có/không |

**Cổng quyết định tối 13/11 — "web có đủ ổn không?"** Nếu lượt chơi trên web chưa trọn vẹn: nộp bằng **Ursina + video** làm sản phẩm chính; web chỉ làm trang Validity và Design Desk tĩnh. Quyết định này không làm đổi Gateway, Mission Pack hay kernel.

Ví dụ cắt giảm khi thiếu giờ, theo thứ tự bỏ trước: Mission Builder → Roles/Negotiation → F-04…F-12 → K-INS cho MEO/GTO/GEO → `spectral_scan`/`radar_swath`/`stare`.

### 15.2 Ngày thi (T+0 = giờ bắt đầu; điều chỉnh theo lịch thật)

| Giờ | Việc | Ai (§16.1) | Đầu ra |
|---|---|---|---|
| T+0 → T+1 | Nhận dataset → `data/raw/`. `make suggest-map`, `make ingest`. Đọc báo cáo Data Doctor | C2 + A2 | `data_doctor.md` |
| T+1 → T+3 | Sửa mapping/overrides tới ERROR = 0. `make catalog packs`. Xem feasibility (D12) | C2 + A2 | Catalog mới, pack sạch |
| T+3 → T+6 | Chọn 2–3 mission chủ lực. Chỉnh pack (mô tả, `critical`, preset). `make bundles figures`. Smoke test toàn luồng | A3 + C1 | Luồng chơi trọn vẹn với dataset mới |
| T+6 → T+20 | Polish UI, figure, âm thanh. Thêm mode nếu cần (≤ 1 giờ/mode). Đối chiếu sức tải (G3) | Cả nhóm | — |
| T+20 → T+32 | Trang Validity, docs, poster A4. Quay video từ `session.json` | A3 + C1 | Tài liệu nộp |
| T+32 → T+42 | **Đóng băng code** (chỉ sửa lỗi). Deploy tĩnh. Kiểm tra trên máy khác và điện thoại. Tập thuyết trình | Cả nhóm | Bản deploy ổn |
| T+42 → T+48 | Nộp bài, backup (zip repo + `build/` + video), thời gian dự phòng | — | Bài nộp |

### 15.3 Sự cố ngày thi → xử lý nhanh

| Tình huống | Xử lý |
|---|---|
| Dataset khác hẳn cấu trúc | Giữ catalog hiện tại làm nền; phần mới nhập thành bảng bổ sung ở `overrides/`; mapping từng bảng một, bảng nào xong dùng bảng đó |
| LV mới thiếu dữ liệu tầng | `tools/synth_stages.py` + `tools/tune_guidance.py` (gắn `estimate`); hoặc ẩn LV đó qua `design_space.allow` |
| Mission không có thiết kế khả thi (D12) | Nới `constraints` trong pack hoặc đổi preset; ghi trong narrative đây là "mission khó" |
| Pyodide hỏng hoặc chậm | Chuyển `HttpEngine` + Bundle; không sửa client |
| Figure không qua audit | Dùng `generic_*`; ghi vào `figures.md`; quay lại sau |
| Hết giờ trước khi xong 3 mission | Một mission hoàn chỉnh + hai mission chạy mode chung (`imaging`/`downlink`) |
| Chưa nghe thử âm thanh | Mặc định tắt tiếng, nút bật nổi bật |
| Web chưa ổn ở T+32 | Nộp bằng Ursina + video; web phục vụ trang Validity |

### 15.4 Kịch bản demo 3 phút

1. **0:00–0:30 — Mở đầu:** phóng ở Launch Control, tách tầng, tách vệ tinh.
2. **0:30–1:30 — Hậu quả của quyết định:** preset `fail_data` (UHF) → ô Dữ liệu đỏ ở Design Desk → ở Ops bộ nhớ đầy, mất sóng (thấy và nghe) → đổi sang `good` và khắc phục.
3. **1:30–2:30 — Gameplay:** chụp (hoặc quét phổ) trong cửa sổ bay qua; dùng gimbal để bắt sóng trạm mặt đất.
4. **2:30–3:00 — Validity:** trang S7 (baseline, provenance, nguồn dữ liệu) và câu chốt: "đổi dataset, có mission mới trong 30 phút".

---

## 16. Tổ chức dự án: phân công, rủi ro, quyết định cần chốt

### 16.1 Phân công đề xuất (5 người: 3 hàng không + 2 khoa học máy tính)

Đổi tên người theo nhóm. Mỗi vai có một **người thay thế** để không có điểm nghẽn.

| Vai | Sở hữu | Đầu ra cam kết |
|---|---|---|
| **A1 — Flight dynamics và Sim Core** | K-ASC, K-GDN, K-INS, K-ORB, K-ATT, K-DV; `tune_guidance`; phần vật lý của `FlightBundle`/`Snapshot` | Baseline §14.1 không đổi; K-INS (P1) |
| **A2 — Hệ thống tàu và dữ liệu kỹ thuật** | K-PWR, K-LNK, K-DATA, K-RAD, K-DEC, K-COST; định nghĩa constraint; `overrides` + provenance; `ranges.yaml`; đối chiếu sức tải | Constraint chuẩn; trang "Nguồn và giả định" |
| **A3 — Thiết kế nhiệm vụ, nội dung, Validity** | Mission pack, scoring/explainer, narrative vi/en, Learn registry, trang S7, poster, kịch bản demo; duyệt "vật thể có đúng khái niệm không" cho figure | 3 pack hoàn chỉnh; tài liệu nộp |
| **C1 — Web shell và UX** | Màn hình, dashboard, `EngineClient`, theme, keymap, nối âm thanh, tích hợp figure; chủ trì chạy `/anatomy` | Lát cắt web; F-10, F-01, F-03 |
| **C2 — Gateway, API, build và deploy** | Gateway, mapping, Data Doctor, FastAPI, bundles, `bake_figures`, Makefile/CI, spike Pyodide, bản offline | `make ingest packs bundles figures validate` ổn định |

### 16.2 Rủi ro

| # | Rủi ro | Giảm thiểu / phương án |
|---|---|---|
| R1 | Dataset ngày thi khác schema nhiều | Mapping + Data Doctor + `overrides`; diễn tập đột biến (§14.2); phương án cuối: giữ catalog hiện tại làm nền |
| R2 | Pyodide hỏng hoặc chậm | Cổng spike 13/11; dùng Bundle + HTTP, client không đổi |
| R3 | Số liệu lệch giữa transport/viewer | Một nguồn Python; viewer không tính vật lý; golden test |
| R4 | Phạm vi phình (7 scenario × mode × figure) | Làm kỹ 2–3 mission; còn lại dùng mode chung; MVP figure là F-10, F-01, F-03 |
| R5 | Figure Anatomy ngốn thời gian (Epic, audit) | Hạ Epic xuống Hero; bake và generic fallback; giới hạn 5 figure ưu tiên |
| R6 | Giám khảo không chạy được | Host tĩnh, bản offline, video; không phụ thuộc API sống |
| R7 | Âm thanh chưa nghe thử | Buổi nghe thử (§14.3); mặc định tắt tiếng |
| R8 | Sức tải mô hình khác library (G3) | `capacity_policy`; hiển thị cả hai số; ballast gắn nhãn `calibrated` |
| R9 | Quỹ đạo thiết kế khác quỹ đạo bay (G1) | K-INS (P1); nếu chưa kịp thì **ghi rõ giới hạn** ở UI và trang giả định |
| R10 | Giấy phép asset, font, dữ liệu | Ảnh Blue Marble của NASA (ghi nguồn), font OFL tự host, không logo hãng/NASA; đọc điều khoản của đề và trang nộp bài |
| R11 | Figure chậm trên máy yếu | Tối đa 2 figure sống, dừng khi ngoài màn hình, thử ở 390 px |
| R12 | Cạn sức vào giờ cuối | Đóng băng ở T+32; checklist nộp bài §17.2 |

### 16.3 Quyết định cần chốt (nhật ký quyết định)

Chốt **hôm nay** (11/11) để không đổi kiến trúc giữa chừng. Cột 3 là mặc định đề xuất.

| # | Quyết định | Đề xuất |
|---|---|---|
| D1 | `capacity_policy`: `library`, `model` hay `min` | `library` (bám dataset); chuyến bay vẫn chạy bằng mô hình + ballast có nhãn |
| D2 | Transport mặc định khi nộp | `Bundle` + `Pyodide` nếu qua cổng spike, `Http` dự phòng |
| D3 | Số mission làm kỹ | 2–3: SC-01, SC-04 và một mission theo dataset ngày thi |
| D4 | Công thức điểm | Chuẩn hoá theo §7.4 nhưng đối chiếu `mission_design.py`; cập nhật baseline preset nếu điểm đổi |
| D5 | Roles và đàm phán có vào phạm vi? | P2: chỉ làm nếu web slice và Advisor xong trước T+20 |
| D6 | LLM coach | Mặc định tắt; nếu bật phải có cache và kiểm tra neo số |
| D7 | Viewer chính khi nộp | Web; Ursina dùng quay video và là phương án lùi |
| D8 | Ngôn ngữ UI | Mọi chuỗi có `{vi, en}`; mặc định `en` cho giám khảo toàn cầu, `vi` song song |

---

## 17. Tiêu chí chấm và checklist nộp bài

### 17.1 Kiến trúc đóng góp gì cho từng tiêu chí

Năm tiêu chí dưới đây là **Impact, Creativity, Validity, Relevance, Presentation** như các năm trước của Space Apps; hãy đối chiếu với tiêu chí chính thức của đề 2026 trên trang challenge `[?]`.

| Tiêu chí | Kiến trúc đóng góp | Bằng chứng khi demo |
|---|---|---|
| Impact | Giải thích "vì sao" bằng nguyên nhân gốc; hậu quả nhìn và nghe được; mục tiêu học nằm trong pack | Debrief; Learn panel |
| Creativity | Gameplay theo mission (chụp, quét phổ, giữ quỹ đạo, bắt sóng bằng gimbal); figure "dụng cụ vật thể"; Mission Builder (P2) | Demo ba mode khác nhau; các figure |
| Validity | Kernel tách bạch có baseline; provenance mọi con số; trang S7; tất định và replay | Bảng §14.1; trang Nguồn và giả định |
| Relevance | Bám đủ 5 bước của đề + 6 tài nguyên + dataset ban tổ chức qua Gateway | Bảng R1–R8 (§2); báo cáo Data Doctor |
| Presentation | Link mở ngay không cần cài; video; poster A4; demo 3 phút | Video, poster, README |

### 17.2 Checklist nộp bài

- [ ] Link demo mở được trên máy lạ và điện thoại, không cần đăng nhập.
- [ ] Repo và README chạy được trong ≤ 5 dòng lệnh; có bản offline.
- [ ] Video demo quay từ `session.json` (lặp lại được).
- [ ] Trang "Nguồn và giả định": dataset ban tổ chức/NASA đã dùng, các giá trị `estimate`/`calibrated`, giới hạn còn mở (G1–G8).
- [ ] Trích dẫn nguồn dữ liệu và asset (Blue Marble, font, tài liệu LV công khai).
- [ ] Công bố việc dùng công cụ AI theo quy định của sự kiện `[?]` (kiểm tra yêu cầu trên trang nộp bài).
- [ ] Poster A4 từ `/anatomy` nếu có.
- [ ] Backup: zip repo + `build/` + video + bản offline.

---

## Phụ lục A: Prompt mẫu cho `/anatomy`

Chạy trong Claude Code, tại thư mục `web/`, **mỗi lần một figure**. Thay phần trong `<...>`.

**A.1 Prompt chuẩn (ví dụ F-03, cỡ Figure)**

```text
/anatomy
Figure: F-03 Can don khoi luong   (co: Figure)
Repo: web/ (Vite + React + TypeScript). Chep thu muc kit cua skill vao web/src/figures/kit/. Dung duong React cua skill.
Spec: docs/architecture.md  muc 12.5 (hop dong FigureModule), muc 12.6 (hang F-03), muc 12.7 (spec chi tiet F-03).
Truth: model.ts chi nhan EvaluationReport (docs/architecture.md muc 10.3: truong mass.*, constraints[id=mass]).
       KHONG tu tinh vat ly. Moi so tren readout lay tu model. Chu trang thai va con so lay cung mot thoi diem.
Tham so tu catalog: paramsOf(catalog, design) doc build/catalog.json. So qua can = so muc trong thiet ke.
Bake: xuat build/figures/F-03/<item>.json cho moi item catalog bang tools/bake_figures.mjs. Item khong co art -> generic.
Phong cach: tong anatomy (lo/mid/hi/lit); mau chi cho LED trang thai; khong chu trong hinh (toi da 1 nhan khac nho);
            khong logo; anh tham chieu chi lay do hoan thien, khong chep vat the.
Cong chap nhan: docs/architecture.md muc 12.9 — audit passed cho 3 bo tham so (nho nhat / trung binh / lon nhat),
            line ends: 0, anh 390 px, dark + light, reduced-motion, khong-WebGL.
Giao: tat ca file trong web/src/figures/F-03-mass-balance/ + anh chup + bao cao audit.
```

**A.2 Biến thể cho figure cỡ Hero (F-10, F-01, F-07)**

Thêm vào prompt chuẩn:

```text
Co: Hero. Neu khi do bao thay vuot Hero (>= Epic), DUNG LAI va de xuat ban Hero truoc khi lam.
Slot: tuan theo quy tac slot (muc 12.4): moi loai lua chon chiem mot khe co dinh trong thu tu ve.
Chi mot lop WebGL (plume) va chi cho F-01; SVG phai doc duoc khi khong co WebGL.
F-07 dung 3D mode (beta) cho dung mot chu the; neu audit xoay qua cham hoac khong on dinh, quay lai fallback 2.5D (3 dong ho kim + khop cau).
```

**A.3 Thứ tự đề xuất**

- Thứ tự làm: F-10 (Hero) → F-01 (Hero) → F-03 (Figure) → F-06 → F-07 → F-02, F-04, F-05 (nếu còn giờ).
- Sau mỗi figure: đưa vào Design Desk/Ops thật bằng `EngineClient` + golden `Snapshot` trước khi làm figure kế tiếp (tránh dồn tích hợp về cuối).

---

## Phụ lục B: Ký hiệu và thuật ngữ

| Ký hiệu | Nghĩa | Đơn vị |
|---|---|---|
| `V`, `γ` | Vận tốc, góc đường bay | m/s, rad |
| `Isp`, `g0` | Xung lực riêng, gia tốc trọng trường chuẩn | s, m/s² |
| `ṁ`, `F` | Lưu lượng khối, lực đẩy (`F = ṁ·g0·Isp`) | kg/s, N |
| `μ` | Tham số hấp dẫn của Trái Đất (≈ 3,986·10¹⁴) | m³/s² |
| `Λ` | Tỉ số khối lượng `M0/Me` | — |
| `ρ`, `S`, `CD` | Mật độ khí (ISA), diện tích tham chiếu, hệ số cản | kg/m³, m², — |
| `q_pa` | **Áp suất động** `½ρV²` (đừng nhầm với quaternion) | Pa |
| `attitude.q` | **Quaternion** tư thế | — |
| `i`, `β`, `lat` | Độ nghiêng quỹ đạo, góc phương vị phóng, vĩ độ bãi | deg |
| `ω`, `ωE` | Tốc độ góc, tốc độ quay Trái Đất (≈ 7,292·10⁻⁵) | rad/s |
| `L_g`, `L_d`, `L_s` | Tổn hao Δv do trọng lực, khí động, lái | m/s |

Thuật ngữ: **AOS/LOS** bắt đầu/kết thúc lượt bay qua trạm · **CW** Clohessy–Wiltshire · **ECI** hệ quán tính tâm Trái Đất · **EIRP**, **G/T**, **FSPL** các đại lượng trong link budget · **MECO/SECO** tắt động cơ chính/tầng trên · **Max-Q** áp suất động cực đại · **SEU** lỗi do một hạt năng lượng cao · **SoC** mức pin · **SADA** cơ cấu xoay cánh pin · **RCS** hệ đẩy điều khiển tư thế · **ADCS** điều khiển tư thế · **OBC** máy tính bay · **LEO/SSO/POLAR/MEO/GTO/GEO** các lớp quỹ đạo.

---

## Phụ lục C: Quy ước làm việc (giữ xuyên suốt dự án)

Tóm tắt từ cách làm ở v3 và các yêu cầu đã nêu; bản đầy đủ nằm ở mục 12 của `07-11-2026-rocket_v3_realtime_multistage_audio_notes.md`.

1. **Vật lý trước, hình ảnh sau.** Kiểm chứng bằng số rồi mới báo là xong.
2. **Code:** tách module, giữ nguyên tên biến/hàm theo sách, mỗi phương trình trên một dòng, hạn chế hàm nâng cao, chú thích tiếng Việt không dấu.
3. **Quy trình:** lập kế hoạch và chờ duyệt trước khi sửa lõi; xin xác nhận trước khi ghi đè file có sẵn.
4. **Tên file** `DD-MM-YYYY-...`; không ghi đè file cũ; cuối mỗi việc liệt kê file đã tạo/sửa.
5. **Trung thực:** báo thẳng hạn chế và điều chưa kiểm chứng; không chỉnh số cho đẹp.
6. **Test đi cùng thay đổi lõi:** baseline không được đổi âm thầm.
7. **Mới:** mọi con số có `provenance`; mọi dữ liệu đi qua Gateway; viewer không tính vật lý.

---

## Phụ lục D: Ma trận phân tích và ánh xạ 13 tài nguyên NASA (NASA Resource Mapping Matrix)

Bảng ma trận tổng hợp toàn bộ 9 tài nguyên chính thức từ đề bài NASA Space Apps Challenge 2026 kèm 4 nguồn dữ liệu mở rộng, xác định rõ vai trò kỹ thuật, layer tiếp nhận và mức độ ưu tiên triển khai:

| # | Tài nguyên NASA | Loại tài nguyên | Ánh xạ vào Kiến trúc Game | Trách nhiệm Module | Mức ưu tiên |
|---|---|---|---|---|---|
| **1** | **Design & Develop Science Missions** | Systems Engineering Docs | Chu trình 6 giai đoạn (§2.1) & 4 segments (Launch, Space, Ground, User); định hình luồng người chơi từ Brief đến Debrief. | L2 Mission Pack, L5 Session FSM | **Rất cao (P0)** |
| **2** | **CubeSat 101** | Technical Reference | Cơ sở xây dựng cấu trúc 7 subsystem tàu và kho linh kiện chuẩn hóa (Component Dataset Schema, §4.9). | L1 Catalog, L0 Gateway | **Rất cao (P0)** |
| **3** | **General Mission Analysis Tool (GMAT)** | Mission Simulation Software | Tham chiếu kiểm chứng Level 1 RK4 và adapter Level 2 High-Fidelity cho chuyển tiếp liên hành tinh (§6.6). | L3 Kernels (`gmat_adapter.py`) | **Cao (P1)** |
| **4** | **NASA Mission Viz** | 3D Web Visualizer | Quy chuẩn schema quỹ đạo Cartesian ECI J2000 và hiển thị hành tinh/đường bay trên Three.js (§11.6). | L7 Presentation (`threejs/`) | **Cao (P0/P1)** |
| **5** | **Concept Maturity Levels (CMLs)** | Evaluation Framework | Bộ chỉ số Mission Maturity Score (CML 1–4) và cơ chế mở khóa tính năng theo mức độ khả thi (§7.7). | L4 Rules (`evaluate.py`) | **Cao (P0)** |
| **6** | **Mission Design Lab (MDL)** | Design Center Workflow | Cơ chế đánh đổi đa phân hệ (Trade studies: Science vs Mass vs Power vs Budget vs Link) và Dashboard kỹ thuật (§7.8). | L4 Advisor, L7 Dashboard | **Cao (P0)** |
| **7** | **A Learning Game About Telescopes** | Educational Game Reference | Logic phụ thuộc đa tầng (Dependency System: Objective $\rightarrow$ Observation $\rightarrow$ Instrument $\rightarrow$ Orbit) và nguyên tắc Choice $\rightarrow$ Consequence $\rightarrow$ Feedback. | L4 Rules & Mode Resolver | **Cao (P1)** |
| **8** | **Space Apps 2023 VR Cycler** | Product Inspiration | Trải nghiệm trực quan 3D quỹ đạo theo dòng thời gian (timeline scrubber, event playback, camera POVs). | L7 Presentation & Three.js | **Trung bình (P1)** |
| **9** | **CSA Digital Games** | Educational UX | Phương pháp truyền tải kiến thức kỹ thuật hàng không phức tạp thành mini-game trực quan, dễ hiểu. | L7 Presentation & HUD cues | **Tham khảo (P2)** |
| **10** | **NAIF SPICE** | Observation Geometry System | Dữ liệu chính xác về vị trí, hình học quan sát và khung tọa độ thiên thể (`SpiceyPy` backend / baked tables web, §4.10). | L0 Gateway, L3 Kernels | **Cao (P1)** |
| **11** | **JPL Horizons** | Planetary Ephemeris API | Bảng tọa độ và vận tốc thiên thể theo Epoch chuẩn J2000 phục vụ đồng bộ quỹ đạo Trái Đất – Mặt Trăng – Sao Hỏa (§4.10). | `tools/fetch_horizons.py` | **Cao (P1)** |
| **12** | **Planetary Data System (PDS)** | Scientific Data Archive | Dữ liệu quang phổ bề mặt, suất phản chiếu và bản đồ độ cao phục vụ tính toán điều kiện hạ cánh và texture 3D. | L0 Gateway (`data/geo/`) | **Trung bình (P2)** |
| **13** | **NASA Solar System Exploration** | Planetary Physical Database | Bộ thông số chuẩn về khối lượng, bán kính, tham số hấp dẫn $\mu$, mật độ khí quyển cho các hành tinh (§4.9). | `celestial_bodies.yaml` | **Cao (P0)** |

*— Hết tài liệu v0.2 —*
