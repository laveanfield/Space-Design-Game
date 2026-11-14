import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, beep, playSoundAsset } from './api/client';
import Hangar3DCanvas from './components/Hangar3DCanvas';
import OrbitOps3DCanvas from './components/OrbitOps3DCanvas';
import Launch3DCanvas from './components/Launch3DCanvas';
import TrajectoryScope from './components/TrajectoryScope';
import { BossPanel, DatasheetTotals, Dossier, LifePhase, Logbook, tx } from './components/CampaignPanels';
import StoryScene from './story/StoryScene';
import { SCENES } from './story/14-11-2026-script';
import { LaunchPadLive } from './anatomy/LaunchPadFigure';
import PartCard from './components/PartCard';

// Vong choi chinh: che tao -> phong 3D -> 12 moc tren quy dao -> tong ket.
// (Man "ops" va "debrief" cu van con, mo bang nut "VAN HANH TAY" o man tong ket.)
const PHASES = [
  { id: 'brief', label: '01.BRIEF' },
  { id: 'design', label: '02.BUILD' },
  { id: 'launch', label: '03.LAUNCH_3D' },
  { id: 'life', label: '04.ORBIT_12M' },
  { id: 'review', label: '05.REVIEW' },
];

// ?dev=1 tren URL: hien lai preset dap an va thanh seed (chi de nhom phat trien thu nhanh)
const DEV = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');
const LOG_KEY = 'smdg.logbook.v1';
const REP_MAX = 3;

