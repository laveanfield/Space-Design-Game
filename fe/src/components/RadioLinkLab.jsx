import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';

const EARTH_RADIUS_M = 6371000;
const BAND_GHZ = { UHF: 0.4, S: 2.2, X: 8.2, Ka: 26, optical: 193000 };

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function effectValue(effect) {
  return effect?.value == null ? null : Number(effect.value);
}

function Metric({ label, value, unit, status }) {
  return (
    <div className="kpi-box ray-metric">
      <div className="kpi-label">{label}</div>
      <div className="kpi-val">{value == null ? 'N/C' : `${value}${unit ? ` ${unit}` : ''}`}</div>
      {status && <div className="small muted">{status}</div>}
    </div>
  );
}

export default function RadioLinkLab({ catalog, design }) {
  const tables = catalog?.tables || {};
  const stations = useMemo(() => Object.values(tables.ground_stations || {}), [tables.ground_stations]);
  const orbit = tables.orbits?.[design?.orbit] || {};
  const comm = tables.comms?.[design?.comm] || {};

  const [stationId, setStationId] = useState('');
  const [altitudeKm, setAltitudeKm] = useState(550);
  const [frequencyGhz, setFrequencyGhz] = useState(2.2);
  const [longitudeOffsetDeg, setLongitudeOffsetDeg] = useState(0);
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!stationId && stations.length) setStationId(stations[0].id);
  }, [stationId, stations]);

  useEffect(() => {
    setAltitudeKm(numberOr(orbit.altitude_km, 550));
  }, [design?.orbit, orbit.altitude_km]);

  useEffect(() => {
    setFrequencyGhz(BAND_GHZ[comm.band] || 2.2);
  }, [design?.comm, comm.band]);

  const station = stations.find((item) => item.id === stationId) || stations[0];
  const result = payload?.result;
  const geometry = result?.geometry;
  const budget = result?.budget;
  const fspl = effectValue(result?.losses_db?.free_space);
  const receivedPower = effectValue(budget?.received_power_dbm);
  const margin = effectValue(budget?.margin_db);
  const pathAvailable = result?.path_available;
  const rayColor = pathAvailable === true ? '#38e594' : pathAvailable === false ? '#ff5c6c' : '#ffb84d';

  const trace = async () => {
    if (!station) return;
    setBusy(true);
    setError('');
    try {
      const lat = (numberOr(station.lat_deg, 0) * Math.PI) / 180;
      const lon = ((numberOr(station.lon_deg, 0) + longitudeOffsetDeg) * Math.PI) / 180;
      const radius = EARTH_RADIUS_M + Math.max(1, altitudeKm) * 1000;
      const position = [
        radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.cos(lat) * Math.sin(lon),
        radius * Math.sin(lat),
      ];
      const rateBps = Math.max(numberOr(comm.downlink_mbps, 1), 0.000001) * 1e6;
      const receiverThresholdDbm =
        10 * Math.log10(1.380649e-23 * 300) + 10 * Math.log10(rateBps) + 9.6 + 30;
      const txPowerW = Math.max(numberOr(comm.tx_power_w, 1), 0.000001);

      const response = await apiFetch('/radio-link/solve', {
        method: 'POST',
        body: {
          schema_version: '1.0',
          operation: 'evaluate_link',
          earth: { model: 'sphere', radius_m: EARTH_RADIUS_M },
          station: {
            lat_deg: numberOr(station.lat_deg, 0),
            lon_deg: numberOr(station.lon_deg, 0),
            altitude_m: 0,
            min_elevation_deg: numberOr(station.min_elevation_deg, 0),
          },
          state: {
            position_m: position,
            frame: 'ECEF',
            epoch_utc: new Date().toISOString(),
          },
          frequency_hz: Math.max(0.001, frequencyGhz) * 1e9,
          vacuum: true,
          radio: {
            tx_power_dbm: 10 * Math.log10(txPowerW * 1000),
            tx_gain_dbi: numberOr(comm.antenna_gain_dbi, 0),
            rx_gain_dbi: 35,
            tx_pointing_loss_db: 0,
            rx_pointing_loss_db: 0,
            cable_loss_db: 2,
            receiver_threshold_dbm: receiverThresholdDbm,
            receiver_mode: `${numberOr(comm.downlink_mbps, 1)} Mbps game radio`,
            antenna_basis: 'Ideal tracking in interactive ray-trace lab',
            required_margin_db: 3,
          },
          polarization: {
            tx: 'linear',
            rx: 'linear',
            alignment_rad: 0,
          },
        },
      });
      setPayload(response);
    } catch (err) {
      setPayload(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const elevation = geometry?.elevation_deg;
  const satelliteY = 78 + Math.min(150, Math.abs(longitudeOffsetDeg) * 4.2);

  return (
    <div className="ray-lab-grid">
      <section className="panel ray-console">
        <h2 className="panel-title">
          <span>RADIO PATH RAY TRACING LAB</span>
          <span className={`badge ${pathAvailable === true ? 'ok' : pathAvailable === false ? 'err' : 'info'}`}>
            CUBESAT-LINK {payload?.release || '0.2.0'}
          </span>
        </h2>

        <div className="ray-controls">
          <label>
            <span>GROUND STATION</span>
            <select value={stationId} onChange={(event) => setStationId(event.target.value)}>
              {stations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>ALTITUDE (KM)</span>
            <input
              type="number"
              min="1"
              max="50000"
              value={altitudeKm}
              onChange={(event) => setAltitudeKm(numberOr(event.target.value, 550))}
            />
          </label>
          <label>
            <span>FREQUENCY (GHZ)</span>
            <input
              type="number"
              min="0.001"
              step="0.1"
              value={frequencyGhz}
              onChange={(event) => setFrequencyGhz(numberOr(event.target.value, 2.2))}
            />
          </label>
          <label>
            <span>SUBPOINT OFFSET (°)</span>
            <input
              type="number"
              min="-80"
              max="80"
              value={longitudeOffsetDeg}
              onChange={(event) => setLongitudeOffsetDeg(numberOr(event.target.value, 0))}
            />
          </label>
        </div>

        <div className="row-between ray-runbar">
          <div className="small muted">
            DESIGN: {design?.comm || 'manual'} • {design?.orbit || 'manual'} • VACUUM BASELINE
          </div>
          <button className="btn primary" disabled={busy || !station} onClick={trace}>
            {busy ? 'TRACING…' : 'TRACE SIGNAL'}
          </button>
        </div>

        {error && <div className="banner-err">RAY TRACE ERROR: {error}</div>}

        <div className="ray-viewport">
          <svg viewBox="0 0 720 340" role="img" aria-label="Radio path from ground station to satellite">
            <defs>
              <radialGradient id="earthGlow">
                <stop offset="0%" stopColor="#174f82" />
                <stop offset="100%" stopColor="#08243c" />
              </radialGradient>
              <filter id="rayGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="185" cy="210" r="116" fill="url(#earthGlow)" stroke="#48c9ff" strokeWidth="2" />
            <circle cx="185" cy="210" r="123" fill="none" stroke="#48c9ff" strokeOpacity="0.24" />
            <circle cx="298" cy="181" r="7" fill="#ffb84d" />
            <text x="252" y="213" fill="#ffcf77" fontSize="13">{station?.name || 'STATION'}</text>
            <line
              x1="298"
              y1="181"
              x2="566"
              y2={satelliteY}
              stroke={rayColor}
              strokeWidth="3"
              strokeDasharray={pathAvailable == null ? '9 8' : '0'}
              filter="url(#rayGlow)"
            />
            <circle cx="566" cy={satelliteY} r="11" fill={rayColor} />
            <rect x="551" y={satelliteY - 4} width="30" height="8" fill="none" stroke={rayColor} />
            <text x="590" y={satelliteY + 5} fill={rayColor} fontSize="13">SATELLITE</text>
            <text x="24" y="30" fill="#7da895" fontSize="12">ECEF SPHERICAL GEOMETRY // SCHEMATIC VIEW</text>
            <text x="24" y="322" fill="#7da895" fontSize="12">
              PATH {pathAvailable == null ? 'NOT TRACED' : pathAvailable ? 'AVAILABLE' : 'BLOCKED'}
              {elevation == null ? '' : ` // ELEVATION ${Number(elevation).toFixed(2)}°`}
            </text>
          </svg>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">
          <span>LINK SOLVER OUTPUT</span>
          <span className="small muted">SCHEMA {payload?.schema_version || '1.0'}</span>
        </h2>
        <div className="telemetry-grid ray-results">
          <Metric
            label="SLANT RANGE"
            value={geometry?.slant_range_m == null ? null : (geometry.slant_range_m / 1000).toFixed(2)}
            unit="km"
            status={pathAvailable == null ? 'Run trace to calculate' : 'ECEF geometry'}
          />
          <Metric
            label="ELEVATION"
            value={elevation == null ? null : Number(elevation).toFixed(2)}
            unit="°"
            status={pathAvailable === false ? 'Below station mask' : 'Station look angle'}
          />
          <Metric
            label="FREE-SPACE LOSS"
            value={fspl == null ? null : fspl.toFixed(2)}
            unit="dB"
            status={result?.losses_db?.free_space?.status}
          />
          <Metric
            label="RECEIVED POWER"
            value={receivedPower == null ? null : receivedPower.toFixed(2)}
            unit="dBm"
            status={budget?.received_power_dbm?.status}
          />
          <Metric
            label="LINK MARGIN"
            value={margin == null ? null : margin.toFixed(2)}
            unit="dB"
            status={budget?.meets_required_margin == null ? 'Not computable' : budget.meets_required_margin ? 'PASS ≥ 3 dB' : 'FAIL < 3 dB'}
          />
          <Metric
            label="PATH STATUS"
            value={pathAvailable == null ? null : pathAvailable ? 'OPEN' : 'BLOCKED'}
            status={result?.path_basis || 'Awaiting solver'}
          />
        </div>

        <div className="kpi-box ray-ledger">
          <div className="kpi-label">LOSS LEDGER</div>
          {result?.losses_db ? (
            Object.entries(result.losses_db).map(([name, effect]) => (
              <div className="row-between small" key={name}>
                <span>{name.replaceAll('_', ' ').toUpperCase()}</span>
                <span className={effect.status === 'not_computable' ? 'muted' : ''}>
                  {effect.value == null ? 'N/C' : `${Number(effect.value).toFixed(3)} ${effect.unit}`} • {effect.status}
                </span>
              </div>
            ))
          ) : (
            <div className="small muted">Press TRACE SIGNAL to run the integrated Python solver.</div>
          )}
        </div>

        <div className="small muted" style={{ marginTop: 10 }}>
          This is radio-propagation ray tracing, not photorealistic rendering. Vacuum mode provides a deterministic
          gameplay baseline; atmospheric and ionospheric providers remain available through the same engine API.
        </div>
      </section>
    </div>
  );
}
