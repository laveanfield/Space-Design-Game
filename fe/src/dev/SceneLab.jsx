import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import AccidentNewspaper, { buildAccidentInfo } from '../components/AccidentNewspaper';
import { LifePhase } from '../components/CampaignPanels';
import HumanityImpactCard from '../components/HumanityImpactCard';
import Launch3DCanvas from '../components/Launch3DCanvas';
import OrbitOps3DCanvas from '../components/OrbitOps3DCanvas';
import PadExplosionArt from '../components/PadExplosionArt';
import { SCENES } from '../story/14-11-2026-script';
import StoryScene from '../story/StoryScene';

// Su co MAU chi de xem thu to bao (khong phai so lieu that cua engine)
const MOCK_FAILURES = {
  fts: { kind: 'fts', explode: true, title: { en: 'FLIGHT TERMINATION SYSTEM ACTIVATED' }, cause: { en: 'Range Safety termination destroyed the vehicle mid-flight to protect downrange areas.' }, numbers: [] },
  scrub: { kind: 'scrub', explode: false, title: { en: 'LAUNCH SCRUBBED BY LEAD ENGINEER' }, cause: { en: 'Countdown halted prior to ignition. Hardware preserved, launch readiness cost spent.' }, numbers: [] },
  dv_shortfall: { kind: 'dv_shortfall', t: 1300, explode: true, title: { en: 'DELTA-V SHORTFALL — RE-ENTRY' }, cause: { en: 'Booster exhausted propellant short of orbital velocity.' }, numbers: [{ label: 'dv_needed_ms', value: 9400, unit: 'm/s' }, { label: 'dv_ideal_ms', value: 8700, unit: 'm/s' }, { label: 'dv_short_ms', value: 700, unit: 'm/s' }] },
  wrong_plane: { kind: 'wrong_plane', t: 900, explode: false, title: { en: 'ORBITAL PLANE UNREACHABLE' }, cause: { en: 'Target inclination is below launch site latitude for direct insertion.' }, numbers: [] },
  mass: { kind: 'structural_maxq', t: 36.1, explode: true, constraint: 'mass', title: { en: 'STRUCTURAL BREAKUP AT MAX-Q' }, cause: { en: 'Dry mass exceeded bus load limit, failing structural mounts at Max-Q.' }, numbers: [{ label: 'mass.dry_kg', value: 73.3, unit: 'kg' }, { label: 'mass.bus_limit_kg', value: 24, unit: 'kg' }] },
};

/** Lab cua so hoi thoai: ?lab=story&mode=launch_fail|review_ok|review_fail (launch_fail co them to bao tai nan) */
function StoryLab({ state, q }) {
  const mode = q.get('mode') || 'launch_fail';
  const failure = MOCK_FAILURES[q.get('kind')] || state.flight.failure;
  const launch = mode === 'launch_fail';
  const accident = launch ? buildAccidentInfo({ failure, flight: state.flight, catalog: state.catalog, cost: 12.4 }) : null;
  const ctx = {
    mission: state.design.mission,
    rep: 2,
    evidence: 3,
    cost: '12.4',
    failure: 'lab',
    showImpact: true,
    success: mode === 'review_ok',
    failureId: launch ? failure?.kind || 'launch' : 'data',
    accident,
    mood: { boss: 'angry', eng: 'worried' },
  };
  const lines = SCENES[mode](ctx);
  return <StoryScene lines={lines} ctx={ctx} header={{ level: 'LEVEL 1', title: 'LAB', budget: 12, deadline: 18 }} audioOn={false} onClose={() => {}} />;
}

