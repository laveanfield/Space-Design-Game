// Compress quiet orbital arcs, but stop at every operation and contact sample.
export function nextMissionTime(report, now, end) {
  const nextEvent = report.events.find((e) => e.t_s > now)?.t_s ?? end;
  const nextContact = report.samples.find((s) => s.t_s > now && s.state !== 'NO_PASS')?.t_s ?? end;
  return Math.min(end, now + 1800, nextEvent, nextContact);
}

export function evidenceAtTime(evidence, time) {
  return evidence.filter((s) => s.t_s <= time).map((s) => ({
    ...s,
    received: s.delivered_k != null && s.delivered_t_s != null && s.delivered_t_s <= time,
  }));
}
