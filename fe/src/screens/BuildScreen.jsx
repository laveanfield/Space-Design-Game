import React, { useMemo } from 'react';
import { beep } from '../api/client';
import { CoreTelemetryBars, DatasheetTotals, Logbook } from '../components/CampaignPanels';
import Hangar3DCanvas from '../components/Hangar3DCanvas';
import PartCard from '../components/PartCard';
import TrajectoryScope from '../components/TrajectoryScope';
import { DEV } from '../core/devFlag';
import { SLOTS } from '../core/gameMachine';
import { useGame } from '../core/GameContext';
import { tr, tx } from '../core/i18n';

const SLOT_TAB_NAMES = {
  orbit: { vi: 'QUỸ ĐẠO', en: 'ORBIT' },
  instruments: { vi: 'CẢM BIẾN', en: 'INSTR' },
  bus: { vi: 'KHUNG', en: 'BUS' },
  power: { vi: 'PIN MT', en: 'POWER' },
  battery: { vi: 'ẮC QUY', en: 'BATT' },
  comm: { vi: 'TRUYỀN TIN', en: 'COMM' },
  obc: { vi: 'MÁY TÍNH', en: 'OBC' },
  adcs: { vi: 'ĐIỀU HƯỚNG', en: 'ADCS' },
  launch: { vi: 'TÊN LỬA', en: 'LAUNCH' },
};