/** Lab to bao tai nan: ?lab=news[&kind=fts|scrub|dv_shortfall|wrong_plane|mass][&view=art&scene=pad-boom] */
function NewsLab({ state, q }) {
  const kind = q.get('kind');
  const failure = kind && MOCK_FAILURES[kind] ? MOCK_FAILURES[kind] : state.flight.failure;
  const info = buildAccidentInfo({ failure, flight: state.flight, catalog: state.catalog, cost: 12.4 });
  if (q.get('view') === 'art') {
    return (
      <div style={{ width: 960, height: 540 }}>
        <PadExplosionArt scene={q.get('scene') || info?.scene || 'pad-boom'} seed={Number(q.get('seed') || 7)} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <div className="launch-left" style={{ width: Number(q.get('w') || 940), height: Number(q.get('h') || 500) }}>
        <AccidentNewspaper info={info} variant="extended" />
      </div>
      <div className="story-news" style={{ width: 960, margin: 0 }}>
        <div className="story-news-item"><AccidentNewspaper info={info} variant="compact" /></div>
        <div className="story-news-item"><HumanityImpactCard missionId={state.design.mission} success={false} failureId={failure?.kind || 'launch'} compact /></div>
      </div>
    </div>
  );
}

/**
 * SceneLab -- trang thu nhanh DANH CHO NGUOI PHAT TRIEN (chi hien khi co ?lab= tren URL).
 * Dung thang preset "good" cua nhiem vu, khong phai choi qua tung man.
 *
 *   /?lab=launch&veh=LV-ARIANE62&site=SITE-KOUROU&mission=MP-SC01-FIRST-EYES   canh phong 3D (dung window.__launch3d.advance(giay))
 *   /?lab=orbit&mission=MP-SC04-GHG                                            man 05.ORBIT (qua cau + nhat ky may tinh cu)
 *   (them &seed=N: seed % 3 = 0 ban ngay, 1 hoang hon, 2 ban dem luc tach ve tinh)
 *   /?lab=earth                                                                  chi qua cau Trai Dat 720x520 (xem shader ngay / dem / den thanh pho)
 *   /?lab=news&veh=LV-VEGAC&site=SITE-KOUROU[&kind=fts|scrub|dv_shortfall|wrong_plane|mass][&w=990&h=1300]   to bao tai nan (khung rong / dung)
 *   /?lab=story&mode=launch_fail|review_ok|review_fail                           cua so hoi thoai + to bao (veh=LV-VEGAC de co su co that)
 */
export default function SceneLab() {
  const q = new URLSearchParams(window.location.search);
  const lab = q.get('lab');
  const missionId = q.get('mission') || 'MP-SC01-FIRST-EYES';
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [catalog, detail] = await Promise.all([apiFetch('/catalog'), apiFetch(`/missions/${encodeURIComponent(missionId)}`)]);
        const good = detail.presets.find((p) => p.id === 'good')?.design || detail.starter;
        const design = { ...good, mission: missionId };
        if (q.get('seed') !== null) design.seed = Number(q.get('seed'));
        const veh = q.get('veh');
        const site = q.get('site');
        if (veh) design.launch = { vehicle: veh, site: site || design.launch?.site };
        else if (site) design.launch = { ...design.launch, site };
        if (lab === 'earth') {
          if (alive) setState({ design, catalog });
        } else if (lab === 'orbit') {
          const life = await apiFetch('/campaign/lifetime', { method: 'POST', body: { design, mission_id: missionId } });
          if (alive) setState({ design, catalog, life });
        } else {
          const flight = await apiFetch('/fly', { method: 'POST', body: { design, mission_id: missionId, allow_nofit: true } });
          if (alive) setState({ design, catalog, flight });
        }
      } catch (err) {
        if (alive) setState({ error: String(err.message || err) });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.loading) return <div style={{ padding: 20, color: '#9fd' }}>LAB: dang tai…</div>;
  if (state.error) return <div style={{ padding: 20, color: '#f88' }}>LAB loi: {state.error}</div>;
  return (
    <div style={{ padding: lab === 'launch' ? 4 : 10, maxWidth: 1400, margin: '0 auto' }}>
      {lab === 'story' ? (
        <StoryLab state={state} q={q} />
      ) : lab === 'news' ? (
        <NewsLab state={state} q={q} />
      ) : lab === 'earth' ? (
        <div style={{ width: 720, height: 520, margin: '0 auto' }}>
          <OrbitOps3DCanvas snapshot={{ auto: true }} design={state.design} catalog={state.catalog} />
        </div>
      ) : lab === 'orbit' ? (
        <LifePhase life={state.life} design={state.design} catalog={state.catalog} audioOn={false} onDone={() => {}} />
      ) : (
        <div className="lab-launch" style={{ height: 'calc(100vh - 12px)', minHeight: 300 }}>
          <style>{'.lab-launch .viewport-box { height: 100% !important; }'}</style>
          <Launch3DCanvas
            flight={state.flight}
            design={state.design}
            geo={{
              latDeg: state.catalog?.tables?.launch_sites?.[state.design.launch?.site]?.lat_deg,
              lonDeg: state.catalog?.tables?.launch_sites?.[state.design.launch?.site]?.lon_deg,
              incDeg: state.catalog?.tables?.orbits?.[state.design.orbit]?.inclination_deg,
            }}
            audioOn={false}
            onEvent={() => {}}
            onEnd={() => {}}
          />
        </div>
      )}
    </div>
  );
}
