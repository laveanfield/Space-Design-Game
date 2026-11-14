"""Reusable propagation orchestration; no application or gameplay policy."""
from dataclasses import asdict, dataclass, field
from .types import C, Effect, WGS84, known, unknown
from .geometry import Geometry, geometry
from .neutral import NeutralRay, trace_spherical
from .ionosphere import ElectronPath, integrate_electrons, ionospheric_effects, polarization_loss
from .budget import Budget, LOSS_NAMES, fspl_db, compute_budget
from .providers import PathBinding, P676GasProvider


@dataclass(frozen=True)
class LinkResult:
    geometry: Geometry
    neutral_ray: NeutralRay | None
    refracted_visible: bool | None
    path_available: bool | None
    path_basis: str
    losses_db: dict[str, Effect]
    ionosphere: dict[str, Effect]
    neutral_excess_delay_s: Effect
    budget: Budget
    providers: dict = field(default_factory=dict)

    def to_dict(self):
        """JSON-safe: all absent results are null, not NaN or invented zeros."""
        return asdict(self)


def evaluate_link(station, state, frequency_hz, *, earth=WGS84, radio=None,
                  neutral_profile=None, electrons=None, polarization=None,
                  supplied_losses=None, vacuum=False, neutral_provider=None,
                  electron_provider=None):
    """Evaluate one ground–satellite link, with explicit missing-data status.

    frequency_hz: Hz; all positions/heights/path lengths: metres.
    electrons: ElectronPath or finite-endpoint SlantTEC for THIS propagation path.
    supplied_losses: dict of non-overlapping named Effect(dB) values; only unknown
        terms may be filled, never replaced. Instantaneous losses/explicit design
        assumptions only; no statistical P.618 composite/exceedance values.
    vacuum=True: explicit idealized scenario excluding all medium effects. It
        still requires antenna polarization and hardware to compute a budget.
    Without neutral_profile the path is the straight geometric approximation;
    refracted visibility remains unknown unless vacuum=True.
    """
    if vacuum and any(x is not None for x in (neutral_profile,electrons,neutral_provider,electron_provider)):
        raise ValueError("Vacuum cannot be combined with atmosphere/electron profiles")
    if neutral_provider is not None and neutral_profile is not None:
        raise ValueError('Supply either neutral_provider or neutral_profile, not both')
    if electron_provider is not None and electrons is not None:
        raise ValueError('Supply either electron_provider or electrons, not both')
    provenance = {}
    neutral_failure = None
    if neutral_provider is not None:
        provided = neutral_provider.get(station,state,frequency_hz,earth)
        provenance['neutral'] = provided.provenance()
        neutral_profile = provided.data
        if provided.status == 'not_computable':
            neutral_failure = provided.reason
    g=geometry(station,state,earth)
    losses={name:unknown("dB", "No validated inputs/model for "+name) for name in sorted(LOSS_NAMES)}
    losses['free_space']=known(fspl_db(g.slant_range_m,frequency_hz),"dB",
                               "P.525-5 Eq (5), geometric endpoint range; beam spreading separate")
    path_available=g.geometric_visible
    path_basis="Straight geometric path approximation; no refracted horizon inferred"
    refracted=None
    ray=None
    path_length=g.slant_range_m
    delay=unknown("s","No neutral refractivity profile")
    if neutral_failure:
        path_available = None
        path_basis = neutral_failure
        delay = unknown('s',neutral_failure)
    if neutral_profile is not None:
        ray=trace_spherical(station,state,frequency_hz,neutral_profile,earth)
        if ray.status == 'computed':
            refracted=ray.ground_clear and ray.apparent_elevation_deg >= station.min_elevation_deg-1e-10
            path_available=refracted
            path_length=ray.path_length_m
            delay=known(ray.total_excess_m/C,"s",
                        "[L_ray - L_chord + integral (n-1) ds] / c; relative to straight vacuum path")
            losses['gas']=ray.gas_loss
            path_basis="Spherical outward refracted ray; mask uses apparent elevation; geometric visibility reported separately"
        else:
            path_available=None
            path_basis=ray.reason
    electron_failure = None
    if electron_provider is not None:
        if state.epoch_utc is None or path_available is not True:
            electron_failure = 'Resolved available path and UTC epoch required for electron provider'
            provenance['electrons'] = dict(electron_provider.metadata.to_dict(),
                                          status='not_computable',reason=electron_failure)
        else:
            binding = PathBinding(station,state,earth,
                                  'spherical_refracted' if ray is not None else 'straight',path_length)
            provided = electron_provider.get(binding)
            provenance['electrons'] = provided.provenance()
            electrons = provided.data
            if provided.status == 'not_computable':
                electron_failure = provided.reason
    if isinstance(electrons,ElectronPath):
        if path_available is not True:
            electron_failure = 'Cannot integrate electrons without a resolved available path'
            electrons = None
        elif electrons.distance_m[-1] < path_length:
            electron_failure = 'Electron profile does not reach endpoint; no zero fill'
            electrons = None
        else:
            electrons=integrate_electrons(electrons,path_length)
    if electrons is not None and abs(electrons.path_length_m-path_length)>max(1e-3,path_length*1e-9):
        raise ValueError("STEC endpoint length does not match this satellite propagation path")
    iono=ionospheric_effects(frequency_hz,electrons)
    if electron_failure:
        iono={k:unknown(v.unit,electron_failure) for k,v in iono.items()}
    if path_available is not True:
        # No direct path: do not attach ray-integrated plasma effects to a chord through Earth.
        iono={k:unknown(v.unit,"No usable direct path for ionospheric integration") for k,v in iono.items()}
    if vacuum:
        path_basis="Explicit ideal vacuum; geometric path and geometric horizon"
        refracted=g.geometric_visible
        for name in LOSS_NAMES-{'free_space','polarization'}:
            losses[name]=Effect(0,"dB","assumed","Explicit ideal vacuum scenario")
        iono={k:Effect(0,v.unit,"assumed","Explicit ideal vacuum scenario") for k,v in iono.items()}
        delay=Effect(0,"s","assumed","Explicit ideal vacuum scenario")
    else:
        if losses['gas'].value is None:
            gas_provider = P676GasProvider().get(frequency_hz)
            provenance['gas_method'] = gas_provider.provenance()
            if neutral_profile is None or neutral_profile.gamma_db_per_km is None:
                losses['gas'] = unknown('dB',gas_provider.reason)
        losses['ionospheric_scintillation']=iono['scintillation']
        losses['ionospheric_absorption']=iono['absorption']
    losses['polarization']=polarization_loss(polarization,iono['faraday_rotation'])
    for name,effect in (supplied_losses or {}).items():
        if name not in LOSS_NAMES or name=='free_space':
            raise ValueError("Unknown/composite/reserved loss component: "+name)
        if losses[name].value is not None:
            raise ValueError("Duplicate loss component already computed/assumed: "+name)
        losses[name]=effect
    return LinkResult(g,ray,refracted,path_available,path_basis,losses,iono,delay,
                      compute_budget(losses,radio,path_available=path_available),provenance)
