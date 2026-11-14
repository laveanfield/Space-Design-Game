import React, { useMemo } from 'react';
import { beep } from '../api/client';
import { BossPanel, CoreTelemetryBars, DatasheetTotals, Logbook, tx } from '../components/CampaignPanels';
import Hangar3DCanvas from '../components/Hangar3DCanvas';
import PartCard from '../components/PartCard';
import TrajectoryScope from '../components/TrajectoryScope';
import { DEV } from '../core/devFlag';
import { SLOTS, getPartInsight, isSlotUnlocked } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

export default function BuildScreen() {
  const {
    tutorialMode,
    catalog,
    missionDetail,
    scenario,
    design,
    activeSlot,
    selectSlot,
    buildStage,
    confirmSlotAndAdvance,
    updateDesign,
    applyPreset,
    evalReport,
    coreBars,
    preview,
    previewRuns,
    previewUpdating,
    fitOf,
    currentFit,
    enterInspect,
    reputation,
    attempts,
    budgetBonus,
    deadlineBonus,
    effectiveBudget,
    effectiveDeadline,
    logbook,
    theme,
    audioOn,
    busy,
  } = useGame();

  const tables = catalog?.tables || {};

  const slotEntries = useMemo(() => {
    if (!tables || !activeSlot) return [];
    if (activeSlot === 'orbit') return Object.values(tables.orbits || {});
    if (activeSlot === 'instruments') return Object.values(tables.instruments || {});
    if (activeSlot === 'bus') return Object.values(tables.buses || {});
    if (activeSlot === 'power') return Object.values(tables.power_arrays || {});
    if (activeSlot === 'battery') return Object.values(tables.batteries || {});
    if (activeSlot === 'comm') return Object.values(tables.comms || {});
    if (activeSlot === 'obc') return Object.values(tables.avionics || {}).filter((a) => !a.type || a.type === 'obc');
    if (activeSlot === 'adcs') return Object.values(tables.avionics || {}).filter((a) => a.type === 'adcs');
    if (activeSlot === 'launch') return Object.values(tables.launch_vehicles || {});
    return [];
  }, [tables, activeSlot]);

  const selectedVehicle = tables.launch_vehicles?.[design?.launch?.vehicle];
  const compatibleSites = (selectedVehicle?.compatible_site_ids || [])
    .map((sid) => tables.launch_sites?.[sid])
    .filter(Boolean);
  const allSites = Object.values(tables.launch_sites || {});

  if (!design) return null;

  const currentSlotIdx = SLOTS.findIndex((s) => s.id === activeSlot);
  const currentSlotMeta = SLOTS[currentSlotIdx] || SLOTS[0];
  const isLastSlot = currentSlotIdx >= SLOTS.length - 1;

  // Tim linh kien dang duoc chon trong tab hien tai de hien thi Loi ich / Tac hai
  const currentSelectedItem = slotEntries.find((item) => {
    if (activeSlot === 'instruments') return (design.instruments || []).includes(item.id);
    if (activeSlot === 'launch') return design.launch?.vehicle === item.id;
    return design[activeSlot] === item.id;
  });
  const currentInsight = getPartInsight(activeSlot, currentSelectedItem);

  return (
    <div className="phase-stage">
      <div className="phase-header-plaques">
        <div className="rivet-plaque title">
          {tutorialMode ? 'SANDBOX TUTORIAL // PHASE 1: THIẾT KẾ TỪNG THÀNH PHẦN (1–9)' : 'PHASE 1: BUILD MODE'}
        </div>
        <div className="rivet-plaque">
          BUDGET: <strong>{tutorialMode ? 'SANDBOX ($999M)' : `$${effectiveBudget ?? scenario.budget_musd ?? '-'}M`}</strong>
        </div>
        <div className="rivet-plaque">
          DEADLINE: <strong>{tutorialMode ? 'UNLIMITED (SANDBOX)' : `MONTH ${effectiveDeadline ?? scenario.deadline_months ?? '-'}`}</strong>
        </div>
      </div>

      <div className="design-grid">
        {/* Left: Kho linh kien */}
        <section className="panel" data-tutorial="build-slots">
          <h2 className="panel-title">
            <span>LẮP RÁP TUẦN TỰ (BƯỚC {currentSlotIdx + 1}/9)</span>
            <span className="small muted">{design.orbit}</span>
          </h2>

          {/* Thanh tien trinh 9 buoc */}
          <div className="build-seq-bar nine-steps">
            {SLOTS.map((s, idx) => {
              const unlocked = isSlotUnlocked(s.id, buildStage);
              const isCurrent = activeSlot === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!unlocked}
                  className={`seq-step ${unlocked ? 'done' : 'locked'} ${isCurrent ? 'current' : ''}`}
                  title={unlocked ? s.title : s.lockHint}
                  onClick={() => {
                    if (!unlocked) return;
                    beep(audioOn, 620, 0.025);
                    selectSlot(s.id);
                  }}
                >
                  {unlocked ? s.label : `🔒${idx + 1}`}
                </button>
              );
            })}
          </div>

          {DEV && (
            <div className="row-wrap" style={{ marginBottom: 8 }}>
              {(missionDetail?.presets || []).map((p) => (
                <button key={p.id} className="btn small" onClick={() => applyPreset(p.id, true)}>
                  {p.id}
                </button>
              ))}
            </div>
          )}

          <div className="slot-tabs">
            {SLOTS.map((s) => {
              const unlocked = isSlotUnlocked(s.id, buildStage);
              return (
                <button
                  key={s.id}
                  className={`slot-tab ${activeSlot === s.id ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                  disabled={!unlocked}
                  title={unlocked ? `${s.title}: ${s.shortDesc}` : s.lockHint}
                  onClick={() => {
                    if (!unlocked) return;
                    beep(audioOn, 620, 0.025);
                    selectSlot(s.id);
                  }}
                >
                  {!unlocked ? `🔒 ${s.label}` : s.label}
                </button>
              );
            })}
          </div>

          {/* Hop gioi thieu chi tiet vai tro thanh phan + nut TIEP THEO */}
          <div className="slot-intro-box">
            <div className="slot-intro-head">{currentSlotMeta.title}</div>
            <div className="slot-intro-body">
              {currentSlotMeta.shortDesc}{' '}
              <span className="neon-green">{currentSlotMeta.highlight}</span>
            </div>
            {currentSelectedItem && currentInsight && (
              <div className="slot-selected-summary">
                <div className="small">
                  <strong className="neon-green">ĐANG CHỌN: {currentSelectedItem.name || currentSelectedItem.id}</strong>
                </div>
                <div className="small">• <b>Dùng ở đâu:</b> {currentInsight.where}</div>
                <div className="small ok-text">• <b>Lợi ích (+):</b> {currentInsight.pros}</div>
                <div className="small warn-text">• <b>Tác hại (-):</b> {currentInsight.cons}</div>
              </div>
            )}
            <div className="slot-intro-actions">
              <span className="small muted">Click thử các lựa chọn bên dưới để so sánh thông số & 3D</span>
              <button
                type="button"
                className="btn small neon-btn"
                onClick={() => {
                  beep(audioOn, 760, 0.04);
                  if (isLastSlot) {
                    confirmSlotAndAdvance();
                    enterInspect();
                  } else {
                    confirmSlotAndAdvance();
                  }
                }}
              >
                {isLastSlot
                  ? 'HOÀN TẤT 9 MỤC → SANG TÌM LỖI [03] →'
                  : `TIẾP THEO: MỞ ${currentSlotMeta.nextLabel} →`}
              </button>
            </div>
          </div>

          <div className="option-list">
            {slotEntries.map((item) => {
              const isInstr = activeSlot === 'instruments';
              const isLaunch = activeSlot === 'launch';
              const selected = isInstr
                ? (design.instruments || []).includes(item.id)
                : isLaunch
                  ? design.launch?.vehicle === item.id
                  : design[activeSlot] === item.id;

              const allowedOrbits = scenario.allowed_orbit_ids || [];
              const fit = isLaunch ? fitOf(item.id) : null;
              const noFit = fit && !fit.ok;
              const wrongOrbit =
                !tutorialMode && activeSlot === 'orbit' && allowedOrbits.length > 0 && !allowedOrbits.includes(item.id);
              const warnText = noFit
                ? `FAIRING MISMATCH: ${tx(fit.reason)}`
                : wrongOrbit
                  ? `NGOÀI QUỸ ĐẠO KHUYẾN NGHỊ`
                  : null;

              const pick = () => {
                updateDesign((d) => {
                  if (isInstr) {
                    const cur = d.instruments || [];
                    if (cur.includes(item.id)) {
                      if (cur.length > 1) d.instruments = cur.filter((x) => x !== item.id);
                    } else {
                      d.instruments = [...cur, item.id];
                    }
                  } else if (isLaunch) {
                    const sites = item.compatible_site_ids || [];
                    const nextSite = sites.includes(d.launch?.site) ? d.launch.site : sites[0] || d.launch?.site;
                    d.launch = { vehicle: item.id, site: nextSite };
                  } else {
                    d[activeSlot] = item.id;
                  }
                });
                // Khong nhay tab ngay de nguoi choi thoai mai doc Loi ich / Tac hai va suy nghi!
              };

              return (
                <PartCard
                  key={item.id}
                  slot={activeSlot}
                  item={item}
                  selected={selected}
                  warnText={warnText}
                  budgetMusd={effectiveBudget ?? scenario.budget_musd}
                  onPick={pick}
                />
              );
            })}
          </div>

          {activeSlot === 'launch' && allSites.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="small muted" style={{ marginBottom: 4 }}>
                BÃI PHÓNG TƯƠNG THÍCH (LAUNCH SITE)
              </div>
              <div className="row-wrap">
                {(compatibleSites.length > 0 ? compatibleSites : allSites).map((s) => (
                  <button
                    key={s.id}
                    className={`btn ${design.launch?.site === s.id ? 'primary' : ''}`}
                    onClick={() =>
                      updateDesign((d) => {
                        d.launch = { ...d.launch, site: s.id };
                      })
                    }
                  >
                    {s.name || s.id} ({Number(s.lat_deg).toFixed(1)}°)
                  </button>
                ))}
              </div>
            </div>
          )}

          {DEV && (
            <div className="slider-row">
              <div className="row-between small">
                <span className="muted">HAZARD SEED</span>
                <span>#{design.seed ?? 0}</span>
              </div>
              <input
                type="range"
                min="0"
                max="99"
                value={Number(design.seed ?? 0)}
                onChange={(e) => {
                  const seed = Number(e.target.value);
                  updateDesign((d) => {
                    d.seed = seed;
                  });
                }}
              />
            </div>
          )}
        </section>

        {/* Center: Model 3D + Live Trajectory Scope */}
        <section className="panel lantern-panel" data-tutorial="build-hangar">
          <h2 className="panel-title">
            <span>3D INTEGRATION BAY</span>
            <span className="small muted">{(design.instruments || []).join(', ')}</span>
          </h2>

          <Hangar3DCanvas design={design} catalog={catalog} theme={theme} />
          <TrajectoryScope flight={preview} runs={previewRuns} updating={previewUpdating} />

          {currentFit && !currentFit.ok && (
            <div className="nofit-banner small">
              ! CẢNH BÁO TÍCH HỢP: {tx(currentFit.reason)} (Vẫn cho phép phóng thử — dự kiến vỡ fairing tại Max-Q)
            </div>
          )}

          <div className="row-between" style={{ marginTop: 12 }}>
            <span className="small muted">LAUNCH ANYTHING: MỌI CẤU HÌNH ĐỀU ĐƯỢC CHUYỂN QUA KIỂM ĐỊNH</span>
            <button
              className="btn primary hazard hazard-cta"
              data-tutorial="build-next"
              disabled={busy || reputation <= 0}
              onClick={enterInspect}
            >
              [ GO TO INSPECTION ]
            </button>
          </div>
        </section>

        {/* Right: Chi so song con, ngan sach, datasheet, nhat ky */}
        <section className="panel" data-tutorial="build-telemetry">
          <h2 className="panel-title">
            <span>SYSTEMS TELEMETRY</span>
            <span className="small muted">
              {design.launch?.vehicle} @ {design.launch?.site}
            </span>
          </h2>
          <BossPanel
            scenario={scenario}
            metrics={evalReport?.metrics}
            reputation={reputation}
            attempts={attempts}
            budgetBonus={budgetBonus}
            deadlineBonus={deadlineBonus}
          />
          <CoreTelemetryBars bars={coreBars} />
          <DatasheetTotals metrics={evalReport?.metrics} />
          <Logbook entries={logbook} />
        </section>
      </div>
    </div>
  );
}
