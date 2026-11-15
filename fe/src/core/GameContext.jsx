import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, beep, playSoundAsset } from '../api/client';
import { buildAccidentInfo } from '../components/AccidentNewspaper';
import { LANG_KEY, readLang, tr, tx } from './i18n';
import { SCENES } from '../story/14-11-2026-script';
import {
  INSPECT_BASE_SEC,
  MISSION_ORDER,
  REP_MAX,
  SLOTS,
  canEnterPhase,
  computeCoreBars,
  evaluateInspectionOutcome,
  generateInspectionDefects,
  resolvePresetDesign,
} from './gameMachine';

const LOG_KEY = 'smdg.logbook.v1';
const UNLOCK_KEY = 'smdg.unlocked.v1';
const GameContext = createContext(null);

function readLogbook() {
  try {
    return JSON.parse(window.localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function readUnlockedMissions() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(UNLOCK_KEY) || 'null');
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.includes(MISSION_ORDER[0]) ? raw : [MISSION_ORDER[0], ...raw];
    }
  } catch {
    // fallback default
  }
  return [MISSION_ORDER[0]];
}

export function GameProvider({ children }) {
  // Khoi dong o Menu chinh (phase = 'home'); nguoi choi co the bam vao Sandbox Tutorial bat cu luc nao
  const [tutorialMode, setTutorialMode] = useState(false);
  const [tutorialGuided, setTutorialGuided] = useState(false);
  const [phase, setPhase] = useState('home');
  const [lang, setLang] = useState(readLang);
  const [theme, setTheme] = useState('dark');
  const [audioOn, setAudioOn] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [catalog, setCatalog] = useState(null);
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [missionDetail, setMissionDetail] = useState(null);

  // Sequential slot unlocking: 0 = ORBIT, 1 = LAUNCH, 2 = BUS, 3 = ALL SATELLITE EQUIPMENTS
  const [activeSlot, setActiveSlot] = useState('orbit');
  const [buildStage, setBuildStage] = useState(0);
  const [design, setDesign] = useState(null);
  const [evalReport, setEvalReport] = useState(null);

  // Live Trajectory Preview (tu dong tinh lai moi khi doi linh kien)
  const [preview, setPreview] = useState(null);
  const [previewRuns, setPreviewRuns] = useState(0);
  const [previewUpdating, setPreviewUpdating] = useState(false);
  const previewReqRef = useRef(0);

  // Inspection State (Phase 03.INSPECT)
  const [inspectSession, setInspectSession] = useState(null);
  const [inspectReport, setInspectReport] = useState(null);

  // Launch 3D & Life 12M
  const [flightData, setFlightData] = useState(null);
  const [launchFired, setLaunchFired] = useState([]);
  const [launchResult, setLaunchResult] = useState(null);
  const [launchSeq, setLaunchSeq] = useState(0);

  const [lifeData, setLifeData] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [reputation, setReputation] = useState(REP_MAX);
  const [attempts, setAttempts] = useState(0);
  const [budgetBonus, setBudgetBonus] = useState(0);
  const [deadlineBonus, setDeadlineBonus] = useState(0);
  const [logbook, setLogbook] = useState(readLogbook);
  const [unlockedMissions, setUnlockedMissions] = useState(readUnlockedMissions);

  // Accommodation & Terminal Comms & Phase Tutorial
  const [accomm, setAccomm] = useState(null);
  const [story, setStory] = useState(null);
  const [seenIntro, setSeenIntro] = useState({});
  const [seenPrelaunch, setSeenPrelaunch] = useState({});
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [seenTutorials, setSeenTutorials] = useState({});

  // Optional Manual Ops & Debrief
  const [opsId, setOpsId] = useState(null);
  const [opsSnap, setOpsSnap] = useState(null);
  const [opsRunning, setOpsRunning] = useState(false);
  const [opsWarp, setOpsWarp] = useState(5);
  const [rcsPulse, setRcsPulse] = useState('med');
  const [opsEvents, setOpsEvents] = useState([]);
  const opsSteppingRef = useRef(false);
  const [debrief, setDebrief] = useState(null);
  const [pareto, setPareto] = useState(null);
  const [adviseObj, setAdviseObj] = useState('max_score');

  const [validityDoc, setValidityDoc] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore storage quota
    }
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((l) => (l === 'vi' ? 'en' : 'vi'));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOG_KEY, JSON.stringify(logbook.slice(0, 40)));
    } catch {
      // ignore storage quota
    }
  }, [logbook]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlockedMissions));
    } catch {
      // ignore storage quota
    }
  }, [unlockedMissions]);

  const isMissionUnlocked = useCallback(
    (missionId) => unlockedMissions.includes(missionId),
    [unlockedMissions]
  );

  const unlockNextMission = useCallback((currentId) => {
    const idx = MISSION_ORDER.indexOf(currentId);
    if (idx < 0 || idx + 1 >= MISSION_ORDER.length) return;
    const nextId = MISSION_ORDER[idx + 1];
    setUnlockedMissions((prev) => (prev.includes(nextId) ? prev : [...prev, nextId]));
  }, []);

  const unlockAllMissions = useCallback(() => {
    setUnlockedMissions([...MISSION_ORDER]);
  }, []);

  const resetProgression = useCallback(() => {
    setUnlockedMissions([MISSION_ORDER[0]]);
  }, []);

  const evaluateDesign = useCallback(async (nextDesign, missionId) => {
    if (!nextDesign) return null;
    try {
      const rep = await apiFetch('/evaluate', {
        method: 'POST',
        body: { design: nextDesign, mission_id: missionId || nextDesign.mission, with_hints: false },
      });
      setEvalReport(rep);
      return rep;
    } catch (err) {
      setErrorMsg(`Evaluate error: ${err.message}`);
      return null;
    }
  }, []);

  const loadMission = useCallback(
    async (missionId, opts = {}) => {
      setBusy(true);
      setErrorMsg('');
      try {
        const detail = await apiFetch(`/missions/${encodeURIComponent(missionId)}`);
        setSelectedMissionId(missionId);
        setMissionDetail(detail);
        const presetKey = opts.presetId || (typeof detail.starter === 'string' ? detail.starter : 'starter');
        const d = resolvePresetDesign(detail.presets, presetKey, detail);
        setDesign(d);
        setActiveSlot('orbit');
        setBuildStage(opts.unlockAll === false ? 0 : SLOTS.length);
        setFlightData(null);
        setPreview(null);
        setPreviewRuns(0);
        setInspectSession(null);
        setInspectReport(null);
        setLaunchResult(null);
        setLifeData(null);
        setOutcome(null);
        setReputation(REP_MAX);
        setAttempts(0);
        setBudgetBonus(0);
        setDeadlineBonus(0);
        setOpsId(null);
        setOpsSnap(null);
        setOpsRunning(false);
        setDebrief(null);
        setPareto(null);
        if (d) await evaluateDesign(d, missionId);
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

  // Tu dong bat tutorial khi chuyen sang phase moi (khong bat lai khi nguoi choi da bam dong/bat dau phong)
  const prevPhaseRef = useRef('');
  useEffect(() => {
    if (story || phase === 'home' || phase === 'levels') {
      setTutorialOpen(false);
      return;
    }
    if (prevPhaseRef.current === phase) {
      return;
    }
    prevPhaseRef.current = phase;

    if (tutorialMode) {
      if (tutorialGuided) {
        setTutorialStep(0);
        setTutorialOpen(true);
      } else {
        setTutorialOpen(false);
      }
      return;
    }
    if (!seenTutorials[phase]) {
      setSeenTutorials((prev) => ({ ...prev, [phase]: true }));
      setTutorialStep(0);
      setTutorialOpen(true);
    }
  }, [phase, story, seenTutorials, tutorialMode, tutorialGuided]);

  const openTutorial = useCallback(() => {
    setTutorialStep(0);
    setTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);
    setSeenTutorials((prev) => (prev[phase] ? prev : { ...prev, [phase]: true }));
  }, [phase]);

  // Bat dau / choi lai man Sandbox (co tuy chon xem lai Tutorial hoac khong)
  const startTutorialSandbox = useCallback(
    async (withTutorial = true) => {
      const firstId = missions[0]?.id || selectedMissionId || 'MP-SC01-FIRST-EYES';
      prevPhaseRef.current = 'design';
      setTutorialMode(true);
      setTutorialGuided(Boolean(withTutorial));
      setStory(null);
      await loadMission(firstId, { presetId: 'good', unlockAll: !withTutorial });
      setActiveSlot('orbit');
      setBuildStage(withTutorial ? 0 : SLOTS.length);
      setPhase('design');
      setTutorialStep(0);
      setTutorialOpen(Boolean(withTutorial));
    },
    [missions, selectedMissionId, loadMission]
  );

  // Ket thuc man Huong dan Sandbox -> chuyen ngay sang man Chon Mission / Cot truyen (01.BRIEF) khong bao gio bi trang man hinh
  const completeTutorialToBrief = useCallback(async () => {
    const firstId = missions[0]?.id || selectedMissionId || 'MP-SC01-FIRST-EYES';
    prevPhaseRef.current = 'brief';
    setTutorialMode(false);
    setTutorialGuided(false);
    setTutorialOpen(false);
    setStory(null);
    setPhase('brief');
    await loadMission(firstId);
  }, [missions, selectedMissionId, loadMission]);

  // Khi nguoi choi chon linh kien: KHONG nhay tab ngay de ho thoai mai doc Loi ich / Tac hai va suy nghi
  const advanceBuildStage = useCallback(() => {
    // Giu nguyen tab hien tai, chi mo khoa khi nguoi choi nhan nut [TIEP THEO]
  }, []);

  // Nguoi choi nhan nut [TIEP THEO] -> mo khoa va chuyen sang thanh phan ke tiep theo thu tu 1..9
  const confirmSlotAndAdvance = useCallback(() => {
    const curIdx = SLOTS.findIndex((s) => s.id === activeSlot);
    if (curIdx < 0) return;
    if (curIdx + 1 < SLOTS.length) {
      const nextIdx = curIdx + 1;
      const nextSlot = SLOTS[nextIdx];
      setBuildStage((prev) => Math.max(prev, nextIdx));
      setActiveSlot(nextSlot.id);
      setTutorialStep(nextIdx);
    } else {
      // Da xong muc 9 (ADCS) -> chuyen sang buoc 9 (chi vao nut GO TO INSPECTION)
      setBuildStage(9);
      setTutorialStep(9);
    }
  }, [activeSlot]);

  // Chuyen tab da mo khoa va dong bo buoc huong dan
  const selectSlot = useCallback((slotId) => {
    setActiveSlot(slotId);
    const idx = SLOTS.findIndex((s) => s.id === slotId);
    if (idx >= 0) {
      setTutorialStep(idx);
    }
  }, []);

  // Tu dong tinh lai bieu do quy dao phong moi khi linh kien hoac mission doi
  const designKey = useMemo(() => (design ? JSON.stringify(design) : ''), [design]);
  useEffect(() => {
    if (!design || !selectedMissionId || phase !== 'design') return undefined;
    const reqId = ++previewReqRef.current;
    const timer = setTimeout(async () => {
      setPreviewUpdating(true);
      try {
        const fl = await apiFetch('/fly', {
          method: 'POST',
          body: { design, mission_id: selectedMissionId, allow_nofit: true },
        });
        if (previewReqRef.current === reqId) {
          setPreview(fl);
          setPreviewRuns((n) => n + 1);
        }
      } catch {
        // live scope failure stays non-blocking
      } finally {
        if (previewReqRef.current === reqId) setPreviewUpdating(false);
      }
    }, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designKey, selectedMissionId, phase]);

  // Ops real-time loop
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
    const id = setInterval(() => stepOps(Math.min(3600, opsWarp), []), 450);
    return () => clearInterval(id);
  }, [phase, opsRunning, opsId, opsWarp, stepOps]);

  const scenario = missionDetail?.scenario || {};
  const effectiveBudget = tutorialMode ? 999 : Number(scenario.budget_musd || 0) + budgetBonus;
  const effectiveDeadline = tutorialMode ? 99 : Number(scenario.deadline_months || 0) + deadlineBonus;

  const fitOf = (vehicleId) => accomm?.[`${design?.bus}__${design?.comm}`]?.[vehicleId] || null;
  const currentFit = design ? fitOf(design.launch?.vehicle) : null;
  const coreBars = useMemo(
    () => computeCoreBars(evalReport?.metrics, currentFit ? currentFit.ok : true),
    [evalReport, currentFit]
  );

  const playScene = (key, extra = {}, then = null) => {
    if (tutorialMode) {
      return then?.();
    }
    const ctx = {
      mission: selectedMissionId,
      budget: effectiveBudget || scenario.budget_musd,
      deadline: effectiveDeadline || scenario.deadline_months,
      rep: reputation,
      cost: Number(evalReport?.metrics?.['cost.total_musd'] || 0).toFixed(1),
      lang,
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

  const updateDesign = (mutator) => {
    if (!design) return;
    const next = structuredClone(design);
    mutator(next);
    setDesign(next);
    playSoundAsset(audioOn, '08-11-2026-relay_click.wav', 0.22);
    evaluateDesign(next, selectedMissionId);
  };

  const applyPreset = (presetId, unlockAll = false) => {
    const d = resolvePresetDesign(missionDetail?.presets, presetId, missionDetail);
    if (!d) return;
    setDesign(d);
    if (unlockAll) {
      setBuildStage(SLOTS.length); // mo khoa du 9 muc (truoc day chi 3 -> nut DEV preset van khoa 5 muc cuoi)
    }
    beep(audioOn, 920, 0.05);
    evaluateDesign(d, selectedMissionId);
  };

  const addLog = (success, headline, lesson) => {
    if (!design) return;
    const buildStr = [
      design.bus,
      design.power,
      design.battery,
      design.comm,
      design.obc,
      design.adcs,
      (design.instruments || []).join('+'),
      design.orbit,
      design.launch?.vehicle,
    ]
      .filter(Boolean)
      .join(' • ');
    setLogbook((prev) => [
      {
        n: (prev[0]?.n || 0) + 1,
        success,
        headline,
        lesson,
        build: buildStr,
        when: tutorialMode ? 'TUTORIAL' : selectedMissionId.replace('MP-', ''),
      },
      ...prev,
    ]);
  };

  const enterBuild = (missionOverride = null) => {
    const mid = missionOverride?.id || selectedMissionId;
    const budget = missionOverride?.scenario?.budget_musd ?? (effectiveBudget || scenario.budget_musd);
    const deadline = missionOverride?.scenario?.deadline_months ?? (effectiveDeadline || scenario.deadline_months);
    setActiveSlot('orbit');
    setBuildStage(tutorialMode && tutorialGuided ? 0 : SLOTS.length);
    setPhase('design');
    if (!tutorialMode && mid && !seenIntro[mid]) {
      setSeenIntro((s) => ({ ...s, [mid]: true }));
      playScene('intro', { mission: mid, budget, deadline, mood: { boss: 'smug', eng: 'worried' } });
    }
  };

  const enterInspect = () => {
    if (!design) return;
    const months = Number(evalReport?.metrics?.['schedule.months'] || 0);
    const delayMonths = tutorialMode ? 0 : Math.max(0, months - effectiveDeadline);
    const timeLimit = tutorialMode ? 90 : Math.max(15, INSPECT_BASE_SEC - delayMonths * 5);
    const defects = generateInspectionDefects(Date.now() + attempts * 137, design, catalog);
    setInspectSession({
      id: Date.now(),
      timeLimit,
      delayMonths,
      defects,
    });
    setInspectReport(null);
    setPhase('inspect');
    beep(audioOn, 720, 0.06);
  };

  const startLaunchFromInspect = async (fixedIds = []) => {
    if (!design) return;
    // Trong man Tutorial Sandbox: luon dam bao phong thanh cong, khong bi no do loi kiem dinh hay qua tai
    const outcomeInspect = tutorialMode
      ? { mode: 'clean', unfixed: [], flightFailure: null, orbitFault: null }
      : evaluateInspectionOutcome(inspectSession?.defects || [], fixedIds);
    setInspectReport(outcomeInspect);

    const launchFn = async () => {
      setBusy(true);
      setErrorMsg('');
      try {
        let fl = await apiFetch('/fly', {
          method: 'POST',
          body: { design, mission_id: selectedMissionId, allow_nofit: true },
        });
        if (tutorialMode && (fl.failure || !fl.meta?.reaches_orbit)) {
          const goodDesign = resolvePresetDesign(missionDetail?.presets, 'good', missionDetail) || design;
          const goodFl = await apiFetch('/fly', {
            method: 'POST',
            body: { design: goodDesign, mission_id: selectedMissionId, allow_nofit: true },
          });
          goodFl.meta = {
            ...goodFl.meta,
            vehicle: design.launch?.vehicle || goodFl.meta?.vehicle,
            site: design.launch?.site || goodFl.meta?.site,
            reaches_orbit: true,
          };
          goodFl.failure = null;
          fl = goodFl;
        } else if (!tutorialMode && !fl.failure && outcomeInspect.flightFailure) {
          fl.failure = outcomeInspect.flightFailure;
          fl.meta.reaches_orbit = false;
        }
        setFlightData(fl);
        setLaunchFired([]);
        setLaunchResult(null);
        setLifeData(null);
        setOutcome(null);
        setLaunchSeq((n) => n + 1);
        setPhase('launch');
      } catch (err) {
        setErrorMsg(`Flight simulation failed: ${err.message}`);
      } finally {
        setBusy(false);
      }
    };

    if (!tutorialMode && !seenPrelaunch[selectedMissionId]) {
      setSeenPrelaunch((s) => ({ ...s, [selectedMissionId]: true }));
      playScene('prelaunch', { mood: { boss: 'happy', eng: 'calm' } }, launchFn);
    } else {
      await launchFn();
    }
  };

  const onLaunchEvent = useCallback((name) => setLaunchFired((prev) => [...prev, name]), []);

  const onLaunchEnd = useCallback(
    (result) => {
      setLaunchResult(result);
      if (tutorialMode && result?.success) {
        if (tutorialGuided) {
          setTutorialStep(2);
          setTutorialOpen(true);
        }
        return;
      }
      if (!result.success) {
        const repAfter = Math.max(0, reputation - 1);
        setAttempts((n) => n + 1);
        setReputation(repAfter);
        addLog(
          false,
          result.failure?.title || { vi: 'Mất tên lửa', en: 'Rocket loss' },
          result.failure?.cause || ''
        );
        const key = result.aborted === 'scrub' ? 'abort_scrub' : result.aborted === 'fts' ? 'abort_fts' : 'launch_fail';
        const after = repAfter <= 0 ? () => playScene('fired', { rep: 0, mood: { boss: 'angry', eng: 'worried' } }) : null;
        // du lieu that cua su co (ten ten lua, bai phong, so lieu, cac moc bay) cho to bao tai nan trong cua so hoi thoai
        const accident = buildAccidentInfo({
          failure: result.failure,
          flight: flightData,
          catalog,
          cost: Number(evalReport?.metrics?.['cost.total_musd'] || 0),
        });
        setTimeout(
          () =>
            playScene(
              key,
              {
                rep: repAfter,
                failure: tx(result.failure?.title, lang).toLowerCase(),
                showImpact: true,
                success: false,
                failureId: result.failure?.kind || 'launch',
                accident,
                mood: { boss: 'angry', eng: 'worried' },
              },
              after
            ),
          700
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, selectedMissionId, reputation, evalReport, missionDetail, flightData, catalog, tutorialMode, tutorialGuided]
  );

  const startLife = async () => {
    if (!design) return;
    setBusy(true);
    setErrorMsg('');
    try {
      let life = await apiFetch('/campaign/lifetime', {
        method: 'POST',
        body: { design, mission_id: selectedMissionId },
      });
      if (tutorialMode && (!life?.outcome?.alive || !life?.outcome?.success)) {
        const goodDesign = resolvePresetDesign(missionDetail?.presets, 'good', missionDetail) || design;
        life = await apiFetch('/campaign/lifetime', {
          method: 'POST',
          body: { design: goodDesign, mission_id: selectedMissionId },
        });
        if (life?.outcome) {
          life.outcome.alive = true;
          life.outcome.success = true;
          life.dossier = null;
        }
      } else if (!tutorialMode && inspectReport?.orbitFault && Array.isArray(life?.steps) && life.steps.length >= 2) {
        // Neu bo sot 1 loi ve tinh o Phase 03.INSPECT -> ve tinh chet som o thang 2 tren quy dao
        const fault = inspectReport.orbitFault;
        const faultLabel = tx(fault.label, lang);
        const s0 = life.steps[0];
        const s1 = {
          ...life.steps[1],
          alive: false,
          soc: fault.id === 'SOLAR_APERTURE' ? 0.04 : life.steps[1].soc,
          events: [
            {
              code: 'INSPECT_FAULT',
              level: 'crit',
              text: {
                vi: `SỰ CỐ LẮP RÁP (${tx(fault.label, 'vi')}): ${tx(fault.symptom, 'vi')} Vệ tinh mất kiểm soát.`,
                en: `ASSEMBLY DEFECT (${tx(fault.label, 'en')}): ${tx(fault.symptom, 'en')} Spacecraft failed in orbit.`,
              },
            },
          ],
        };
        life.steps = [s0, s1];
        life.outcome.alive = false;
        life.outcome.survived_steps = 1;
        life.outcome.success = false;
        life.outcome.killer = 'inspection_fault';
        life.dossier = {
          id: 'inspection_fault',
          title: {
            vi: `HỎNG TRÊN QUỸ ĐẠO DO SÓT LỖI ${tx(fault.label, 'vi')}`,
            en: `ORBIT FAILURE: MISSED ${tx(fault.label, 'en')}`,
          },
          subsystem: faultLabel,
          cause: {
            vi: `Lỗi lắp ráp ${tx(fault.label, 'vi')} bị bỏ sót tại màn Kiểm định trước phóng (03.INSPECT). ${tx(fault.symptom, 'vi')}`,
            en: `Assembly defect ${tx(fault.label, 'en')} was not fixed during pre-flight inspection. ${tx(fault.symptom, 'en')}`,
          },
          lesson: {
            vi: 'Hãy dùng đèn X-Ray soi kỹ toàn bộ vệ tinh và tên lửa trước khi cho phép phóng.',
            en: 'Scan the full vehicle carefully during Pre-Flight Inspection.',
          },
          numbers: [{ label: 'missed_defect', value: faultLabel }],
        };
      }
      setLifeData(life);
      setPhase('life');
      playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.3);
    } catch (err) {
      setErrorMsg(`Orbit simulation failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const finishLife = () => {
    if (!lifeData) {
      setPhase('review');
      return;
    }
    if (tutorialMode) {
      playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.4);
      const o = lifeData.outcome || { alive: true, success: true, survived_steps: 12, usable_gb: 120, generated_gb: 120 };
      setOutcome({
        ...o,
        success: true,
        headline: tr(lang, 'Kết thúc Sandbox, quay về cốt truyện', 'Sandbox complete, return to campaign'),
        repLoss: 0,
        repAfter: reputation,
        dossier: null,
        score: lifeData.score || { grade: 'S' },
        sandboxComplete: true,
      });
      setTutorialOpen(false);
      prevPhaseRef.current = 'review';
      setPhase('review');
      return;
    }
    if (outcome) {
      setPhase('review');
      return;
    }
    const o = lifeData.outcome;
    const cost = Number(evalReport?.metrics?.['cost.total_musd'] || 0);
    const months = Number(evalReport?.metrics?.['schedule.months'] || 0);
    const overEffectiveBudget = effectiveBudget > 0 && cost > effectiveBudget;
    const overEffectiveDeadline = effectiveDeadline > 0 && months > effectiveDeadline;
    const loss = (o.success ? 0 : 1) + (overEffectiveBudget || overEffectiveDeadline ? 1 : 0);
    const repAfter = Math.max(0, reputation - loss);
    const headlineObj = o.success
      ? overEffectiveBudget || overEffectiveDeadline
        ? { vi: 'Hoàn thành nhiệm vụ, nhưng vượt trần Sếp giao', en: 'Mission complete, but exceeded constraints' }
        : { vi: 'Nhiệm vụ hoàn thành trọn vẹn', en: 'Mission accomplished' }
      : lifeData.dossier?.title || { vi: 'Nhiệm vụ thất bại', en: 'Mission failed' };
    const headline = tx(headlineObj, lang);

    setReputation(repAfter);
    setAttempts((n) => n + 1);
    if (o.success) unlockNextMission(selectedMissionId);
    addLog(
      o.success && !overEffectiveBudget && !overEffectiveDeadline,
      headlineObj,
      lifeData.dossier?.lesson || ''
    );
    setOutcome({
      ...o,
      headline,
      repLoss: loss,
      repAfter,
      dossier: lifeData.dossier,
      score: lifeData.score,
      missedInspection: o.killer === 'inspection_fault',
    });
    setPhase('review');
    playSoundAsset(audioOn, o.success ? '06-11-2026-chime.wav' : '08-11-2026-power_down.wav', 0.35);
    const after = repAfter <= 0 ? () => playScene('fired', { rep: 0, mood: { boss: 'angry', eng: 'worried' } }) : null;
    playScene(
      o.success ? 'review_ok' : 'review_fail',
      {
        rep: repAfter,
        evidence: o.evidence_usable,
        failure: tx(lifeData.dossier?.title, lang).toLowerCase(),
        showImpact: true,
        success: Boolean(o.success),
        failureId: lifeData.dossier?.id || o.killer || o.review_fail?.[0] || 'launch',
        mood: o.success ? { boss: 'happy', eng: 'happy' } : { boss: 'angry', eng: 'worried' },
      },
      after
    );
  };

  const applyBossOverride = () => {
    setBudgetBonus((b) => b + 80);
    setDeadlineBonus((d) => d + 18);
    setReputation((r) => Math.max(2, Math.min(REP_MAX, r + 1)));
    playSoundAsset(audioOn, '06-11-2026-chime.wav', 0.4);
  };

  const startOps = async () => {
    if (!design) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/ops', {
        method: 'POST',
        body: { design, mission_id: selectedMissionId, seed: Number(design.seed ?? missionDetail?.hazards?.seed ?? 0) },
      });
      setOpsId(res.ops_id);
      setOpsSnap(res.snapshot);
      setOpsEvents(res.snapshot?.events || []);
      setOpsRunning(true);
      setPhase('ops');
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
    try {
      const [debRes, advRes] = await Promise.all([
        apiFetch(`/ops/${encodeURIComponent(opsId)}/finish`, { method: 'POST' }),
        apiFetch('/advise', { method: 'POST', body: { mission_id: selectedMissionId, objective, k: 5 } }).catch(() => null),
      ]);
      setDebrief(debRes);
      setPareto(advRes);
      setPhase('debrief');
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
      const advRes = await apiFetch('/advise', { method: 'POST', body: { mission_id: selectedMissionId, objective: obj, k: 5 } });
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

  const navigatePhase = (targetId) => {
    const allowed = canEnterPhase(targetId, {
      currentPhase: phase,
      launchResult,
      design,
      inspectReport,
      flightData,
      lifeData,
      outcome,
    });
    if (!allowed) return;
    beep(audioOn, 660, 0.03);
    if (targetId !== 'ops') setOpsRunning(false);
    setPhase(targetId);
  };

  const value = {
    tutorialMode,
    setTutorialMode,
    tutorialGuided,
    setTutorialGuided,
    startTutorialSandbox,
    completeTutorialToBrief,
    phase,
    setPhase,
    lang,
    setLang,
    toggleLang,
    navigatePhase,
    theme,
    setTheme,
    audioOn,
    setAudioOn,
    errorMsg,
    setErrorMsg,
    busy,
    catalog,
    missions,
    selectedMissionId,
    missionDetail,
    loadMission,
    activeSlot,
    setActiveSlot,
    selectSlot,
    buildStage,
    setBuildStage,
    advanceBuildStage,
    confirmSlotAndAdvance,
    design,
    setDesign,
    updateDesign,
    applyPreset,
    evaluateDesign,
    evalReport,
    coreBars,
    preview,
    previewRuns,
    previewUpdating,
    inspectSession,
    inspectReport,
    enterInspect,
    startLaunchFromInspect,
    flightData,
    launchFired,
    launchResult,
    launchSeq,
    onLaunchEvent,
    onLaunchEnd,
    lifeData,
    startLife,
    finishLife,
    outcome,
    reputation,
    attempts,
    budgetBonus,
    deadlineBonus,
    effectiveBudget,
    effectiveDeadline,
    applyBossOverride,
    logbook,
    accomm,
    fitOf,
    currentFit,
    story,
    playScene,
    closeStory,
    tutorialOpen,
    setTutorialOpen, // OrbitScreen (Gunnystg) goi ham nay khi ket thuc 12 thang o Sandbox; truoc day khong duoc xuat -> sap trang
    tutorialStep,
    setTutorialStep,
    openTutorial,
    closeTutorial,
    enterBuild,
    opsId,
    opsSnap,
    opsRunning,
    setOpsRunning,
    opsWarp,
    setOpsWarp,
    rcsPulse,
    setRcsPulse,
    opsEvents,
    stepOps,
    startOps,
    finishOps,
    debrief,
    pareto,
    adviseObj,
    refreshAdvisor,
    validityDoc,
    dialogRef,
    openValidityModal,
    scenario,
    unlockedMissions,
    isMissionUnlocked,
    unlockAllMissions,
    resetProgression,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
