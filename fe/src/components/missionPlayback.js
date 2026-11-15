// Compress quiet orbital arcs, but stop at every operation and contact sample.
export function nextMissionTime(report, now, end) {
  const nextEvent = report.events.find((e) => e.t_s > now)?.t_s ?? end;
  const nextContact = report.samples.find((s) => s.t_s > now && s.state !== 'NO_PASS')?.t_s ?? end;
  return Math.min(end, now + 1800, nextEvent, nextContact);
}

export function evidenceAtTime(evidence, time) {
  return evidence.filter((s) => s.t_s <= time).map((s) => ({
    ...s,
    received:
      s.delivered_k != null &&
      s.delivered_t_s != null &&
      Number(s.remaining_gb ?? 0) <= 1e-9 &&
      s.delivered_t_s <= time,
  }));
}

const BLUR_USABLE = 0.35;

/**
 * Authoritative check for whether "The Orbital Times" success newspaper may appear.
 *
 * Requires valid orbital insertion, authoritative mission evaluator success,
 * and confirmed complete ground-station delivery of all required clear evidence.
 */
export function canShowOrbitalTimes({
  missionId,
  success,
  outcome,
  lifeData,
  launchResult,
  flightData,
} = {}) {
  if (success === false) return false;
  if (launchResult && (!launchResult.success || launchResult.failure)) return false;
  if (flightData && (flightData.failure || flightData.meta?.reaches_orbit === false)) return false;

  const authOutcome = outcome || lifeData?.outcome;
  if (!authOutcome || authOutcome.success !== true) return false;
  if (lifeData?.outcome && lifeData.outcome.success !== true) return false;
  if (authOutcome.alive === false && lifeData?.imaging?.theme === 'space_weather') return false;
  if (authOutcome.missedInspection || authOutcome.killer === 'inspection_fault') return false;
  if (Array.isArray(authOutcome.review_fail) && authOutcome.review_fail.length > 0) return false;

  if (missionId && authOutcome.missionId && authOutcome.missionId !== missionId) {
    return false;
  }

  const need = Number(
    lifeData?.evidence_need ??
      (lifeData?.imaging ? 3 : authOutcome.evidence_usable != null ? 3 : 0)
  );

  if (need > 0) {
    const usableCount = Number(authOutcome.evidence_usable ?? 0);
    if (usableCount < need) return false;

    if (Array.isArray(lifeData?.evidence)) {
      const completeClear = lifeData.evidence.filter(
        (shot) =>
          shot &&
          shot.delivered_k != null &&
          Number(shot.remaining_gb ?? 0) <= 1e-9 &&
          Number(shot.blur ?? 0) < BLUR_USABLE
      );
      if (completeClear.length < need) return false;
    }

    const comms = lifeData?.communications;
    if (comms) {
      const summary = comms.summary || {};
      if (Number(summary.captured ?? 0) < need) return false;
      if (Number(summary.delivered ?? 0) < need) return false;
      if (Number(summary.sent_gb ?? 0) <= 0) return false;
      if (Number(summary.usable_min ?? 0) <= 0) return false;
      if (!Array.isArray(comms.windows) || comms.windows.length === 0) return false;
      if (Array.isArray(comms.evidence)) {
        const deliveredPackets = comms.evidence.filter(
          (shot) =>
            shot &&
            shot.delivered_t_s != null &&
            shot.delivered_k != null &&
            Number(shot.remaining_gb ?? 0) <= 1e-9 &&
            Number(shot.blur ?? 0) < BLUR_USABLE
        );
        if (deliveredPackets.length < need) return false;
      }
    }
  }

  return true;
}

/**
 * Stateful gate ensuring "The Orbital Times" triggers at most once per unique mission run,
 * and resets cleanly when restarting or switching missions.
 */
export function createOrbitalTimesGate() {
  let shownForRunKey = null;
  let activeMissionId = null;

  return {
    reset(nextMissionId = null) {
      shownForRunKey = null;
      activeMissionId = nextMissionId;
    },
    shouldShow(context = {}) {
      const { missionId, runKey = 'default' } = context;
      if (missionId && activeMissionId && missionId !== activeMissionId) {
        shownForRunKey = null;
      }
      if (missionId) {
        activeMissionId = missionId;
      }
      if (!canShowOrbitalTimes(context)) {
        return false;
      }
      const key = `${missionId || 'mission'}::${runKey}`;
      if (shownForRunKey === key) {
        return false;
      }
      shownForRunKey = key;
      return true;
    },
    isShownFor(missionId, runKey = 'default') {
      return shownForRunKey === `${missionId || 'mission'}::${runKey}`;
    },
  };
}
