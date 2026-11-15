"""P.525 free-space spreading and a component ledger. No throughput inference."""
from dataclasses import dataclass, field
from math import log10, pi
from .types import C, Effect, finite, known, unknown


def fspl_db(distance_m: float, frequency_hz: float) -> float:
    """ITU-R P.525-5 Eq (5): 20 log10(4*pi*d*f/c), d in m, f in Hz.

    Requires free-space far field. Caller must check antenna far-field limits.
    No gas, refraction, polarization, cable or antenna gain included.
    """
    finite(distance_m, frequency_hz)
    if distance_m <= 0 or frequency_hz <= 0:
        raise ValueError("Distance and frequency must be positive")
    return 20 * (log10(4*pi/C) + log10(distance_m) + log10(frequency_hz))


@dataclass(frozen=True)
class Radio:
    tx_power_dbm: float
    tx_gain_dbi: float  # boresight; pointing losses supplied separately
    rx_gain_dbi: float
    tx_pointing_loss_db: float
    rx_pointing_loss_db: float
    cable_loss_db: float  # sum of TX/RX feeder loss
    receiver_threshold_dbm: float
    receiver_mode: str  # datasheet/test identity including packet rate, coding etc.
    antenna_basis: str  # description of attitude/tracking/pattern used for losses
    required_margin_db: float = 0.0

    def __post_init__(self):
        finite(self.tx_power_dbm, self.tx_gain_dbi, self.rx_gain_dbi,
               self.tx_pointing_loss_db, self.rx_pointing_loss_db, self.cable_loss_db,
               self.receiver_threshold_dbm, self.required_margin_db)
        if min(self.tx_pointing_loss_db,self.rx_pointing_loss_db,self.cable_loss_db,self.required_margin_db)<0:
            raise ValueError("Hardware losses and required margin must be nonnegative")
        if not self.receiver_mode.strip() or not self.antenna_basis.strip():
            raise ValueError("Receiver operating mode and pointing/pattern basis are required")


LOSS_NAMES = frozenset(("free_space", "gas", "rain", "cloud", "neutral_scintillation",
                        "ionospheric_scintillation", "ionospheric_absorption",
                        "beam_spreading", "polarization"))


@dataclass(frozen=True)
class Budget:
    received_power_dbm: Effect
    margin_db: Effect
    meets_required_margin: bool | None
    hardware_db: dict[str, float]
    throughput_bps: Effect
    radio_assumptions: dict[str, str] = field(default_factory=dict)


def compute_budget(losses: dict[str, Effect], radio: Radio | None, *, path_available: bool | None):
    """A complete *conditional* budget for the supplied component assumptions.

    Rejects composite/unknown keys to prevent gas/rain duplication. Statistical
    exceedance losses at equal percentiles must NOT be summed as instantaneous
    losses; use a separate validated P.618 combination outside this API.
    """
    if set(losses) != LOSS_NAMES:
        raise ValueError("Budget requires exactly the named non-overlapping propagation components")
    for name, effect in losses.items():
        if effect.unit != "dB":
            raise ValueError("All power-loss components must have unit dB")
        if effect.value is not None and effect.value < 0 and name != "beam_spreading":
            raise ValueError("Attenuation must be nonnegative (beam focusing may be signed)")
    hardware = {} if radio is None else {
        "tx_power_dbm": radio.tx_power_dbm, "tx_gain_dbi": radio.tx_gain_dbi,
        "rx_gain_dbi": radio.rx_gain_dbi, "tx_pointing_loss_db": radio.tx_pointing_loss_db,
        "rx_pointing_loss_db": radio.rx_pointing_loss_db, "cable_loss_db": radio.cable_loss_db,
        "receiver_threshold_dbm": radio.receiver_threshold_dbm,
        "required_margin_db": radio.required_margin_db}
    throughput = unknown("bit/s", "No validated modulation/coding/BER and noise/bandwidth/rate model; sensitivity is not throughput")
    assumptions = {} if radio is None else {'receiver_mode':radio.receiver_mode,'antenna_basis':radio.antenna_basis}
    missing = [name for name,e in losses.items() if e.value is None]
    if path_available is not True or radio is None or missing:
        reason = ("No usable path (or refraction unknown)" if path_available is not True else
                  "Missing transmitter/antenna/receiver-mode inputs" if radio is None else
                  "Unknown propagation components: " + ", ".join(sorted(missing)))
        return Budget(unknown("dBm",reason), unknown("dB",reason), None, hardware, throughput, assumptions)
    received = (radio.tx_power_dbm + radio.tx_gain_dbi + radio.rx_gain_dbi
                - radio.tx_pointing_loss_db - radio.rx_pointing_loss_db - radio.cable_loss_db
                - sum(e.value for e in losses.values()))
    margin = received-radio.receiver_threshold_dbm
    return Budget(known(received,"dBm","Sum of named components, conditional on supplied assumptions"),
                  known(margin,"dB","P_rx minus threshold for "+radio.receiver_mode),
                  margin >= radio.required_margin_db, hardware, throughput, assumptions)
