/**
 * gameMachine -- Finite State Machine & quy tac gameplay cho Space Mission Control Terminal.
 */

export const REP_MAX = 3;
export const INSPECT_BASE_SEC = 45;

export const MISSION_ORDER = [
  'MP-SC01-FIRST-EYES',
  'MP-SC03-SPACE-WEATHER',
  'MP-SC04-GHG',
];

export const PHASES = [
  { id: 'home', label: '00.HOME' },
  { id: 'brief', label: '01.BRIEF' },
  { id: 'design', label: '02.BUILD' },
  { id: 'inspect', label: '03.INSPECT' },
  { id: 'launch', label: '04.LAUNCH_3D' },
  { id: 'life', label: '05.ORBIT_12M' },
  { id: 'review', label: '06.REVIEW' },
];

export const SLOTS = [
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

/** 6 hang muc kiem dinh co dinh (Phase 03.INSPECT). */
export const CHECKLIST_TEMPLATES = [
  {
    id: 'THRUSTER_COUPLING',
    label: 'THRUSTER COUPLING',
    group: 'rocket',
    basePos: [0.06, -0.78, 0.14],
    meter: 'structVib',
    symptom: {
      vi: 'Khớp cổ góp loa phụt lệch trục ~4° — nguy cơ mất ổn định khi đốt tầng 1.',
      en: 'Gimbal thruster coupling misaligned ~4° — risk of instability during Stage 1 burn.',
    },
  },
  {
    id: 'FUEL_LINES',
    label: 'FUEL LINES',
    group: 'rocket',
    basePos: [-0.12, -0.24, 0.18],
    meter: 'pressureDiff',
    symptom: {
      vi: 'Rò rỉ vi mô ống dẫn chất lỏng lạnh dọc thân tên lửa.',
      en: 'Micro-leak on cryogenic feed line along rocket core.',
    },
  },
  {
    id: 'PAYLOAD_INTERFACE',
    label: 'PAYLOAD INTERFACE',
    group: 'rocket',
    basePos: [0.1, 0.42, 0.14],
    meter: 'structVib',
    symptom: {
      vi: 'Chốt ngàm adapter khoang tải & fairing kẹt bản lề tách.',
      en: 'Payload adapter latch and fairing separation hinge jammed.',
    },
  },
  {
    id: 'AVIONICS_BANK',
    label: 'AVIONICS BANK',
    group: 'sat',
    basePos: [-0.1, 0.6, 0.12],
    meter: 'emiNoise',
    symptom: {
      vi: 'Tia tĩnh điện & nhiễu bus nguồn phát ra từ khoang OBC/ADCS.',
      en: 'Static discharge and power bus noise detected from avionics bay.',
    },
  },
  {
    id: 'SOLAR_APERTURE',
    label: 'SOLAR APERTURE',
    group: 'sat',
    basePos: [0.18, 0.72, 0.06],
    meter: 'busRipple',
    symptom: {
      vi: 'Bản lề SADA cánh pin mặt trời kẹt chốt bung sau tách tầng.',
      en: 'Solar array hinge jammed, blocking post-separation deployment.',
    },
  },
  {
    id: 'SATELLITE_ALIGN',
    label: 'SATELLITE ALIGN',
    group: 'sat',
    basePos: [-0.04, 0.84, -0.14],
    meter: 'emiNoise',
    symptom: {
      vi: 'Ống kính Star Tracker / chảo anten chính lệch góc tham chiếu.',
      en: 'Star tracker boresight and main antenna off reference angle.',
    },
  },
];

export function canEnterPhase(targetPhase, { currentPhase, launchResult, design, inspectReport, flightData, lifeData, outcome }) {
  if (currentPhase === 'launch' && !launchResult) return false;
  if (targetPhase === 'design' || targetPhase === 'inspect') return Boolean(design);
  if (targetPhase === 'launch') return Boolean(flightData && inspectReport);
  if (targetPhase === 'life') return Boolean(lifeData);
  if (targetPhase === 'review') return Boolean(outcome);
  return true;
}

export function resolvePresetDesign(presets, presetId, missionDetail) {
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

/** Tinh 4 thanh KPI song con (POWER, MASS, SIGNAL, INTEGRITY) cho Phase 02.BUILD. */
export function computeCoreBars(metrics, fitOk = true) {
  if (!metrics) return null;
  const loadW = Math.max(0.1, Number(metrics['power.load_w'] || 0));
  const marginW = Number(metrics['power.margin_w'] || 0);
  const pwrPct = Math.max(8, Math.min(100, ((marginW + loadW) / (loadW * 1.4)) * 100));
  const pwrStatus = marginW < 0 ? 'err' : marginW < loadW * 0.15 ? 'warn' : 'ok';

  const dryKg = Number(metrics['mass.dry_kg'] || 0);
  const capKg = Number(metrics['mass.capacity_kg'] || 0);
  const busLimit = Number(metrics['mass.bus_limit_kg'] || 1e9);
  const compat = Number(metrics['launch.compatible'] ?? 1) > 0.5;
  const effLimit = capKg > 0 ? Math.min(capKg, busLimit) : busLimit;
  const massOver = !fitOk || !compat || dryKg > effLimit;
  const massFrac = dryKg / Math.max(1, effLimit);
  const massPct = massOver ? 18 : Math.max(25, Math.min(100, (1.12 - massFrac) * 100));
  const massStatus = massOver ? 'err' : massFrac > 0.88 ? 'warn' : 'ok';

  const genGb = Math.max(0.01, Number(metrics['data.generated_gb_per_day'] || 0));
  const dlGb = Number(metrics['data.downlink_gb_per_day'] || 0);
  const dlRatio = Math.min(1, dlGb / genGb);
  const adcsDeg = Number(metrics['pointing.adcs_deg'] || 1);
  const reqDeg = Math.max(0.001, Number(metrics['pointing.required_deg'] || 1));
  const ptRatio = adcsDeg <= reqDeg ? 1 : Math.max(0.1, reqDeg / adcsDeg);
  const sigPct = Math.max(10, Math.min(100, (0.5 * dlRatio + 0.5 * ptRatio) * 100));
  const sigStatus = dlRatio < 0.85 || adcsDeg > reqDeg ? 'err' : dlRatio < 1.0 ? 'warn' : 'ok';

  const dose = Math.max(0.1, Number(metrics['radiation.dose_krad'] || 0));
  const tol = Number(metrics['radiation.tolerance_krad'] || 0);
  const radRatio = tol / dose;
  const lifeY = Number(metrics['lifetime.years'] || 0);
  const intPct = Math.max(10, Math.min(100, (Math.min(radRatio, 1.5) / 1.5) * 80 + Math.min(1, lifeY / 1.5) * 20));
  const intStatus = radRatio < 1.05 || lifeY < 0.8 ? 'err' : radRatio < 1.4 ? 'warn' : 'ok';

  return {
    power: { pct: pwrPct, status: pwrStatus, tag: `${marginW >= 0 ? '+' : ''}${marginW.toFixed(0)}W` },
    mass: {
      pct: massPct,
      status: massStatus,
      tag: !fitOk ? 'NO-FIT' : dryKg > busLimit ? 'BUS-OVER' : `${dryKg.toFixed(0)}kg`,
    },
    signal: {
      pct: sigPct,
      status: sigStatus,
      tag: dlRatio < 0.9 ? 'DL-LOW' : adcsDeg > reqDeg ? 'BLUR' : 'LOCK',
    },
    integrity: {
      pct: intPct,
      status: intStatus,
      tag: radRatio < 1 ? 'RAD-FAIL' : lifeY < 1 ? 'DECAY' : `${tol.toFixed(0)}krad`,
    },
  };
}

/** Sinh ngau nhien 3 loi an tu 6 hang muc kiem dinh. */
export function generateInspectionDefects(salt = Date.now()) {
  let state = (Math.floor(salt) ^ 0x9e3779b9) >>> 0;
  const rnd = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const pool = [...CHECKLIST_TEMPLATES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3).map((tpl) => ({
    ...tpl,
    pos: [
      tpl.basePos[0] + (rnd() - 0.5) * 0.08,
      tpl.basePos[1] + (rnd() - 0.5) * 0.08,
      tpl.basePos[2] + (rnd() - 0.5) * 0.06,
    ],
  }));
}

/** Danh gia hau qua khi ket thuc Phase 03.INSPECT. */
export function evaluateInspectionOutcome(defects, fixedIds) {
  const unfixed = (defects || []).filter((d) => !fixedIds.includes(d.id));
  if (unfixed.length === 0) {
    return { mode: 'clean', unfixed: [], flightFailure: null, orbitFault: null };
  }
  const hasRocketFault = unfixed.some((d) => d.group === 'rocket');
  if (unfixed.length >= 2 || hasRocketFault) {
    const names = unfixed.map((d) => d.label).join(', ');
    return {
      mode: 'launch_explode',
      unfixed,
      flightFailure: {
        kind: 'inspection_catastrophe',
        t: 26.0,
        explode: true,
        constraint: 'inspection',
        title: {
          vi: `NỔ TÊN LỬA DO BỎ SÓT LỖI KIỂM ĐỊNH (${names})`,
          en: `VEHICLE EXPLOSION: MISSED PRE-FLIGHT DEFECTS (${names})`,
        },
        cause: {
          vi: `Đội kiểm định đã bỏ sót ${unfixed.length} lỗi phần cứng nghiêm trọng (${names}) trước khi rời bệ. Tên lửa mất ổn định và phát nổ trên đường bay.`,
          en: `Pre-flight inspection missed critical hardware defects (${names}). The stack suffered catastrophic failure in flight.`,
        },
        numbers: unfixed.map((d) => ({ label: d.label, value: 'UNFIXED' })),
      },
      orbitFault: null,
    };
  }
  return {
    mode: 'orbit_early_fail',
    unfixed,
    flightFailure: null,
    orbitFault: unfixed[0],
  };
}
