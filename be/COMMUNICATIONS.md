# Mission communications

Configure station, observation target, transmit power/bitrate and battery reserve
in **BUILD**, then launch. Successful separation automatically opens orbital
operations; there is no separate LINK_OPS step or capture/transmit button.
One clock drives the map, contact state and received images. Quiet arcs accelerate,
but playback stops at operation events and contact samples. Pause and speed controls
apply to the whole mission. The RF lab is available only through `?dev=1`.

State-specific explanations connect design decisions to consequences: power versus
battery, bitrate versus signal margin, and orbit/station access versus backlog.
Return to BUILD after review to try another policy. Images remain pending until
their complete downlink timestamp; campaign failures still prevent later delivery.

The campaign calls the same simulation when entering orbital life. Captures and
completed image transfers replace the old random wildfire shots and downlink
credits. Only clear, fully delivered image packets count toward the three-image
objective. Annual radiation, power degradation, and orbit-decay failures still
truncate the campaign's evidence timeline. Failure dossiers include contact and
backlog diagnostics.

## Model boundary

- Seven **continuous representative days**, not an annual contact prediction.
  Their twelve time segments are paired with the campaign's twelve aging milestones.
- Circular orbit, rotating spherical Earth, explicit ECI-to-ECEF conversion,
  60-second operations steps. AOS/LOS timing has one-step resolution.
- Illustrative camera footprint: target elevation at least 45 degrees; one image
  per target per 24 hours. RGB needs solar elevation above 10 degrees at the target.
- Each evidence packet represents an equal share of the daily payload budget across
  the planned mission targets, at least 0.02 GB. Storage capacity comes from the
  selected OBC's `storage_gb` catalog property. Full storage rejects new images;
  queued packets persist.
- The vendored `cubesat_link.evaluate_link` computes geometric visibility, free-space
  loss and a conditional budget. Gameplay sends the configured catalog bitrate
  times the ruleset efficiency only at margin >=3 dB and above the battery reserve.
  Bitrate is an explicit game policy; it is not inferred by the RF solver.
- A sampled reference P.834 atmosphere is ray traced at each contact's peak for
  0.1–12 GHz. Campaign access uses the geometric elevation mask, with reference
  rays exposed separately. Manual OPS uses the refracted solution during contact.
  Frequencies outside the profile's range use geometric propagation explicitly.
- Receiver gain (35 dBi RF, 110 dBi optical), temperature (300 K), required Eb/N0
  (9.6 dB), cable loss (2 dB), matched circular polarization and clear-sky
  attenuation are educational assumptions. Weather/plasma attenuation is explicitly
  **assumed**, not measured.
- Battery integration includes eclipse, base loads, camera acquisition, and active
  transmit consumption. Reserve policies retain 6%, 25%, or 55% battery for radio.
  They do not prevent a weak power system from losing energy to base loads.

## API

`POST /campaign/communications` accepts the same `design` and `mission_id` envelope
as `/campaign/lifetime`. Optional `design.communications`:

```json
{
  "station_id": "GS-GOLDSTONE",
  "target_id": "all",
  "tx_scale": 1.0,
  "rate_scale": 1.0,
  "strategy": "balanced"
}
```

Power scale: 0.25–1.0. Bitrate scale: 0.1–1.0. Strategies: `balanced`, `data_first`,
`save_power`. Mission metadata supplies `communications_targets`. Responses contain
samples, contact windows and reference rays, packet evidence, energy/data summaries,
diagnostics, and explicit model assumptions. Existing designs work with defaults.

Regression coverage includes blocked Earth paths, actual neutral-ray computation,
power/rate link-budget monotonicity, FIFO data conservation, partial transmission,
low-battery radio holds, unreachable stations/targets, and client-side input errors.