function readLogbook() {
  try {
    return JSON.parse(window.localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

const SLOTS = [
  { id: 'orbit', label: 'ORBIT' },
  { id: 'instruments', label: 'INSTR' },
  { id: 'bus', label: 'BUS' },
  { id: 'power', label: 'POWER' },
  { id: 'battery', label: 'BATT' },
  { id: 'comm', label: 'COMM' },
  { id: 'obc', label: 'OBC' },
  { id: 'adcs', label: 'ADCS' },
  { id: 'launch', label: 'LAUNCH' },
];

function resolvePresetDesign(presets, presetId, missionDetail) {
  if (presetId === 'starter' && missionDetail?.starter && typeof missionDetail.starter === 'object') {
    return {
      schema_version: 'design/1',
      mission: missionDetail.id || missionDetail.starter.mission,
      seed: missionDetail.hazards?.seed ?? missionDetail.starter.seed ?? 0,
      ...structuredClone(missionDetail.starter),
    };
  }
  const map = Object.fromEntries((presets || []).map((p) => [p.id, p]));
  const pick = (typeof presetId === 'string' && map[presetId]) || presets?.[0];
  if (!pick) {
    if (missionDetail?.starter && typeof missionDetail.starter === 'object') {
      return {
        schema_version: 'design/1',
        mission: missionDetail.id,
        seed: missionDetail.hazards?.seed ?? 0,
        ...structuredClone(missionDetail.starter),
      };
    }
    return null;
  }

  let base = pick.design ? structuredClone(pick.design) : null;
  if (!base && pick.from && map[pick.from]?.design) {
    base = structuredClone(map[pick.from].design);
    if (pick.swap) {
      Object.entries(pick.swap).forEach(([k, v]) => {
        base[k] = structuredClone(v);
      });
    }
  }
  if (!base) return null;
  return {
    schema_version: 'design/1',
    mission: missionDetail?.id || base.mission,
    seed: missionDetail?.hazards?.seed ?? 0,
    ...base,
  };
}

export default function App() {
  const [phase, setPhase] = useState('brief');
  const [theme, setTheme] = useState('dark');
  const [audioOn, setAudioOn] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [catalog, setCatalog] = useState(null);
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [missionDetail, setMissionDetail] = useState(null);

  const [activeSlot, setActiveSlot] = useState('orbit');
  const [design, setDesign] = useState(null);
  const [evalReport, setEvalReport] = useState(null);

  // Launch state: du lieu /fly cua chuyen bay that + ban xem truoc tren scope
  const [flightData, setFlightData] = useState(null);
  const [launchPlaying, setLaunchPlaying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewRuns, setPreviewRuns] = useState(0);
  const [launchFired, setLaunchFired] = useState([]);
  const [launchResult, setLaunchResult] = useState(null);
  const [launchSeq, setLaunchSeq] = useState(0);

  // Campaign state: vong doi tren quy dao, ket cuc, uy tin voi Sep, so tay ky su
  const [lifeData, setLifeData] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [reputation, setReputation] = useState(REP_MAX);
  const [attempts, setAttempts] = useState(0);
  const [logbook, setLogbook] = useState(readLogbook);

  // Luat lap tai (ten lua nao cho duoc ve tinh nao) + canh hoi thoai dang mo
  const [accomm, setAccomm] = useState(null);
  const [story, setStory] = useState(null); // { lines, ctx, then }
  const [seenIntro, setSeenIntro] = useState({});
  const [seenPrelaunch, setSeenPrelaunch] = useState({});

  // Ops 3D simulation state
  const [opsId, setOpsId] = useState(null);
  const [opsSnap, setOpsSnap] = useState(null);
  const [opsRunning, setOpsRunning] = useState(false);
  const [opsWarp, setOpsWarp] = useState(5);
  const [rcsPulse, setRcsPulse] = useState('med');
  const [opsEvents, setOpsEvents] = useState([]);
  const opsSteppingRef = useRef(false);

  // Debrief & Advisor state
  const [debrief, setDebrief] = useState(null);
  const [pareto, setPareto] = useState(null);
  const [adviseObj, setAdviseObj] = useState('max_score');

  // Validity modal
  const [validityDoc, setValidityDoc] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const evaluateDesign = useCallback(async (nextDesign, missionId) => {
    if (!nextDesign) return null;
    try {
      const rep = await apiFetch('/evaluate', {
        method: 'POST',
        body: { design: nextDesign, mission_id: missionId || nextDesign.mission, with_hints: true },
      });
      setEvalReport(rep);
      return rep;
    } catch (err) {
      setErrorMsg(`Evaluate error: ${err.message}`);
      return null;
    }
  }, []);

  const loadMission = useCallback(
    async (missionId) => {
      setBusy(true);
      setErrorMsg('');
      try {
        const detail = await apiFetch(`/missions/${encodeURIComponent(missionId)}`);
        setSelectedMissionId(missionId);
        setMissionDetail(detail);
        const starterId = typeof detail.starter === 'string' ? detail.starter : 'starter';
        const d = resolvePresetDesign(detail.presets, starterId, detail);
        setDesign(d);
        setFlightData(null);
        setPreview(null);
        setPreviewRuns(0);
        setLaunchResult(null);
        setLifeData(null);
        setOutcome(null);
        setReputation(REP_MAX);
        setAttempts(0);
        setOpsId(null);
        setOpsSnap(null);
        setOpsRunning(false);
        setDebrief(null);
        setPareto(null);
        if (d) {
          await evaluateDesign(d, missionId);
        }
      } catch (err) {
        setErrorMsg(`Failed loading mission ${missionId}: ${err.message}`);
      } finally {
        setBusy(false);
      }
    },
    [evaluateDesign]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, misRes, accRes] = await Promise.all([
          apiFetch('/catalog'),
          apiFetch('/missions'),
          apiFetch('/campaign/accommodation').catch(() => null),
        ]);
        if (cancelled) return;
        setCatalog(catRes);
        setAccomm(accRes);
        setMissions(misRes);
        if (misRes.length > 0) {
          await loadMission(misRes[0].id);
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(`Backend connection failed: ${err.message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMission]);

  // So tay ky su luu trong trinh duyet de bai hoc con lai giua cac lan choi
  useEffect(() => {
    try {
      window.localStorage.setItem(LOG_KEY, JSON.stringify(logbook.slice(0, 40)));
    } catch {
      // khong luu duoc cung khong sao
    }
  }, [logbook]);

  // Ops real-time simulation loop
  const stepOps = useCallback(
    async (dt, actions = []) => {
      if (!opsId || opsSteppingRef.current) return;
      opsSteppingRef.current = true;
      try {
        const snap = await apiFetch(`/ops/${encodeURIComponent(opsId)}/step`, {
          method: 'POST',
          body: { dt, actions },
        });
        setOpsSnap(snap);
        if (Array.isArray(snap?.events) && snap.events.length > 0) {
          setOpsEvents((prev) => [...snap.events.slice().reverse(), ...prev].slice(0, 30));
          const names = snap.events.map((e) => e.name).join(' ');
          if (names.includes('SEU') || names.includes('FAULT') || names.includes('DENIED')) {
            playSoundAsset(audioOn, '08-11-2026-alarm.wav', 0.28);
          } else if (names.includes('CAPTURE')) {
            playSoundAsset(audioOn, '08-11-2026-shutter.wav', 0.35);
          }
        }
      } catch (err) {
        setOpsRunning(false);
        setErrorMsg(`Ops step error: ${err.message}`);
      } finally {
        opsSteppingRef.current = false;
      }
    },
    [opsId, audioOn]
  );

  useEffect(() => {
    if (phase !== 'ops' || !opsRunning || !opsId) return undefined;
    const id = setInterval(() => {
      stepOps(Math.min(3600, opsWarp), []);
    }, 450);
    return () => clearInterval(id);
  }, [phase, opsRunning, opsId, opsWarp, stepOps]);

  const updateDesign = (mutator) => {
    if (!design) return;
    const next = structuredClone(design);
    mutator(next);
    setDesign(next);
    setPreview(null); // thiet ke da doi: duong bay xem truoc cu khong con dung
    playSoundAsset(audioOn, '08-11-2026-relay_click.wav', 0.25);
    evaluateDesign(next, selectedMissionId);
  };

  const applyPreset = (presetId) => {
    const d = resolvePresetDesign(missionDetail?.presets, presetId, missionDetail);
    if (!d) return;
    setDesign(d);
    setPreview(null);
    beep(audioOn, 920, 0.05);
    evaluateDesign(d, selectedMissionId);
  };

  // Tom tat thiet ke de ghi vao so tay
  const buildLine = (d) =>
    [d.bus, d.power, d.battery, d.comm, d.obc, d.adcs, (d.instruments || []).join('+'), d.orbit, d.launch?.vehicle]
      .filter(Boolean)
      .join(' • ');

  const addLog = (success, headline, lesson) => {
    setLogbook((prev) => [
      {
        n: (prev[0]?.n || 0) + 1,
        success,
        headline,
        lesson,
        build: buildLine(design),
        when: selectedMissionId.replace('MP-', ''),
      },
      ...prev,
    ]);
  };

  // Nut "MO PHONG QUY DAO PHONG": chay /fly cho thiet ke hien tai, chi de VE duong bay (khong phong that)
  const runPreview = async () => {
    if (!design) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const fl = await apiFetch('/fly', { method: 'POST', body: { design, mission_id: selectedMissionId } });
      setPreview(fl);
      setPreviewRuns((n) => n + 1);
      playSoundAsset(audioOn, '06-11-2026-blip.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Trajectory preview failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const scenario = missionDetail?.scenario || {};

  // Thong tin cho thanh tren cua canh hoi thoai + bien thay vao cau thoai
  const storyHeader = {
    level: `LEVEL ${missionDetail?.meta?.difficulty ?? 1}`,
    title: (missionDetail?.meta?.title?.vi || '').toUpperCase(),
    budget: scenario.budget_musd,
    deadline: scenario.deadline_months,
  };
  const playScene = (key, extra = {}, then = null) => {
    const ctx = {
      mission: selectedMissionId,
      budget: scenario.budget_musd,
      deadline: scenario.deadline_months,
      rep: reputation,
      cost: Number(evalReport?.metrics?.['cost.total_musd'] || 0).toFixed(1),
      ...extra,
    };
    const lines = SCENES[key]?.(ctx);
    if (!lines?.length) return then?.();
    setStory({ lines, ctx, then });
    return null;
  };
  const closeStory = () => {
    const then = story?.then;
    setStory(null);
    then?.();
  };

  // Ten lua hien tai co lap duoc ve tinh nay khong (luat lap tai: lot fairing + cung nhom kich co)
  const fitOf = (vehicleId) => accomm?.[`${design?.bus}__${design?.comm}`]?.[vehicleId] || null;
  const currentFit = design ? fitOf(design.launch?.vehicle) : null;

  // Vao xuong: lan dau moi nhiem vu thi Sep giao viec (canh hoi thoai)
  const enterBuild = () => {
    setPhase('design');
    if (!seenIntro[selectedMissionId]) {
      setSeenIntro((s) => ({ ...s, [selectedMissionId]: true }));
      playScene('intro', { mood: { boss: 'smug', eng: 'worried' } });
    }
  };

  // Lan phong dau moi nhiem vu: Sep giuc truoc khi phong
  const requestLaunch = () => {
    if (!seenPrelaunch[selectedMissionId]) {
      setSeenPrelaunch((s) => ({ ...s, [selectedMissionId]: true }));
      playScene('prelaunch', { mood: { boss: 'happy', eng: 'calm' } }, startLaunch);
    } else {
      startLaunch();
    }
  };

  // "Launch anything": khong chan phong vi thiet ke sai. Hau qua se tu noi.
  // (Chi chan khi ve tinh KHONG LAP VAO duoc ten lua: do la su that tich hop, khong phai loi khuyen.)
  const startLaunch = async () => {
    if (!design || (currentFit && !currentFit.ok)) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const fl = await apiFetch('/fly', {
        method: 'POST',
        body: { design, mission_id: selectedMissionId },
      });
      setFlightData(fl);
      setLaunchFired([]);
      setLaunchResult(null);
      setLifeData(null);
      setOutcome(null);
      setLaunchPlaying(true);
      setLaunchSeq((n) => n + 1); // moi lan phong la mot canh 3D moi
      setPhase('launch');
    } catch (err) {
      setErrorMsg(`Flight simulation failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onLaunchEvent = useCallback((name) => setLaunchFired((prev) => [...prev, name]), []);

  const onLaunchEnd = useCallback(
    (result) => {
      setLaunchResult(result);
      if (!result.success) {
        const repAfter = Math.max(0, reputation - 1);
        setAttempts((n) => n + 1);
        setReputation(repAfter);
        addLog(false, tx(result.failure?.title) || 'Mất tên lửa', tx(result.failure?.cause));
        const key = result.aborted === 'scrub' ? 'abort_scrub' : result.aborted === 'fts' ? 'abort_fts' : 'launch_fail';
        const after = repAfter <= 0 ? () => playScene('fired', { rep: 0, mood: { boss: 'angry', eng: 'worried' } }) : null;
        setTimeout(() => playScene(key, { rep: repAfter, failure: tx(result.failure?.title).toLowerCase(), mood: { boss: 'angry', eng: 'worried' } }, after), 900);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, selectedMissionId, reputation, evalReport, missionDetail]
  );

  const startLife = async () => {
    if (!design) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const life = await apiFetch('/campaign/lifetime', {
        method: 'POST',
        body: { design, mission_id: selectedMissionId },
      });
      setLifeData(life);
      setPhase('life');
      playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Orbit simulation failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  // Het 12 moc (hoac mat ve tinh): tinh ket cuc, tru uy tin, ghi so tay
  const finishLife = () => {
    if (!lifeData) return;
    if (outcome) {
      setPhase('review'); // da tong ket chuyen nay roi: khong tru uy tin lan hai
      return;
    }
    const o = lifeData.outcome;
    const loss = (o.success ? 0 : 1) + (o.boss_fail.length > 0 ? 1 : 0);
    const repAfter = Math.max(0, reputation - loss);
    const headline = o.success
      ? o.boss_fail.length
        ? 'Sống đủ vòng đời, nhưng Sếp không quyết toán'
        : 'Nhiệm vụ hoàn thành'
      : tx(lifeData.dossier?.title) || 'Nhiệm vụ thất bại';
    setReputation(repAfter);
    setAttempts((n) => n + 1);
    addLog(o.success && !o.boss_fail.length, headline, tx(lifeData.dossier?.lesson));
    setOutcome({ ...o, headline, repLoss: loss, repAfter, dossier: lifeData.dossier, score: lifeData.score });
    setPhase('review');
    playSoundAsset(audioOn, o.success ? '06-11-2026-chime.wav' : '08-11-2026-power_down.wav', 0.35);
    const after = repAfter <= 0 ? () => playScene('fired', { rep: 0, mood: { boss: 'angry', eng: 'worried' } }) : null;
    playScene(
      o.success ? 'review_ok' : 'review_fail',
      {
        rep: repAfter,
        evidence: o.evidence_usable,
        failure: tx(lifeData.dossier?.title).toLowerCase(),
        mood: o.success ? { boss: 'happy', eng: 'happy' } : { boss: 'angry', eng: 'worried' },
      },
      after
    );
  };

  const startOps = async () => {
    if (!design) return;
    setBusy(true);
    setErrorMsg('');
    setLaunchPlaying(false);
    try {
      const res = await apiFetch('/ops', {
        method: 'POST',
        body: {
          design,
          mission_id: selectedMissionId,
          seed: Number(design.seed ?? missionDetail?.hazards?.seed ?? 0),
        },
      });
      setOpsId(res.ops_id);
      setOpsSnap(res.snapshot);
      setOpsEvents(res.snapshot?.events || []);
      setOpsRunning(true);
      setPhase('ops');
      playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Ops start failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const finishOps = async (objective = adviseObj) => {
    if (!opsId) return;
    setOpsRunning(false);
    setBusy(true);
    setErrorMsg('');
    try {
      const [debRes, advRes] = await Promise.all([
        apiFetch(`/ops/${encodeURIComponent(opsId)}/finish`, { method: 'POST' }),
        apiFetch('/advise', {
          method: 'POST',
          body: { mission_id: selectedMissionId, objective, k: 5 },
        }).catch(() => null),
      ]);
      setDebrief(debRes);
      setPareto(advRes);
      setPhase('debrief');
      playSoundAsset(audioOn, '06-11-2026-beep_go.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Debrief failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const refreshAdvisor = async (obj) => {
    setAdviseObj(obj);
    if (!selectedMissionId) return;
    try {
      const advRes = await apiFetch('/advise', {
        method: 'POST',
        body: { mission_id: selectedMissionId, objective: obj, k: 5 },
      });
      setPareto(advRes);
    } catch (err) {
      setErrorMsg(`Advisor error: ${err.message}`);
    }
  };

  const openValidityModal = async () => {
    try {
      const doc = await apiFetch('/validity');
      setValidityDoc(doc);
      dialogRef.current?.showModal();
    } catch (err) {
      setErrorMsg(`Failed loading validity doc: ${err.message}`);
    }
  };

  const tables = catalog?.tables || {};

  const slotEntries = useMemo(() => {
    if (!tables || !activeSlot) return [];
    if (activeSlot === 'orbit') return Object.values(tables.orbits || {});
    if (activeSlot === 'instruments') return Object.values(tables.instruments || {});
    if (activeSlot === 'bus') return Object.values(tables.buses || {});
    if (activeSlot === 'power') return Object.values(tables.power_arrays || {});
    if (activeSlot === 'battery') return Object.values(tables.batteries || {});
    if (activeSlot === 'comm') return Object.values(tables.comms || {});
    if (activeSlot === 'obc') {
      return Object.values(tables.avionics || {}).filter((a) => !a.type || a.type === 'obc');
    }
    if (activeSlot === 'adcs') {
      return Object.values(tables.avionics || {}).filter((a) => a.type === 'adcs');
    }
    if (activeSlot === 'launch') return Object.values(tables.launch_vehicles || {});
    return [];
  }, [tables, activeSlot]);

  const recommendedDesigns = useMemo(() => {
    if (!pareto) return [];
    if (Array.isArray(pareto.designs)) return pareto.designs;
    if (Array.isArray(pareto)) return pareto;
    return [];
  }, [pareto]);

  const selectedVehicle = tables.launch_vehicles?.[design?.launch?.vehicle];
  const compatibleSites = (selectedVehicle?.compatible_site_ids || [])
    .map((sid) => tables.launch_sites?.[sid])
    .filter(Boolean);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MISSION CONTROL // SPACE MISSION DESIGN TERMINAL</span>
        </div>

        <nav className="stepper">
          {PHASES.map((p) => {
            const disabled =
              (phase === 'launch' && !launchResult) || // dang bay: khong bo di giua chung duoc
              (p.id === 'design' && !design) ||
              (p.id === 'launch' && !flightData) ||
              (p.id === 'life' && !lifeData) ||
              (p.id === 'review' && !outcome);
            return (
              <button
                key={p.id}
                className={`step-btn ${phase === p.id ? 'active' : ''}`}
                disabled={disabled}
                onClick={() => {
                  beep(audioOn, 660, 0.03);
                  if (p.id !== 'ops') setOpsRunning(false);
                  if (p.id !== 'launch') setLaunchPlaying(false);
                  setPhase(p.id);
                }}
              >
                {p.label}
              </button>
            );
          })}
        </nav>

        <div className="top-actions">
          <button className="btn" onClick={() => setAudioOn((v) => !v)}>
            AUDIO: {audioOn ? 'ON' : 'OFF'}
          </button>
          <button className="btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            THEME: {theme === 'dark' ? 'CRT' : 'DAY'}
          </button>
          <button className="btn" onClick={openValidityModal}>
            VALIDITY_DOC
          </button>
        </div>
      </header>

      <main className="main-area">
        {errorMsg && (
          <div className="banner-err row-between">
            <span>{errorMsg}</span>
            <button className="btn" onClick={() => setErrorMsg('')}>
              DISMISS
            </button>
          </div>
        )}

        {/* PHASE 1: BRIEF */}
        {phase === 'brief' && (
          <div className="brief-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>AVAILABLE MISSIONS ({missions.length})</span>
                <span className="small muted">{catalog?.catalog_hash ? `#${catalog.catalog_hash.slice(0, 8)}` : ''}</span>
              </h2>
              <div className="mission-list">
                {missions.map((m) => (
                  <button
                    key={m.id}
                    className={`mission-card ${m.id === selectedMissionId ? 'selected' : ''}`}
                    onClick={() => {
                      beep(audioOn, 780, 0.04);
                      loadMission(m.id);
                    }}
                  >
                    <div className="row-between">
                      <strong>{m.title?.vi || m.title?.en || m.id}</strong>
                      <span className="badge info">LVL {m.difficulty}</span>
                    </div>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      {m.id} • ~{m.est_play_min} min
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">
                <span>MISSION BRIEFING</span>
                {missionDetail && <span className="badge ok">{missionDetail.id}</span>}
              </h2>
              {missionDetail ? (
                <div>
                  <h3 style={{ margin: '0 0 6px 0', color: 'var(--accent)' }}>
                    {missionDetail.meta?.title?.vi} ({missionDetail.meta?.title?.en})
                  </h3>
                  <p style={{ marginTop: 0 }}>
                    {missionDetail.meta?.brief?.vi || scenario.description_simple}
                  </p>
                  <p className="small boss-quote" title="Không ai nói trước thiết kế đúng hay sai: cứ phóng, tên lửa và vệ tinh sẽ trả lời. Mất tên lửa/vệ tinh → mất 1 vạch uy tín.">
                    👷 Bạn là Kỹ sư trưởng · 👔 Sếp giữ tiền · ❤❤❤ uy tín
                  </p>
                  <p className="muted">
                    🎯 {missionDetail.objective?.statement?.vi || missionDetail.objective?.statement?.en}
                  </p>

                  <div className="kpi-grid" style={{ marginTop: 12 }}>
                    <div className="kpi-box">
                      <div className="kpi-label">BUDGET LIMIT</div>
                      <div className="kpi-val">${scenario.budget_musd ?? '-'}M</div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">MIN LIFE / SCIENCE</div>
                      <div className="kpi-val">
                        {missionDetail.life_years ?? scenario.min_mission_life_years ?? '-'} yr /{' '}
                        {scenario.min_science_pts ?? '-'} pts
                      </div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">ALLOWED ORBITS</div>
                      <div className="small">
                        {(scenario.allowed_orbit_ids || []).join(', ') || 'ANY'}
                      </div>
                    </div>
                    <div className="kpi-box">
                      <div className="kpi-label">GAMEPLAY MODE</div>
                      <div className="kpi-val">{missionDetail.gameplay?.mode || 'auto'}</div>
                    </div>
                  </div>

                  <div className="row-wrap" style={{ marginTop: 14 }}>
                    <button
                      className="btn primary"
                      disabled={!design || busy}
                      onClick={() => {
                        applyPreset(
                          typeof missionDetail.starter === 'string' ? missionDetail.starter : 'starter'
                        );
                        enterBuild();
                      }}
                    >
                      VÀO XƯỞNG CHẾ TẠO →
                    </button>
                    {DEV && missionDetail.presets?.some((p) => p.id === 'good') && (
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() => {
                          applyPreset('good');
                          setPhase('design');
                        }}
                      >
                        MỞ VỚI PRESET ĐẠT CHUẨN (GOOD)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="muted">Loading mission dossier...</div>
              )}
            </section>
          </div>
        )}

        {/* PHASE 2: DESIGN DESK */}
        {phase === 'design' && design && (
          <div className="design-grid">
            {/* Left Slot Picker */}
            <section className="panel">
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
                  // Ten lua khong lap duoc ve tinh hien tai (lot fairing / giao dien lap) -> khoa, ghi ro ly do vat ly
                  const fit = isLaunch ? fitOf(item.id) : null;
                  const noFit = Boolean(fit && !fit.ok);
                  const disallowed =
                    (activeSlot === 'orbit' && allowedOrbits.length > 0 && !allowedOrbits.includes(item.id)) || noFit;

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

                  // The linh kien = anh 3D + ten + 3 chi so ngan; chi tiet + ly do khong lap duoc nam trong tooltip
                  return (
                    <PartCard
                      key={item.id}
                      slot={activeSlot}
                      item={item}
                      selected={selected}
                      disabled={disallowed}
                      noFitText={noFit ? tx(fit.reason) : null}
                      onPick={pick}
                    />
                  );
                })}
              </div>

              {activeSlot === 'launch' && compatibleSites.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="small muted" style={{ marginBottom: 4 }}>
                    LAUNCH SITE
                  </div>
                  <div className="row-wrap">
                    {compatibleSites.map((s) => (
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

            {/* Center: xuong lap rap 3D + scope xem truoc quy dao phong */}
            <section className="panel">
              <h2 className="panel-title">
                <span>XƯỞNG LẮP RÁP 3D</span>
                <span className="small muted">{(design.instruments || []).join(', ')}</span>
              </h2>

              <Hangar3DCanvas design={design} catalog={catalog} theme={theme} />
              <TrajectoryScope flight={preview} runs={previewRuns} />

              <div className="row-between" style={{ marginTop: 12 }}>
                <button className="btn" disabled={busy} onClick={runPreview}>
                  ◉ MÔ PHỎNG QUỸ ĐẠO PHÓNG
                </button>
                <button
                  className="btn primary hazard"
                  disabled={busy || reputation <= 0 || Boolean(currentFit && !currentFit.ok)}
                  onClick={requestLaunch}
                >
                  GO FOR LAUNCH →
                </button>
              </div>
              {currentFit && !currentFit.ok && (
                <div className="nofit-banner small">
                  ⚠ TÍCH HỢP THẤT BẠI: vệ tinh không lắp được vào {design.launch?.vehicle}. {tx(currentFit.reason)} Chọn lại
                  tên lửa ở mục LAUNCH.
                </div>
              )}
            </section>

            {/* Right: luat cua Sep + so lieu tho + so tay. KHONG co bang dat/truot, khong co goi y sua. */}
            <section className="panel">
              <h2 className="panel-title">
                <span>BÀN KỸ SƯ TRƯỞNG</span>
                <span className="small muted">
                  {design.launch?.vehicle} @ {design.launch?.site}
                </span>
              </h2>
              <BossPanel
                scenario={scenario}
                metrics={evalReport?.metrics}
                reputation={reputation}
                attempts={attempts}
              />
              <DatasheetTotals metrics={evalReport?.metrics} />
              <Logbook entries={logbook} />
            </section>
          </div>
        )}

        {/* PHASE 3: LAUNCH 3D */}
        {phase === 'launch' && flightData && (
          <div className="launch-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>
                  LAUNCH 3D // {flightData.meta?.vehicle} @ {flightData.meta?.site}
                </span>
                <span className="small muted">tải {Number(flightData.meta?.payload_kg || 0).toFixed(1)} kg</span>
              </h2>

              <Launch3DCanvas
                key={launchSeq}
                flight={flightData}
                design={design}
                audioOn={audioOn}
                onEvent={onLaunchEvent}
                onEnd={onLaunchEnd}
              />
            </section>

            <section className="panel">
              <LaunchPadLive key={launchSeq} fired={launchFired} />

              <h2 className="panel-title" style={{ marginTop: 10 }}>
                <span>ASCENT SEQUENCER</span>
                <span className="small muted">{flightData.meta?.physics}</span>
              </h2>

              <div className="constraint-list">
                {[{ name: 'IGNITION' }, ...(flightData.events || [])].map((ev, i) => (
                  <div key={i} className={`constraint-row ${launchFired.includes(ev.name) ? 'pass' : ''}`}>
                    <div className="row-between">
                      <strong>{ev.name}</strong>
                      <span className="small muted">{ev.t != null ? `T+${Number(ev.t).toFixed(0)}s` : 'T-1s'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {!launchResult && (
                <div className="small muted" style={{ marginTop: 10 }}>
                  Đang bay. Không còn sửa được gì nữa: chỉ còn chờ xem thiết kế của bạn chịu được đến đâu.
                </div>
              )}

              {launchResult && !launchResult.success && (
                <>
                  <div className="halt-banner">⚠ CRITICAL LAUNCH FAILURE</div>
                  <Dossier dossier={launchResult.failure} />
                </>
              )}
              {launchResult?.success && (
                <div className="ok-banner">
                  ĐÃ VÀO QUỸ ĐẠO. Phóng được mới là bắt đầu: vệ tinh còn phải sống trọn vòng đời nhiệm vụ.
                </div>
              )}

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {launchResult?.success && (
                  <button className="btn primary" disabled={busy} onClick={startLife}>
                    THEO DÕI 12 MỐC TRÊN QUỸ ĐẠO →
                  </button>
                )}
                {launchResult && !launchResult.success && reputation > 0 && (
                  <button className="btn primary" onClick={() => setPhase('design')}>
                    ← VỀ XƯỞNG LÀM LẠI (còn {reputation}/{REP_MAX} vạch uy tín)
                  </button>
                )}
                {launchResult && !launchResult.success && reputation <= 0 && (
                  <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
                    DỰ ÁN BỊ HỦY — NHẬN LẠI NHIỆM VỤ TỪ ĐẦU
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* PHASE 4: 12 MOC TREN QUY DAO */}
        {phase === 'life' && lifeData && (
          <LifePhase life={lifeData} design={design} catalog={catalog} audioOn={audioOn} onDone={finishLife} />
        )}

        {/* PHASE 5: HOP TONG KET -- chi o day moi co danh gia, sau khi hau qua da xay ra */}
        {phase === 'review' && outcome && (
          <div className="debrief-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>HỌP TỔNG KẾT VỚI SẾP</span>
                <span className={`badge ${outcome.success ? 'ok' : 'err'}`}>
                  {outcome.success ? 'MISSION COMPLETE' : 'MISSION FAILED'}
                </span>
              </h2>
              <h3 style={{ margin: '0 0 10px 0', color: outcome.success ? 'var(--ok)' : 'var(--err)' }}>
                {outcome.headline}
              </h3>

              <div className="kpi-grid">
                <div className="kpi-box">
                  <div className="kpi-label">SỐNG ĐƯỢC</div>
                  <div className="kpi-val">
                    {outcome.survived_steps} / {lifeData?.steps_total ?? 12} mốc
                  </div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-label">DỮ LIỆU DÙNG ĐƯỢC</div>
                  <div className="kpi-val">
                    {Number(outcome.usable_gb).toFixed(1)} / {Number(outcome.generated_gb).toFixed(1)} GB
                  </div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-label">UY TÍN VỚI SẾP</div>
                  <div className="kpi-val">
                    {outcome.repLoss > 0 ? `-${outcome.repLoss} → ` : ''}còn {outcome.repAfter}/{REP_MAX}
                  </div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-label">ĐIỂM THIẾT KẾ</div>
                  <div className="kpi-val">
                    {outcome.score ? `${Number(outcome.score.total).toFixed(1)} (${outcome.score.grade})` : '-'}
                  </div>
                </div>
              </div>

              <Dossier dossier={outcome.dossier} />

              <div className="constraint-list" style={{ marginTop: 10 }}>
                {(outcome.review || []).map((r) => (
                  <div key={r.id} className={`constraint-row ${r.pass ? 'pass' : 'fail'}`}>
                    <div className="row-between small">
                      <span>{r.pass ? `Đạt: ${r.id.toUpperCase()}` : tx(r.title)}</span>
                      <span className={`badge ${r.pass ? 'ok' : 'err'}`}>{r.pass ? 'OK' : 'KHÔNG ĐẠT'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row-wrap" style={{ marginTop: 14 }}>
                {outcome.repAfter > 0 ? (
                  <button className="btn primary" onClick={() => setPhase('design')}>
                    {outcome.success ? '← THỬ MỘT THIẾT KẾ KHÁC' : '← VỀ XƯỞNG SỬA THIẾT KẾ'}
                  </button>
                ) : (
                  <button className="btn warn" onClick={() => loadMission(selectedMissionId)}>
                    DỰ ÁN BỊ HỦY — NHẬN LẠI NHIỆM VỤ TỪ ĐẦU
                  </button>
                )}
                <button className="btn" onClick={() => setPhase('brief')}>
                  CHỌN NHIỆM VỤ KHÁC
                </button>
                {outcome.survived_steps > 0 && (
                  <button className="btn" disabled={busy} onClick={startOps}>
                    VẬN HÀNH TAY 2 NGÀY (ADCS / RCS)
                  </button>
                )}
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">
                <span>SỔ TAY KỸ SƯ</span>
              </h2>
              <Logbook entries={logbook} />
            </section>
          </div>
        )}

        {/* PHASE 4: SAT OPS 3D */}
        {phase === 'ops' && opsSnap && (
          <div className="ops-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>ORBITAL OPERATIONS 3D (THREE.JS)</span>
                <span className="badge info">
                  T+{Number(opsSnap.t || 0).toFixed(0)}s • {opsSnap.mode?.toUpperCase()}
                </span>
              </h2>

              <OrbitOps3DCanvas snapshot={opsSnap} design={design} catalog={catalog} />

              <div className="row-between" style={{ marginTop: 10 }}>
                <div className="row-wrap">
                  <button className="btn primary" onClick={() => setOpsRunning((r) => !r)}>
                    {opsRunning ? 'PAUSE SIM' : 'RUN SIM'}
                  </button>
                  {[1, 5, 20, 60].map((w) => (
                    <button
                      key={w}
                      className={`btn ${opsWarp === w ? 'primary' : ''}`}
                      onClick={() => setOpsWarp(w)}
                    >
                      {w}x
                    </button>
                  ))}
                  <button className="btn" onClick={() => stepOps(5, [])}>
                    +5s STEP
                  </button>
                </div>

                <button className="btn warn" disabled={busy} onClick={() => finishOps()}>
                  END MISSION & DEBRIEF →
                </button>
              </div>

              <div className="panel" style={{ marginTop: 10, padding: 10 }}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <strong className="small">ADCS & RCS ATTITUDE CONTROL</strong>
                  <span className="small muted">MODE: {opsSnap.attitude?.auto || 'MANUAL'}</span>
                </div>
                <div className="row-wrap" style={{ marginBottom: 8 }}>
                  {['rate_null', 'nadir', 'track', 'manual'].map((m) => (
                    <button
                      key={m}
                      className={`btn ${
                        (opsSnap.attitude?.auto || 'manual') === m ? 'primary' : ''
                      }`}
                      onClick={() => stepOps(0.5, [{ type: m }])}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                  <button
                    className="btn primary"
                    onClick={() =>
                      stepOps(0.5, [
                        {
                          type: 'capture',
                          offset_deg: Number(opsSnap.attitude?.boresight_error_deg || 0),
                        },
                      ])
                    }
                  >
                    CAPTURE TARGET
                  </button>
                  {(opsSnap.overlays || []).includes('orbit_keeping') && (
                    <button
                      className="btn warn"
                      disabled={(opsSnap.fuel || 0) <= 0}
                      onClick={() => stepOps(0.5, [{ type: 'burn' }])}
                    >
                      REBOOST BURN ({opsSnap.fuel ?? 0})
                    </button>
                  )}
                </div>

                <div className="row-wrap">
                  <span className="small muted">RCS ({rcsPulse}):</span>
                  {['short', 'med', 'long'].map((p) => (
                    <button
                      key={p}
                      className={`btn small ${rcsPulse === p ? 'primary' : ''}`}
                      onClick={() => setRcsPulse(p)}
                    >
                      {p}
                    </button>
                  ))}
                  {[
                    { label: 'Roll+', axis: 0, sign: 1 },
                    { label: 'Roll-', axis: 0, sign: -1 },
                    { label: 'Pitch+', axis: 1, sign: 1 },
                    { label: 'Pitch-', axis: 1, sign: -1 },
                    { label: 'Yaw+', axis: 2, sign: 1 },
                    { label: 'Yaw-', axis: 2, sign: -1 },
                  ].map((cmd) => (
                    <button
                      key={cmd.label}
                      className="btn small"
                      onClick={() =>
                        stepOps(0.5, [
                          { type: 'rcs', axis: cmd.axis, sign: cmd.sign, pulse: rcsPulse },
                        ])
                      }
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Right Telemetry HUD */}
            <section className="panel">
              <h2 className="panel-title">
                <span>LIVE SPACECRAFT TELEMETRY</span>
                <span
                  className={`badge ${
                    opsSnap.link?.state === 'LOCK'
                      ? 'ok'
                      : opsSnap.link?.state === 'MARGINAL'
                        ? 'warn'
                        : 'err'
                  }`}
                >
                  {opsSnap.link?.state || 'NO_PASS'}
                </span>
              </h2>

              {opsSnap.mode_hud && (
                <div className="kpi-box" style={{ marginBottom: 8 }}>
                  <div className="kpi-label">{opsSnap.mode_hud.title}</div>
                  {(opsSnap.mode_hud.lines || []).map((ln, idx) => (
                    <div key={idx} className="small">
                      {ln}
                    </div>
                  ))}
                  {(opsSnap.mode_hud.prompts || []).map((pr, idx) => (
                    <div key={idx} className="small" style={{ color: 'var(--warn)', marginTop: 3 }}>
                      ▶ {pr}
                    </div>
                  ))}
                </div>
              )}

              <div className="telemetry-grid">
                <div className="kpi-box">
                  <div className="kpi-label">BATTERY SOC</div>
                  <div className="kpi-val">{((opsSnap.power?.soc || 0) * 100).toFixed(1)}%</div>
                  <div className="gauge-bar">
                    <div
                      className={`gauge-fill ${(opsSnap.power?.soc || 0) < 0.25 ? 'err' : ''}`}
                      style={{ width: `${Math.min(100, (opsSnap.power?.soc || 0) * 100)}%` }}
                    />
                  </div>
                  <div className="small muted">
                    Gen {Number(opsSnap.power?.gen_w || 0).toFixed(1)}W / Load{' '}
                    {Number(opsSnap.power?.load_w || 0).toFixed(1)}W
                  </div>
                </div>

                <div className="kpi-box">
                  <div className="kpi-label">DATA BUFFER</div>
                  <div className="kpi-val">
                    {Number(opsSnap.data?.downlinked_gb || 0).toFixed(3)} GB
                  </div>
                  <div className="gauge-bar">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          ((opsSnap.data?.buffer_gb || 0) /
                            Math.max(0.01, opsSnap.data?.capacity_gb || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="small muted">
                    Buf {Number(opsSnap.data?.buffer_gb || 0).toFixed(2)} /{' '}
                    {Number(opsSnap.data?.capacity_gb || 0).toFixed(1)} GB
                  </div>
                </div>

                <div className="kpi-box">
                  <div className="kpi-label">ATTITUDE ERROR</div>
                  <div className="kpi-val">
                    {Number(opsSnap.attitude?.boresight_error_deg || 0).toFixed(2)}°
                  </div>
                  <div className="small muted">
                    Rate: {(opsSnap.attitude?.omega_dps || []).map((v) => v.toFixed(1)).join(', ')} °/s
                  </div>
                </div>

                <div className="kpi-box">
                  <div className="kpi-label">RADIATION DOSE</div>
                  <div className="kpi-val">
                    {Number(opsSnap.radiation?.dose_krad || 0).toFixed(1)} krad
                  </div>
                  <div className="small muted">
                    Tol {Number(opsSnap.radiation?.tolerance_krad || 0).toFixed(0)} krad{' '}
                    {opsSnap.radiation?.seu_active ? '• SEU ACTIVE!' : ''}
                  </div>
                </div>
              </div>

              {(opsSnap.faults || []).length > 0 && (
                <div className="row-wrap" style={{ marginTop: 8 }}>
                  {opsSnap.faults.map((f, idx) => (
                    <span key={idx} className="badge err">
                      FAULT: {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="small muted" style={{ margin: '10px 0 4px 0' }}>
                EVENT STREAM
              </div>
              <div className="constraint-list" style={{ maxHeight: 165 }}>
                {opsEvents.map((ev, i) => (
                  <div key={i} className="small">
                    [T+{Number(ev.t || 0).toFixed(0)}s] <strong>{ev.name}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* PHASE 5: DEBRIEF */}
        {phase === 'debrief' && debrief && (
          <div className="debrief-grid">
            <section className="panel">
              <h2 className="panel-title">
                <span>POST-FLIGHT DEBRIEF</span>
                <span className={`badge ${debrief.design_ok ? 'ok' : 'warn'}`}>
                  GRADE {debrief.score?.grade || '-'}
                </span>
              </h2>

              <div className="kpi-grid">
                <div className="kpi-box">
                  <div className="kpi-label">FINAL SCORE</div>
                  <div className="kpi-val">{Number(debrief.score?.total || 0).toFixed(1)} / 100</div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-label">COST / BUDGET</div>
                  <div className="kpi-val">
                    ${Number(debrief.cost_musd || 0).toFixed(1)}M / $
                    {Number(debrief.budget_musd || 0).toFixed(1)}M
                  </div>
                </div>
              </div>

              <div className="constraint-list">
                {(debrief.explanations || []).map((ex, idx) => (
                  <div key={idx} className="constraint-row">
                    {typeof ex === 'string' ? ex : JSON.stringify(ex)}
                  </div>
                ))}
              </div>

              <div className="row-wrap" style={{ marginTop: 14 }}>
                <button className="btn primary" onClick={() => setPhase('design')}>
                  ← TWEAK DESIGN IN HANGAR
                </button>
                <button className="btn" onClick={() => setPhase('brief')}>
                  SWITCH MISSION
                </button>
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">
                <span>PARETO ADVISOR RECOMMENDATIONS</span>
                <div className="row-wrap">
                  <button
                    className={`btn small ${adviseObj === 'max_score' ? 'primary' : ''}`}
                    onClick={() => refreshAdvisor('max_score')}
                  >
                    MAX SCORE
                  </button>
                  <button
                    className={`btn small ${adviseObj === 'min_cost' ? 'primary' : ''}`}
                    onClick={() => refreshAdvisor('min_cost')}
                  >
                    MIN COST
                  </button>
                </div>
              </h2>

              {pareto && (
                <div className="small muted" style={{ marginBottom: 8 }}>
                  Evaluated {pareto.n_evaluated} candidates • {pareto.n_ok} passing
                  {pareto.truncated ? ' (search truncated)' : ''}
                </div>
              )}

              <div className="constraint-list">
                {recommendedDesigns.length === 0 ? (
                  <div className="muted small">No Pareto candidates returned for this query.</div>
                ) : (
                  recommendedDesigns.map((rec, idx) => (
                    <div key={idx} className="constraint-row pass">
                      <div className="row-between">
                        <strong>
                          #{idx + 1} • Score {Number(rec.score).toFixed(1)} ({rec.grade}) • $
                          {Number(rec.cost_musd).toFixed(1)}M
                        </strong>
                        <button
                          className="btn small"
                          onClick={() => {
                            const next = { ...rec.design, mission: selectedMissionId };
                            setDesign(next);
                            evaluateDesign(next, selectedMissionId);
                            setPhase('design');
                          }}
                        >
                          LOAD
                        </button>
                      </div>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {rec.design?.orbit} | {(rec.design?.instruments || []).join(',')} |{' '}
                        {rec.design?.bus} | {rec.design?.power} | {rec.design?.comm} |{' '}
                        {rec.design?.launch?.vehicle}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {story && (
        <StoryScene lines={story.lines} ctx={story.ctx} header={storyHeader} audioOn={audioOn} onClose={closeStory} />
      )}

      <dialog ref={dialogRef} className="modal">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <strong style={{ color: 'var(--accent)' }}>ENGINE & CATALOG VALIDITY DOSSIER</strong>
          <button className="btn" onClick={() => dialogRef.current?.close()}>
            CLOSE
          </button>
        </div>
        {validityDoc && (
          <div>
            <div className="small muted" style={{ marginBottom: 8 }}>
              Engine: {validityDoc.engine_version} • Catalog Hash: {validityDoc.catalog_hash}
            </div>
            <pre className="pre-scroll">{validityDoc.data_doctor_md}</pre>
          </div>
        )}
      </dialog>
    </div>
  );
}
