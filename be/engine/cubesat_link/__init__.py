"""Independent ground-to-CubeSat physics. No GUI dependencies."""
from .types import Earth, WGS84, SPHERE, GroundStation, SatelliteState, Effect
from .geometry import geometry, station_ecef, contact_windows, Geometry, ContactWindow
from .neutral import NeutralProfile, NeutralRay, trace_spherical, p834_reference_profile
from .budget import fspl_db, Radio, Budget, compute_budget
from .ionosphere import (SlantTEC, ElectronPath, integrate_electrons, ionospheric_effects,
                         Polarization, polarization_loss)
from .api import LinkResult, evaluate_link
from .providers import (ProviderMetadata, ProviderResult, NeutralProvider, ElectronProvider,
                        NeutralTableProvider, P834ReferenceProvider, P676GasProvider,
                        PathBinding, BoundElectronProvider)

__version__ = '0.2.0'

from .interface import run_request, load_request, InputError
