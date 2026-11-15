import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EngineerCircleAvatar } from '../story/Portraits';
import { SLOTS, getPartInsight } from '../core/gameMachine';
import { useGame } from '../core/GameContext';

/**
 * TutorialOverlay -- Chief Engineer Interactive Walkthrough:
 * 1. Highlights the active UI target cleanly with dim backdrop while allowing free interaction.
 * 2. Keeps the Chief Engineer dock top-right (or bottom-right toggle) so bottom controls stay clear.
 * 3. Walks through 02.BUILD subsystems (Where / Pros / Cons), 03.INSPECT 3 tasks, 04.LAUNCH_3D, and 05.ORBIT_12M (9 steps).
 */

export const TUTORIAL_STEPS = {
  design: [
    {
      target: 'build-slots',
      slotId: 'orbit',
      title: 'STEP 1/10 | SELECT TARGET ORBIT (1.ORBIT)',
      body: (
        <>
          Click different options in <span className="neon-green">1.ORBIT</span> on the left to review{' '}
          <span className="neon-green">Usage, Pros, and Cons</span>. When ready, press{' '}
          <span className="neon-green">[NEXT]</span> to unlock the launch vehicle slot.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'launch',
      title: 'STEP 2/10 | SELECT LAUNCH VEHICLE (2.LAUNCH)',
      body: (
        <>
          Choose <span className="neon-green">2.LAUNCH (Booster &amp; Site)</span>. Check{' '}
          <span className="neon-green">Lift Capacity (CAP kg)</span> and{' '}
          <span className="neon-green">Fairing Diameter (FAIR m)</span>, then click{' '}
          <span className="neon-green">[NEXT]</span>.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'bus',
      title: 'STEP 3/10 | SELECT SPACECRAFT BUS (3.BUS)',
      body: (
        <>
          Choose <span className="neon-green">3.BUS (Structural Frame)</span>. The bus sets{' '}
          <span className="neon-green">Maximum Dry Mass (≤ kg)</span> and{' '}
          <span className="neon-green">Payload Power Budget (W)</span>.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'instruments',
      title: 'STEP 4/10 | SELECT PAYLOAD INSTRUMENT (4.INSTR)',
      body: (
        <>
          Select <span className="neon-green">4.INSTR (Camera / Sensor)</span>. Note that{' '}
          <span className="neon-green">Basic-tier</span> cameras are light but suffer higher optical drift; heavy sensors require{' '}
          <span className="neon-green">more power and bandwidth</span>.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'power',
      title: 'STEP 5/10 | SELECT SOLAR ARRAY (5.POWER)',
      body: (
        <>
          Choose <span className="neon-green">5.POWER (Solar Array)</span> to power the spacecraft in sunlight.{' '}
          <span className="neon-green">Generated Power (GEN W)</span> must stay above total load plus battery recharge.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'battery',
      title: 'STEP 6/10 | SELECT BATTERY STORAGE (6.BATT)',
      body: (
        <>
          Choose <span className="neon-green">6.BATT (Li-Ion Pack)</span> to keep electronics alive through{' '}
          <span className="neon-green">Earth Eclipse</span> without brownout.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'comm',
      title: 'STEP 7/10 | SELECT DOWNLINK RADIO (7.COMM)',
      body: (
        <>
          Choose <span className="neon-green">7.COMM (Transmitter / Antenna)</span>.{' '}
          <span className="neon-green">Downlink Rate (Mbps)</span> must drain captured data faster than daily generation.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'obc',
      title: 'STEP 8/10 | SELECT FLIGHT COMPUTER (8.OBC)',
      body: (
        <>
          Choose <span className="neon-green">8.OBC (On-Board Computer)</span>.{' '}
          <span className="neon-green">Radiation Tolerance (RAD krad)</span> must exceed mission dose to prevent latch-ups.
        </>
      ),
    },
    {
      target: 'build-slots',
      slotId: 'adcs',
      title: 'STEP 9/10 | SELECT ATTITUDE CONTROL (9.ADCS)',
      body: (
        <>
          Choose <span className="neon-green">9.ADCS (Stabilization)</span>. Pointing error{' '}
          <span className="neon-green">PT (+/- deg)</span> must stay within camera limits to avoid image blur.
        </>
      ),
    },
    {
      target: 'build-next',
      title: 'STEP 10/10 | BUILD COMPLETE — PROCEED TO INSPECTION',
      body: (
        <>
          All 9 subsystems are unlocked. Click <span className="neon-green">[ GO TO INSPECTION ]</span> highlighted below to enter{' '}
          <span className="neon-green">Pre-Flight Diagnostics (3 Tasks)</span>.
        </>
      ),
    },
  ],
  inspect: [
    {
      target: 'inspect-cam-align',
      title: 'STEP 1/3 | PAYLOAD FOCUS: ALIGN OPTICAL AXIS',
      body: (
        <>
          Inspection opens in <span className="neon-green">PAYLOAD FOCUS</span> by default. Drag on the 3D viewport to align the{' '}
          <span className="neon-green">Mirror Optical Axis</span> with the <span className="neon-green">Vertical 0.0 deg Axis</span> and hold until locked at 100%.
        </>
      ),
    },
    {
      target: 'inspect-stage',
      title: 'STEP 2/3 | FULL STACK: AUDIO LEAK SCAN',
      body: (
        <>
          Once the mirror locks, the camera transitions to <span className="neon-green">FULL STACK</span>. Sweep across the rocket body, listen for the{' '}
          <span className="neon-green">loudest gas hiss peak</span>, and click the leak origin to seal it.
        </>
      ),
    },
    {
      target: 'inspect-tools',
      title: 'STEP 3/3 | X-RAY: LOCATE YELLOW WELD CRACKS',
      body: (
        <>
          Toggle <span className="neon-green">X-RAY MESH</span>, spot and click every yellow crack. If remaining cracks are inside the fairing, switch back to{' '}
          <span className="neon-green">PAYLOAD FOCUS</span>; the optical axis indicator only appears there.
        </>
      ),
    },
    {
      target: 'inspect-finish',
      title: 'ALL CHECKS CLEARED — ROLL OUT TO LAUNCH PAD',
      body: (
        <>
          Inspection complete. Click <span className="neon-green">[ FINISH INSPECTION ]</span> in the bottom-right corner to enter{' '}
          <span className="neon-green">3D Rocket Launch [04.LAUNCH_3D]</span>.
        </>
      ),
    },
  ],
  launch: [
    {
      target: 'launch-canvas',
      title: '3D LAUNCH (PAUSED) | PAD OBSERVATION',
      body: (
        <>
          Simulation is <span className="neon-green">PAUSED</span> while you read the guide. During flight, the rocket passes{' '}
          <span className="neon-green">Max-Q</span>, pitches smoothly into a <span className="neon-green">gravity turn</span>, stages, and deploys the payload. Speed starts at{' '}
          <span className="neon-green">x1</span> (adjustable up to x100).
        </>
      ),
    },
    {
      target: 'launch-sequencer',
      title: 'FLIGHT SEQUENCER | IGNITION READY',
      body: (
        <>
          The right panel tracks <span className="neon-green">IGNITION, LIFTOFF, MAX-Q, and PAYLOAD_SEP</span>. Click{' '}
          <span className="neon-green">[ START LAUNCH ]</span> below to ignite the engines.
        </>
      ),
    },
    {
      target: 'launch-next',
      title: 'ORBIT INSERTION 100% | ENTER ORBITAL OPERATIONS',
      body: (
        <>
          <span className="neon-green">LAUNCH SUCCESSFUL!</span> Click{' '}
          <span className="neon-green">[ ENTER 12-EPOCH ORBIT OPS [05] ]</span> highlighted below to verify imaging and downlink.
        </>
      ),
    },
  ],
  life: [
    {
      target: 'orbit-canvas',
      title: '1. WELCOME TO ORBITAL OPERATIONS (05.ORBIT)',
      body: (
        <>
          Payload separation <span className="neon-green">is not the end of the mission</span>. The spacecraft is now in orbit (paused) and must complete capture, onboard storage, and Earth downlink.
        </>
      ),
    },
    {
      target: 'orbit-region',
      title: '2. TARGET ZONE & OVERPASS OPPORTUNITIES',
      body: (
        <>
          The <span className="neon-green">12-epoch timeline</span> and ground track show target overpasses. The instrument can only collect valid frames while flying across designated target regions.
        </>
      ),
    },
    {
      target: 'orbit-capture',
      title: '3. OBSERVATION CAPTURE (01 | CAPTURED)',
      body: (
        <>
          When crossing a wildfire/mission target with steady ADCS pointing, the sensor captures a frame and increments <span className="neon-green">CAPTURED FRAMES</span>.
        </>
      ),
    },
    {
      target: 'orbit-storage',
      title: '4. ONBOARD STORAGE (02 | BUFFER)',
      body: (
        <>
          New frames buffer inside the <span className="neon-green">OBC onboard memory</span> (Store-and-Forward). Note: <span className="neon-green">stored data is not yet on Earth</span>; if storage fills before downlink, new imagery is dropped.
        </>
      ),
    },
    {
      target: 'orbit-comm',
      title: '5. GROUND STATION CONTACT (03 | CONTACT)',
      body: (
        <>
          Downlink works only inside a <span className="neon-green">ground station Line-of-Sight (LOS) window</span> with positive <span className="neon-green">Link Margin (&gt;= 3 dB)</span> and healthy battery charge (SOC).
        </>
      ),
    },
    {
      target: 'orbit-downlink',
      title: '6. DATA DOWNLINK THROUGHPUT',
      body: (
        <>
          During valid contact windows, the transmitter streams queued bytes down at <span className="neon-green">downlink rate (Mbps)</span>. Narrow bandwidth strands imagery in orbit.
        </>
      ),
    },
    {
      target: 'orbit-delivered',
      title: '7. DELIVERED EVIDENCE (04 | EARTH)',
      body: (
        <>
          The <span className="neon-green">DELIVERED FRAMES</span> counter increments only after a clear frame finishes <span className="neon-green">100% downlink transfer</span> to a ground station.
        </>
      ),
    },
    {
      target: 'orbit-speed',
      title: '8. TIME ACCELERATION',
      body: (
        <>
          Orbit ops always begin at real-time <span className="neon-green">1x</span>. Switch between <span className="neon-green">1x, 2x, 5x, 10x, 30x, and 100x</span> to fast-forward orbital passes. Click <span className="neon-green">[ START OPERATIONS ]</span> to run.
        </>
      ),
    },
    {
      target: 'orbit-next',
      title: '9. MISSION COMPLETION RULE',
      body: (
        <>
          Success requires that the spacecraft <span className="neon-green">survives, captures enough clear frames, AND completes 100% ground delivery</span>. Storage overflow, link dropouts, or low bandwidth cause failure even after reaching orbit. Click below to finish review.
        </>
      ),
    },
  ],
  brief: [
    {
      target: 'brief-missions',
      title: '1. SELECT CAMPAIGN MISSION',
      body: (
        <>
          Select a <span className="neon-green">Space Mission</span> on the left. You can also launch the{' '}
          <span className="neon-green">Sandbox Tutorial (Guided or Free)</span> anytime.
        </>
      ),
    },
    {
      target: 'brief-start',
      title: '2. ENTER INTEGRATION BAY [02.BUILD]',
      body: (
        <>
          Click <span className="neon-green">[ ENTER BUILD BAY ]</span> to start designing the spacecraft for your selected mission.
        </>
      ),
    },
  ],
  review: [
    {
      target: 'review-impact',
      title: '1. EARTH IMPACT & TELEMETRY REPORT',
      body: (
        <>
          Inspect the <span className="neon-green">real-world outcome</span> of the flight and its{' '}
          <span className="neon-green">technical root cause</span> in the dossier.
        </>
      ),
    },
    {
      target: 'review-confront',
      title: '2. DIRECTOR CONFRONTATION TO UNLOCK BUDGET',
      body: (
        <>
          Present the <span className="neon-green">matching failure evidence card</span> to force Management to unlock extra{' '}
          <span className="neon-green">Budget &amp; Schedule</span>.
        </>
      ),
    },
  ],
};

function computeFocusBox(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 6;
  const topbarBottom = (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0) + 4;
  const minY = Math.min(vh - 60, Math.max(6, topbarBottom));

  const boxX = Math.max(6, rect.left - pad);
  const boxY = Math.max(minY, rect.top - pad);
  const boxR = Math.min(vw - 6, rect.right + pad);
  const boxB = Math.min(vh - 6, rect.bottom + pad);
  return {
    x: boxX,
    y: boxY,
    w: Math.max(36, boxR - boxX),
    h: Math.max(36, boxB - boxY),
  };
}

export default function TutorialOverlay({ phase, stepIndex, onStepChange, onClose }) {
  const {
    tutorialMode,
    completeTutorialToBrief,
    design,
    catalog,
    activeSlot,
    selectSlot,
    confirmSlotAndAdvance,
    enterInspect,
  } = useGame();

  const steps = TUTORIAL_STEPS[phase] || [];
  const safeIndex = Math.max(0, Math.min(steps.length - 1, stepIndex));
  const step = steps[safeIndex];
  const [box, setBox] = useState(null);
  const [dockPos, setDockPos] = useState('top-right');
  const scrolledTargetRef = useRef('');

  const buildInsightInfo = (() => {
    if (phase !== 'design' || !design || !catalog?.tables) return null;
    const slotId = step?.slotId || activeSlot;
    if (!slotId) return null;
    const t = catalog.tables;
    let item = null;
    if (slotId === 'orbit') item = t.orbits?.[design.orbit];
    else if (slotId === 'launch') item = t.launch_vehicles?.[design.launch?.vehicle];
    else if (slotId === 'bus') item = t.buses?.[design.bus];
    else if (slotId === 'instruments') item = t.instruments?.[design.instruments?.[0]];
    else if (slotId === 'power') item = t.power_arrays?.[design.power];
    else if (slotId === 'battery') item = t.batteries?.[design.battery];
    else if (slotId === 'comm') item = t.comms?.[design.comm];
    else if (slotId === 'obc') item = t.avionics?.[design.obc];
    else if (slotId === 'adcs') item = t.avionics?.[design.adcs];
    if (!item) return null;
    const ins = getPartInsight(slotId, item);
    return { item, ins };
  })();

  useLayoutEffect(() => {
    if (!step) return undefined;
    let raf = 0;

    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`);
      if (!el) {
        setBox(null);
        return;
      }
      if (scrolledTargetRef.current !== `${phase}:${step.target}:${safeIndex}`) {
        scrolledTargetRef.current = `${phase}:${step.target}:${safeIndex}`;
        const r0 = el.getBoundingClientRect();
        if (r0.top < 12 || r0.bottom > window.innerHeight - 12) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setBox(computeFocusBox(r));
      } else {
        setBox(null);
      }
    };

    measure();
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    const stopTimer = setTimeout(() => cancelAnimationFrame(raf), 600);
    raf = requestAnimationFrame(tick);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(stopTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [phase, step, safeIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!step) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;

  const handleNextStep = () => {
    if (phase === 'design') {
      if (safeIndex < SLOTS.length) {
        confirmSlotAndAdvance();
      } else {
        enterInspect();
      }
      return;
    }
    if (phase === 'launch') {
      if (safeIndex === 0) {
        onStepChange(1);
      } else {
        onClose();
      }
      return;
    }
    if (phase === 'life') {
      if (safeIndex < 7) {
        onStepChange(safeIndex + 1);
      } else if (safeIndex === 7) {
        onClose();
      } else if (tutorialMode) {
        completeTutorialToBrief();
      } else {
        onClose();
      }
      return;
    }
    if (safeIndex + 1 < steps.length) {
      onStepChange(safeIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (safeIndex <= 0) return;
    const prevIdx = safeIndex - 1;
    if (phase === 'design' && prevIdx < SLOTS.length) {
      selectSlot(SLOTS[prevIdx].id);
    } else {
      onStepChange(prevIdx);
    }
  };

  let nextBtnLabel = 'NEXT';
  if (phase === 'design') {
    if (safeIndex < SLOTS.length - 1) {
      nextBtnLabel = `NEXT: UNLOCK ${SLOTS[safeIndex + 1].label}`;
    } else if (safeIndex === SLOTS.length - 1) {
      nextBtnLabel = 'DONE 9 SLOTS — SHOW INSPECT BTN';
    } else {
      nextBtnLabel = 'GO TO INSPECTION [03]';
    }
  } else if (phase === 'launch') {
    if (safeIndex === 0) nextBtnLabel = 'NEXT';
    else if (safeIndex === 1) nextBtnLabel = 'START LAUNCH';
    else nextBtnLabel = 'GOT IT';
  } else if (phase === 'life') {
    if (safeIndex < 7) nextBtnLabel = 'NEXT';
    else if (safeIndex === 7) nextBtnLabel = 'START OPERATIONS';
    else nextBtnLabel = tutorialMode ? 'RETURN TO CAMPAIGN' : 'GOT IT';
  } else if (safeIndex + 1 >= steps.length) {
    nextBtnLabel = 'GOT IT';
  }

  return (
    <div className="tutorial-overlay" aria-label="Chief Engineer Guide">
      <svg className="tutorial-svg" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
        <defs>
          <mask id="tut-spotlight-mask">
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {box && (
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {box && (
          <rect
            x="0"
            y="0"
            width={vw}
            height={vh}
            fill="rgba(4, 8, 12, 0.56)"
            mask="url(#tut-spotlight-mask)"
          />
        )}

        {box && (
          <g>
            <rect
              className="tutorial-focus-ring-neon"
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx="8"
            />
            <rect
              className="tutorial-focus-dash-neon"
              x={box.x - 4}
              y={box.y - 4}
              width={box.w + 8}
              height={box.h + 8}
              rx="10"
            />
          </g>
        )}
      </svg>

      {box && (
        <div
          className="tutorial-zone-tag neon"
          style={{ left: box.x, top: Math.max(46, box.y - 24) }}
        >
          [ ACTIVE ZONE {safeIndex + 1}/{steps.length} ]
        </div>
      )}

      <aside
        className={`eng-tutorial-dock ${dockPos === 'top-right' ? 'pos-top-right' : 'pos-bottom-right'}`}
        role="region"
        aria-live="polite"
      >
        <div className="eng-tutorial-bubble">
          <div className="eng-tutorial-head">
            <span className="eng-tutorial-kicker">
              <span className="neon-dot" /> CHIEF ENGINEER // {tutorialMode ? 'SANDBOX GUIDE' : 'GUIDE'}
            </span>
            <div className="eng-tutorial-meta">
              <button
                type="button"
                className="eng-skip-btn"
                onClick={() => setDockPos((p) => (p === 'top-right' ? 'bottom-right' : 'top-right'))}
                title="Move guide dock top or bottom if blocking view"
              >
                {dockPos === 'top-right' ? 'MOVE DOWN' : 'MOVE UP'}
              </button>
              {tutorialMode && (
                <button
                  type="button"
                  className="eng-skip-btn"
                  onClick={completeTutorialToBrief}
                  title="Skip tutorial and open Mission Selection"
                >
                  SELECT MISSION
                </button>
              )}
              <button
                type="button"
                className="eng-skip-btn"
                onClick={onClose}
                title="Hide guide dialog (toggle anytime from the top bar)"
              >
                HIDE [ESC]
              </button>
            </div>
          </div>

          <div className="eng-tutorial-title">{step.title}</div>
          <div className="eng-tutorial-body">{step.body}</div>

          {phase === 'design' && safeIndex < SLOTS.length && buildInsightInfo?.ins && (
            <div className="eng-part-live-box">
              <div className="eng-part-live-title">
                SELECTED: <span className="neon-green">{buildInsightInfo.item.name || buildInsightInfo.item.id}</span>
              </div>
              <div className="eng-part-live-row">
                <b>Where used:</b> {buildInsightInfo.ins.where}
              </div>
              <div className="eng-part-live-row pros">
                <b>Pros (+):</b> {buildInsightInfo.ins.pros}
              </div>
              <div className="eng-part-live-row cons">
                <b>⚠ Risks / Cons (-):</b> {buildInsightInfo.ins.cons}
              </div>
            </div>
          )}

          <div className="eng-tutorial-foot">
            <div className="tutorial-dots">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`tutorial-dot neon ${idx === safeIndex ? 'active' : ''}`}
                  aria-label={`Step ${idx + 1}`}
                  onClick={() => {
                    if (phase === 'design' && idx < SLOTS.length) {
                      selectSlot(SLOTS[idx].id);
                    } else {
                      onStepChange(idx);
                    }
                  }}
                />
              ))}
            </div>

            <div className="row-wrap">
              {safeIndex > 0 && (
                <button type="button" className="btn small" onClick={handlePrevStep}>
                  PREV
                </button>
              )}
              {phase === 'launch' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  START LAUNCH
                </button>
              )}
              {phase === 'life' && safeIndex === 0 && (
                <button type="button" className="btn small neon-btn" onClick={onClose}>
                  START OPERATIONS
                </button>
              )}
              <button type="button" className="btn small neon-btn" onClick={handleNextStep}>
                {nextBtnLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="eng-tutorial-avatar-wrap" title="Chief Engineer Guide">
          <div className="eng-tutorial-circle">
            <EngineerCircleAvatar />
          </div>
          <span className="eng-avatar-tag">CHIEF ENG.</span>
        </div>
      </aside>
    </div>
  );
}
