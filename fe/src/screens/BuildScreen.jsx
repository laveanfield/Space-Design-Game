import React, { useMemo } from 'react';
import { beep } from '../api/client';
import { BossPanel, CoreTelemetryBars, DatasheetTotals, Logbook, tx } from '../components/CampaignPanels';
import Hangar3DCanvas from '../components/Hangar3DCanvas';
import PartCard from '../components/PartCard';
import TrajectoryScope from '../components/TrajectoryScope';
import { DEV } from '../core/devFlag';
import { SLOTS } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

export default function BuildScreen() {
  const {
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

  return (
    <div className="phase-stage">
      <div className="phase-header-plaques">
        <div className="rivet-plaque title">PHASE 1: BUILD MODE</div>
        <div className="rivet-plaque">
          BUDGET: <strong>${effectiveBudget ?? scenario.budget_musd ?? '-'}M</strong>
        </div>
        <div className="rivet-plaque">
          DEADLINE: <strong>MONTH {effectiveDeadline ?? scenario.deadline_months ?? '-'}</strong>
        </div>
      </div>

      <div className="design-grid">
        {/* Left: Kho linh kien */}
        <section className="panel" data-tutorial="build-slots">
        <h2 className="panel-title">
          <span>SUBSYSTEM SLOTS</span>
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
              {s.label}
            </button>
          ))}
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
            const wrongOrbit = activeSlot === 'orbit' && allowedOrbits.length > 0 && !allowedOrbits.includes(item.id);
            const warnText = noFit
              ? `FAIRING MISMATCH: ${tx(fit.reason)}`
              : wrongOrbit
                ? `NGOÀI QUỸ ĐẠO KHUYẾN NGHỊ`
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

        {activeSlot === 'launch' && allSites.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div className="small muted" style={{ marginBottom: 4 }}>
              LAUNCH SITE
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