export default function BuildScreen() {
  const {
    lang,
    catalog,
    missionDetail,
    scenario,
    design,
    activeSlot,
    setActiveSlot,
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

  const cost = Number(evalReport?.metrics?.['cost.total_musd'] || 0);
  const budget = Number(effectiveBudget ?? scenario.budget_musd ?? 0);
  const months = Number(evalReport?.metrics?.['schedule.months'] || 0);
  const deadline = Number(effectiveDeadline ?? scenario.deadline_months ?? 0);
  const overBudget = budget > 0 && cost > budget;
  const overTime = deadline > 0 && months > deadline;
  const budgetPct = Math.min(100, budget > 0 ? (cost / budget) * 100 : 0);
  const timePct = Math.min(100, deadline > 0 ? (months / deadline) * 100 : 0);

  return (
    <div className="phase-stage">
      <div className="phase-header-plaques build-plaques">
        <div className="rivet-plaque plaque-title-cell">
          <span className="plaque-kicker">{tr(lang, 'GIAI ĐOẠN 1', 'PHASE 1')}</span>
          <strong>{tr(lang, 'CHẾ TẠO', 'BUILD MODE')}</strong>
        </div>

        <div
          className={`rivet-plaque ${overBudget ? 'crit' : ''}`}
          title={tr(lang, 'Chi phí thiết kế / Ngân sách cho phép', 'Design cost / Authorized budget')}
        >
          <div className="plaque-metric-row">
            <span>{tr(lang, 'NGÂN SÁCH', 'BUDGET')}</span>
            <strong>${cost.toFixed(1)} / {budget || '-'}M</strong>
          </div>
          <div className="plaque-mini-bar">
            <div className={`plaque-mini-fill ${overBudget ? 'err' : ''}`} style={{ width: `${budgetPct}%` }} />
          </div>
        </div>

        <div
          className={`rivet-plaque ${overTime ? 'crit' : ''}`}
          title={tr(lang, 'Thời gian chế tạo / Hạn chót: trễ hạn sẽ bị trừ giờ kiểm định', 'Lead time / Deadline: delays reduce inspection window')}
        >
          <div className="plaque-metric-row">
            <span>{tr(lang, 'HẠN CHÓT', 'DEADLINE')}</span>
            <strong>{months.toFixed(0)} / {deadline || '-'} {tr(lang, 'THÁNG', 'MO')}</strong>
          </div>
          <div className="plaque-mini-bar">
            <div className={`plaque-mini-fill ${overTime ? 'warn' : ''}`} style={{ width: `${timePct}%` }} />
          </div>
        </div>

        <div
          className="rivet-plaque plaque-attempt-cell"
          title={tr(lang, 'Số lần thử và Uy tín với Sếp: mất tàu hoặc vượt trần sẽ bị trừ điểm uy tín', 'Attempts & Authority: lost spacecraft or budget overrun deducts authority')}
        >
          <div className="plaque-metric-row">
            <span>{tr(lang, 'LẦN THỬ', 'ATTEMPT')}</span>
            <strong>#{attempts + 1}</strong>
          </div>
          <div className="plaque-rep-row">
            <span className="muted" style={{ fontSize: 11 }}>{tr(lang, 'UY TÍN', 'AUTHORITY')}</span>
            <span className="rep-pips">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`rep-pip ${i < reputation ? 'on' : ''}`} />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="design-grid">
        {/* Left: Kho linh kien */}
        <section className="panel" data-tutorial="build-slots">
          <h2 className="panel-title">
            <span>{tr(lang, 'KHO LINH KIỆN', 'SUBSYSTEM SLOTS')}</span>
            <span className="small muted">{design.orbit}</span>
          </h2>

          {DEV && (
            <div className="row-wrap" style={{ marginBottom: 8 }}>
              {(missionDetail?.presets || []).map((p) => (
                <button key={p.id} className="btn small" onClick={() => applyPreset(p.id)}>
                  {p.id}
                </button>
              ))}
            </div>
          )}

          <div className="slot-tabs">
            {SLOTS.map((s) => (
              <button
                key={s.id}
                className={`slot-tab ${activeSlot === s.id ? 'active' : ''}`}
                onClick={() => {
                  beep(audioOn, 620, 0.025);
                  setActiveSlot(s.id);
                }}
              >
                {SLOT_TAB_NAMES[s.id]?.[lang] || s.label}
              </button>
            ))}
          </div>

          <div className="option-list">
            {activeSlot === 'launch' && allSites.length > 0 && (
              <div className="launch-site-selector" style={{ marginBottom: 10 }}>
                <div className="small muted" style={{ marginBottom: 4 }}>
                  {tr(lang, 'BÃI PHÓNG TÊN LỬA', 'LAUNCH SITE')}
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
                      {s.name || s.id} • {Number(s.lat_deg).toFixed(1)}°
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              const wrongOrbit = activeSlot === 'orbit' && allowedOrbits.length > 0 && !allowedOrbits.includes(item.id);
              const warnText = noFit
                ? `${tr(lang, 'SAI LỆCH KHOANG MŨI FAIRING', 'FAIRING MISMATCH')}: ${tx(fit.reason, lang)}`
                : wrongOrbit
                  ? tr(lang, 'NGOÀI QUỸ ĐẠO KHUYẾN NGHỊ', 'NON-RECOMMENDED ORBIT')
                  : null;

              const pick = () =>
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

              return (
                <PartCard
                  key={item.id}
                  slot={activeSlot}
                  item={item}
                  selected={selected}
                  warnText={warnText}
                  deadlineMonths={effectiveDeadline}
                  onPick={pick}
                />
              );
            })}
          </div>

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
            <span>{tr(lang, 'VỊNH TÍCH HỢP 3D', '3D INTEGRATION BAY')}</span>
            <span className="small muted">{(design.instruments || []).join(', ')}</span>
          </h2>

          <Hangar3DCanvas design={design} catalog={catalog} theme={theme} />
          <TrajectoryScope flight={preview} runs={previewRuns} updating={previewUpdating} />

          <div className="nofit-slot">
            {currentFit && !currentFit.ok ? (
              <div className="nofit-banner small">
                ! {tr(lang, 'CẢNH BÁO TÍCH HỢP:', 'INTEGRATION ALERT:')} {tx(currentFit.reason, lang)} — {tr(lang, 'Dự kiến vỡ fairing tại Max-Q khi phóng thử', 'Fairing breakup expected at Max-Q during launch')}
              </div>
            ) : (
              <div className="nofit-banner ok small">
                ✓ {tr(lang, 'VỪA VỚI VỎ TÊN LỬA', 'FAIRING FIT OK')}
              </div>
            )}
          </div>

          <div className="row-between build-action-row" style={{ marginTop: 12 }}>
            <span className="small muted">LAUNCH ANYTHING: {tr(lang, 'MỌI CẤU HÌNH ĐỀU ĐƯỢC CHUYỂN QUA KIỂM ĐỊNH', 'ALL CONFIGURATIONS PROCEED TO INSPECTION')}</span>
            <button
              className="btn primary hazard hazard-cta"
              data-tutorial="build-next"
              disabled={busy || reputation <= 0}
              onClick={enterInspect}
            >
              ▶ {tr(lang, 'TIẾP TỤC ĐẾN KIỂM ĐỊNH', 'GO TO INSPECTION')}
            </button>
          </div>
        </section>

        {/* Right: Chi so song con, ngan sach, datasheet, nhat ky */}
        <section className="panel" data-tutorial="build-telemetry">
          <h2 className="panel-title">
            <span>{tr(lang, 'THÔNG SỐ HỆ THỐNG', 'SYSTEMS TELEMETRY')}</span>
            <span className="small muted">
              {design.launch?.vehicle} @ {design.launch?.site}
            </span>
          </h2>
          <CoreTelemetryBars bars={coreBars} />
          <DatasheetTotals metrics={evalReport?.metrics} />
          <Logbook entries={logbook} />
        </section>
      </div>
    </div>
  );
}
