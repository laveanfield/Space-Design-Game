"""Versioned data boundary. Providers contain no radio budget or application policy."""
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Protocol

from .types import Earth, GroundStation, SatelliteState, finite
from .neutral import NeutralProfile, p834_reference_profile
from .ionosphere import ElectronPath, SlantTEC, integrate_electrons


@dataclass(frozen=True)
class ProviderMetadata:
    source: str
    version: str
    epoch_utc: datetime
    applicability: str
    units: dict[str, str]
    temporal_kind: str  # observation, reference, synthetic

    def __post_init__(self):
        if not all(isinstance(x,str) and x.strip() for x in
                   (self.source,self.version,self.applicability)):
            raise ValueError('Provider source, version and applicability are required')
        if not isinstance(self.epoch_utc,datetime) or self.epoch_utc.utcoffset()!=timedelta(0):
            raise ValueError('Provider epoch_utc must be aware UTC')
        if self.temporal_kind not in ('observation','reference','synthetic'):
            raise ValueError('Invalid temporal_kind')
        if not self.units or any(not isinstance(k,str) or not isinstance(v,str) or not k or not v
                                 for k,v in self.units.items()):
            raise ValueError('Explicit provider units are required')
        object.__setattr__(self,'units',dict(self.units))

    def to_dict(self):
        result = asdict(self)
        result['epoch_utc'] = self.epoch_utc.isoformat().replace('+00:00','Z')
        return result

    def time_matches(self, state):
        return self.temporal_kind != 'observation' or self.epoch_utc == state.epoch_utc


@dataclass(frozen=True)
class ProviderResult:
    data: object | None
    status: str
    reason: str
    metadata: ProviderMetadata

    def provenance(self):
        return dict(self.metadata.to_dict(),status=self.status,reason=self.reason)


class NeutralProvider(Protocol):
    def get(self, station: GroundStation, state: SatelliteState,
            frequency_hz: float, earth: Earth) -> ProviderResult: ...


@dataclass(frozen=True)
class NeutralTableProvider:
    profile: NeutralProfile
    metadata: ProviderMetadata

    def __post_init__(self):
        expected = {'height_m':'m','refractive_index':'1'}
        if self.profile.gamma_db_per_km is not None:
            expected['gamma_db_per_km'] = 'dB/km'
        if any(self.metadata.units.get(k)!=v for k,v in expected.items()):
            raise ValueError('Neutral provider units must match SI field definitions')

    def get(self, station, state, frequency_hz, earth):
        if not self.metadata.time_matches(state):
            return ProviderResult(None,'not_computable','Observation epoch differs from link epoch',self.metadata)
        if not self.profile.frequency_range_hz[0] <= frequency_hz <= self.profile.frequency_range_hz[1]:
            return ProviderResult(None,'not_computable','Frequency outside neutral data validity; no clamp',self.metadata)
        if station.altitude_m < self.profile.height_m[0]:
            return ProviderResult(None,'not_computable','Neutral data do not cover station altitude',self.metadata)
        return ProviderResult(self.profile,'computed','Supplied homogeneous spherical profile; declared top boundary',self.metadata)


class P834ReferenceProvider:
    def get(self, station, state, frequency_hz, earth):
        metadata = ProviderMetadata(
            'https://www.itu.int/rec/R-REC-P.834-9-201712-I/en','P.834-9 (2017), Eq (8)',
            datetime(2017,12,1,tzinfo=timezone.utc),
            'Reference exponential, horizontally homogeneous; 0-100 km, vacuum above; '
            '0.1-12 GHz package scope; not local weather. N(top) about 0.000387 discarded.',
            {'height_m':'m','refractive_index':'1'},'reference')
        return NeutralTableProvider(p834_reference_profile(),metadata).get(station,state,frequency_hz,earth)


class P676GasProvider:
    """Explicit unavailable implementation, NOT a P.676 attenuation calculator."""
    def get(self, frequency_hz):
        finite(frequency_hz)
        if frequency_hz <= 0:
            raise ValueError('frequency_hz must be positive')
        metadata = ProviderMetadata(
            'https://www.itu.int/rec/R-REC-P.676-13-202208-I/en','P.676-13 (2022), Annex 1',
            datetime(2022,8,1,tzinfo=timezone.utc),
            'Target method 1-1000 GHz; unavailable in this release',
            {'frequency_hz':'Hz','specific_attenuation':'dB/km'},'reference')
        reason = ('Outside P.676-13 Annex 1 scope 1-1000 GHz; no frequency clamp'
                  if not 1e9 <= frequency_hz <= 1e12 else
                  'Missing verified oxygen/water spectral-line catalogue, line-shape and continuum '
                  'implementation, pressure/temperature/water-vapour profiles, and independent reference cases')
        return ProviderResult(None,'not_computable',reason,metadata)


@dataclass(frozen=True)
class PathBinding:
    station: GroundStation
    state: SatelliteState
    earth: Earth
    path_kind: str
    path_length_m: float

    def __post_init__(self):
        finite(self.path_length_m)
        if self.path_length_m<=0 or self.state.epoch_utc is None:
            raise ValueError('Path binding needs positive length and UTC epoch')
        if self.path_kind not in ('straight','spherical_refracted'):
            raise ValueError('Invalid path_kind')


class ElectronProvider(Protocol):
    metadata: ProviderMetadata
    def get(self, binding: PathBinding) -> ProviderResult: ...


@dataclass(frozen=True)
class BoundElectronProvider:
    """Table/finite STEC bound to endpoints, Earth, epoch and propagation branch.

    A provider assertion, not evidence that samples were measured at these points.
    Caller must sample Ne and B along the actual ray; no VTEC mapping is inferred.
    """
    data: ElectronPath | SlantTEC
    metadata: ProviderMetadata
    binding: PathBinding

    def __post_init__(self):
        expected = ({'distance_m':'m','density_per_m3':'el/m3'} if isinstance(self.data,ElectronPath)
                    else {'path_length_m':'m','electrons_per_m2':'el/m2'})
        if isinstance(self.data,ElectronPath) and self.data.b_parallel_t is not None:
            expected['b_parallel_t'] = 'T'
        if isinstance(self.data,SlantTEC) and self.data.ne_b_integral is not None:
            expected['ne_b_integral'] = 'T el/m2'
        if any(self.metadata.units.get(k)!=v for k,v in expected.items()):
            raise ValueError('Electron/magnetic provider units must match SI definitions')

    def get(self, binding):
        b = self.binding
        if (b.station!=binding.station or b.state!=binding.state or b.earth!=binding.earth or
                b.path_kind!=binding.path_kind or
                abs(b.path_length_m-binding.path_length_m)>max(1e-3,binding.path_length_m*1e-9)):
            return ProviderResult(None,'not_computable','Electron data binding differs from this path/epoch/Earth',self.metadata)
        if not self.metadata.time_matches(binding.state):
            return ProviderResult(None,'not_computable','Electron observation epoch differs from link epoch',self.metadata)
        if isinstance(self.data,ElectronPath):
            if self.data.distance_m[-1] < binding.path_length_m:
                return ProviderResult(None,'not_computable','Electron profile does not reach endpoint; no zero fill',self.metadata)
            data = integrate_electrons(self.data,binding.path_length_m)
        else:
            data = self.data
            if abs(data.path_length_m-binding.path_length_m)>max(1e-3,binding.path_length_m*1e-9):
                return ProviderResult(None,'not_computable','STEC length differs from endpoint',self.metadata)
        return ProviderResult(data,'computed','Finite integral on caller-declared bound path',self.metadata)
