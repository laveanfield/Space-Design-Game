"""First-order cold-plasma effects. No density climatology or scintillation forecast."""
from dataclasses import dataclass
from math import cos, log10, pi, sqrt
from .types import C, Effect, finite, known, unknown


@dataclass(frozen=True)
class SlantTEC:
    electrons_per_m2: float  # STEC, not vertical TEC; 1 TECU = 1e16 el/m2
    path_length_m: float  # finite path ending at this satellite, not to infinity
    source: str
    ne_b_integral: float | None = None  # integral Ne * B_parallel ds [T el/m2]

    def __post_init__(self):
        finite(self.electrons_per_m2,self.path_length_m)
        if self.electrons_per_m2 < 0 or self.path_length_m <= 0 or not self.source:
            raise ValueError("TEC>=0, finite positive path length, and source required")
        if self.ne_b_integral is not None:
            finite(self.ne_b_integral)
            if self.electrons_per_m2 == 0 and self.ne_b_integral != 0:
                raise ValueError("Zero electron content requires zero magnetic integral")


@dataclass(frozen=True)
class ElectronPath:
    distance_m: tuple[float, ...]  # arc length along supplied ray from station
    density_per_m3: tuple[float, ...]
    source: str  # include model, epoch, coordinates, indices, coverage
    b_parallel_t: tuple[float, ...] | None = None

    def __post_init__(self):
        s,n=tuple(self.distance_m),tuple(self.density_per_m3)
        object.__setattr__(self,"distance_m",s)
        object.__setattr__(self,"density_per_m3",n)
        finite(*s,*n)
        if len(s)<2 or len(s)!=len(n) or s[0]!=0 or any(b<=a for a,b in zip(s,s[1:])):
            raise ValueError("Electron path must start at station, with increasing arc length")
        if min(n)<0 or not self.source:
            raise ValueError("Nonnegative densities and source required")
        if self.b_parallel_t is not None:
            b=tuple(self.b_parallel_t)
            object.__setattr__(self,"b_parallel_t",b)
            finite(*b)
            if len(b)!=len(s):
                raise ValueError("Magnetic-field samples must match path")


def integrate_electrons(profile: ElectronPath, satellite_path_length_m: float) -> SlantTEC:
    """Piecewise-linear Ne and B; exact integrals, clipped at satellite endpoint.

    No extrapolation/zero-fill below or above coverage. Sample all relevant layers
    on the actual path; a vertical IRI column is not automatically a slant path.
    """
    finite(satellite_path_length_m)
    if not 0 < satellite_path_length_m <= profile.distance_m[-1]:
        raise ValueError("Electron profile must cover the complete finite satellite path")
    tec, weighted=0.0,0.0
    for i,(a,b) in enumerate(zip(profile.distance_m,profile.distance_m[1:])):
        if a >= satellite_path_length_m:
            break
        length=min(b,satellite_path_length_m)-a
        n=profile.density_per_m3[i]
        dn=(profile.density_per_m3[i+1]-n)/(b-a)
        tec += n*length+dn*length**2/2
        if profile.b_parallel_t is not None:
            field=profile.b_parallel_t[i]
            db=(profile.b_parallel_t[i+1]-field)/(b-a)
            weighted += n*field*length+(n*db+dn*field)*length**2/2+dn*db*length**3/3
    return SlantTEC(tec,satellite_path_length_m,profile.source,
                    weighted if profile.b_parallel_t is not None else None)


def ionospheric_effects(frequency_hz: float, tec: SlantTEC | None):
    """0.1–12 GHz package scope, f well above plasma/gyro frequencies required.

    phase_path_m is negative; phase_advance_rad is positive magnitude for
    exp(i*(omega*t-k*s)). Neither quantity is power attenuation.
    Faraday sign uses B_parallel along the caller's propagation direction.
    """
    finite(frequency_hz)
    if frequency_hz <= 0:
        raise ValueError("frequency_hz must be positive")
    units={"slant_tec":"el/m2","group_delay":"s","phase_path":"m",
           "phase_advance":"rad","faraday_rotation":"rad",
           "scintillation":"dB","absorption":"dB","ray_deflection":"rad"}
    result={k:unknown(unit,"No validated model/inputs for this effect") for k,unit in units.items()}
    if tec is None:
        return result
    result['slant_tec']=known(tec.electrons_per_m2,"el/m2",tec.source)
    if not 1e8 <= frequency_hz <= 12e9:
        for k in ('group_delay','phase_path','phase_advance','faraday_rotation'):
            result[k]=unknown(units[k],"Outside package first-order ionospheric scope 0.1–12 GHz")
        return result
    delay_range=40.3*tec.electrons_per_m2/frequency_hz**2
    result['group_delay']=known(delay_range/C,"s","First-order plasma 40.3 TEC/(c f^2); high-frequency assumption")
    result['phase_path']=known(-delay_range,"m","First-order phase path advance, not absorption")
    result['phase_advance']=known(2*pi*delay_range*frequency_hz/C,"rad","Phase advance magnitude; not power loss")
    if tec.ne_b_integral is not None:
        result['faraday_rotation']=known(2.36e4*tec.ne_b_integral/frequency_hz**2,"rad",
                                         "P.531-15 Eq (2), Hz form; signed integral Ne B_parallel ds")
    else:
        result['faraday_rotation']=unknown("rad","Missing integral Ne B_parallel ds; TEC alone is insufficient")
    return result


@dataclass(frozen=True)
class Polarization:
    tx: str  # linear or circular
    rx: str
    alignment_rad: float | None = None  # in common transverse propagation basis
    circular_match: bool | None = None  # same received Jones state, not raw RHCP labels

    def __post_init__(self):
        if self.tx not in ('linear','circular') or self.rx not in ('linear','circular'):
            raise ValueError("Only ideal linear/circular polarization supported")
        if self.alignment_rad is not None:
            finite(self.alignment_rad)


def polarization_loss(polarization: Polarization | None, faraday_rad: Effect):
    if polarization is None:
        return unknown("dB","Antenna polarization states missing")
    if polarization.tx != polarization.rx:
        return known(10*log10(2),"dB","Ideal linear/circular overlap; ignores ellipticity and depolarization")
    if polarization.tx == 'circular':
        if polarization.circular_match is True:
            return known(0,"dB","Matched ideal circular states; pure Faraday rotation causes no mismatch")
        return unknown("dB","Opposite/unspecified ideal circular states: zero/unknown coupling; finite axial ratios needed")
    if polarization.alignment_rad is None or faraday_rad.value is None:
        return unknown("dB","Linear polarization requires relative alignment and Faraday rotation")
    overlap=abs(cos(polarization.alignment_rad+faraday_rad.value))
    if overlap < 1e-15:
        return unknown("dB","Ideal polarization null (zero coupling); finite leakage/axial ratios not modeled")
    return known(-20*log10(overlap),"dB","Ideal linear Jones overlap including alignment plus Faraday exactly once")
