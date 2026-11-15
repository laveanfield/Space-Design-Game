import React, { useMemo, useState } from 'react';
import { beep } from '../api/client';
import { CoreTelemetryBars, DatasheetTotals, Logbook } from '../components/CampaignPanels';
import Hangar3DCanvas from '../components/Hangar3DCanvas';
import MissionComms from '../components/MissionComms';
import PartCard from '../components/PartCard';
import TrajectoryScope from '../components/TrajectoryScope';
import { DEV } from '../core/devFlag';
import { SLOTS, getPartInsight } from '../core/gameMachine';
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
    tutorialMode,
    catalog,
    missionDetail,
    scenario,
    design,
    activeSlot,
    setActiveSlot,
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
  const [showSlotGuide, setShowSlotGuide] = useState(false);

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

  // Tim linh kien dang duoc chon de hien ten trong thanh thao tac gon.
  const currentSelectedItem = slotEntries.find((item) => {
    if (activeSlot === 'instruments') return (design.instruments || []).includes(item.id);
    if (activeSlot === 'launch') return design.launch?.vehicle === item.id;
    return design[activeSlot] === item.id;
  });
  const currentInsight = currentSelectedItem ? getPartInsight(activeSlot, currentSelectedItem) : null;

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
          <span className="plaque-kicker">
            {tutorialMode
              ? tr(lang, 'HƯỚNG DẪN TẬP SỰ', 'SANDBOX TUTORIAL')
              : tr(lang, 'GIAI ĐOẠN 1', 'PHASE 1')}
          </span>
          <strong>
            {tutorialMode
              ? tr(lang, 'LẮP RÁP (1-9)', 'SUBSYSTEM ASSEMBLY (1-9)')
              : tr(lang, 'CHẾ TẠO', 'BUILD MODE')}
          </strong>
        </div>

        <div
          className={`rivet-plaque ${overBudget ? 'crit' : ''}`}
          title={tr(lang, 'Chi phí thiết kế / Ngân sách cho phép', 'Design cost / Authorized budget')}
        >
          <div className="plaque-metric-row">
            <span>{tr(lang, 'NGÂN SÁCH', 'BUDGET')}</span>
            <strong>
              {tutorialMode ? '$999M (SANDBOX)' : `$${cost.toFixed(1)} / ${budget || '-'}M`}
            </strong>
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
            <strong>
              {tutorialMode
                ? tr(lang, 'KHÔNG GIỚI HẠN', 'UNLIMITED')
                : `${months.toFixed(0)} / ${deadline || '-'} ${tr(lang, 'THÁNG', 'MO')}`}
            </strong>
          </div>
          <div className="plaque-mini-bar">
            <div className={`plaque-mini-fill ${overTime ? 'warn' : ''}`} style={{ width: `${timePct}%` }} />
          </div>
        </div>

        <div
          className="rivet-plaque plaque-rep-cell"
          title={tr(lang, 'Uy tín kỹ thuật: Thất bại khi phóng sẽ làm mất uy tín', 'Technical reputation: launch failures cost reputation')}
        >
          <div className="plaque-rep-row">
            <span>{tr(lang, 'UY TÍN', 'REPUTATION')}</span>
            <span className="rep-pills">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`rep-dot ${i < reputation ? 'ok' : 'lost'}`}>
                  {i < reputation ? '◆' : '◇'}
                </span>
              ))}
            </span>
          </div>
          <div className="plaque-attempt-cell">
            <span className="small muted">
              {tr(lang, 'LẦN THỬ', 'ATTEMPT')} #{attempts + 1}
            </span>
          </div>
        </div>
      </div>

      <div className="design-grid">
        {/* Left: Subsystem catalog */}
        <section className="panel" data-tutorial="build-slots">
          <h2 className="panel-title">
            <span>
              {tr(lang, 'KHO LINH KIỆN & QUY CÁCH', 'PARTS CATALOG')} ({slotEntries.length})
            </span>
            <span className="small muted">{design.orbit}</span>
          </h2>

          {DEV && (
            <div className="row-wrap" style={{ marginBottom: 8 }}>
              {(missionDetail?.presets || []).map((p) => (
                <button
                  key={p.id}
                  className="btn small"
                  onClick={() => applyPreset(p.id, true)}
                >
                  {p.id}
                </button>
              ))}
            </div>
          )}

          <div className="slot-tabs">
            {SLOTS.map((s) => {
              const isCurrent = activeSlot === s.id;
              const tabName = SLOT_TAB_NAMES[s.id] ? tx(SLOT_TAB_NAMES[s.id], lang) : (tx(s.label, lang) || s.label);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`slot-tab ${isCurrent ? 'active' : ''}`}
                  title={`${tx(s.title, lang)}: ${tx(s.shortDesc, lang)}`}
                  onClick={() => {
                    beep(audioOn, 620, 0.025);
                    (selectSlot || setActiveSlot)(s.id);
                  }}
                >
                  {tabName}
                </button>
              );
            })}
          </div>

          <div className="build-compact-actions">
            <span className="small">
              <strong>{SLOT_TAB_NAMES[currentSlotMeta.id] ? tx(SLOT_TAB_NAMES[currentSlotMeta.id], lang) : currentSlotMeta.label}</strong>
              <span className="muted"> · {currentSelectedItem?.name || currentSelectedItem?.id || tr(lang, 'CHƯA CHỌN', 'UNSELECTED')}</span>
            </span>
            <div className="build-compact-btns">
              <button
                type="button"
                className={`btn small ${showSlotGuide ? 'primary' : ''}`}
                onClick={() => {
                  beep(audioOn, 680, 0.03);
                  setShowSlotGuide((v) => !v);
                }}
              >
                {showSlotGuide
                  ? tr(lang, '▲ ẨN GỢI Ý', '▲ HIDE GUIDE')
                  : tr(lang, '▼ XEM GỢI Ý', '▼ SLOT GUIDE')}
              </button>
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
                  ? tr(lang, 'SANG KIỂM ĐỊNH →', 'GO TO INSPECT →')
                  : `${tr(lang, 'TIẾP:', 'NEXT:')} ${SLOT_TAB_NAMES[SLOTS[currentSlotIdx + 1]?.id] ? tx(SLOT_TAB_NAMES[SLOTS[currentSlotIdx + 1].id], lang) : ''} →`}
              </button>
            </div>
          </div>

          {showSlotGuide && (
            <div className="slot-intro-box">
              <div className="slot-intro-head">{tx(currentSlotMeta.title, lang)}</div>
              <div className="slot-intro-body">
                {tx(currentSlotMeta.shortDesc, lang)}{' '}
                <span className="neon-green">{tx(currentSlotMeta.highlight, lang)}</span>
              </div>
              {currentSelectedItem && currentInsight && (
                <div className="slot-selected-summary">
                  <div className="small">
                    <strong className="neon-green">
                      {tr(lang, 'ĐANG CHỌN:', 'SELECTED:')} {currentSelectedItem.name || currentSelectedItem.id}
                    </strong>
                  </div>
                  <div className="small">• <b>{tr(lang, 'Dùng ở đâu:', 'Where:')}</b> {tx(currentInsight.where, lang)}</div>
                  <div className="small ok-text">• <b>{tr(lang, 'Lợi ích (+):', 'Pros (+):')}</b> {tx(currentInsight.pros, lang)}</div>
                  <div className="small warn-text">• <b>{tr(lang, 'Tác hại (-):', 'Cons (-):')}</b> {tx(currentInsight.cons, lang)}</div>
                </div>
              )}
            </div>
          )}

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
              const wrongOrbit =
                !tutorialMode && activeSlot === 'orbit' && allowedOrbits.length > 0 && !allowedOrbits.includes(item.id);
              const warnText = noFit
                ? `${tr(lang, 'SAI LỆCH KHOANG MŨI FAIRING', 'FAIRING MISMATCH')}: ${tx(fit.reason, lang)}`
                : wrongOrbit
                  ? tr(lang, 'NGOÀI QUỸ ĐẠO KHUYẾN NGHỊ', 'OUTSIDE RECOMMENDED ORBITS')
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
                  budgetMusd={effectiveBudget ?? scenario.budget_musd}
                  deadlineMonths={effectiveDeadline}
                  onPick={pick}
                />
              );
            })}
          </div>

          {!tutorialMode && activeSlot === 'comm' && missionDetail?.communications_supported && (
            <MissionComms
              design={design}
              catalog={catalog}
              mission={missionDetail}
              onChange={updateDesign}
              setupOnly
            />
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
            <span>{tr(lang, 'VỊNH TÍCH HỢP 3D', '3D INTEGRATION BAY')}</span>
            <span className="small muted">{(design.instruments || []).join(', ')}</span>
          </h2>

          <Hangar3DCanvas design={design} catalog={catalog} theme={theme} />
          <TrajectoryScope flight={preview} runs={previewRuns} updating={previewUpdating} />

          <div className="nofit-slot">
            {currentFit && !currentFit.ok ? (
              <div className="nofit-banner small">
                ⚠ {tr(lang, 'CẢNH BÁO TÍCH HỢP:', 'INTEGRATION WARNING:')} {tx(currentFit.reason, lang)} ({tr(lang, 'Cho phép phóng thử — dự kiến vỡ fairing gần Max-Q', 'Test launch allowed — fairing failure expected near Max-Q')})
              </div>
            ) : (
              <div className="nofit-banner ok small">
                {tr(lang, 'VỪA VỚI VỎ TÊN LỬA', 'FAIRING FIT OK')}
              </div>
            )}
          </div>

          <div className="row-between build-action-row" style={{ marginTop: 12 }}>
            <span className="small muted">
              LAUNCH ANYTHING: {tr(lang, 'MỌI CẤU HÌNH ĐỀU ĐƯỢC CHUYỂN QUA KIỂM ĐỊNH', 'ALL CONFIGURATIONS PROCEED TO INSPECTION')}
            </span>
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
