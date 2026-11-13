"""Dang ky mode. Mode chua cai dat (spectral_scan, radar_swath, stare...) -> engine roi ve imaging va ghi canh bao."""
from .imaging import Imaging
from .downlink import Downlink
from .space_weather import SpaceWeather

REGISTRY = {"imaging": Imaging, "downlink": Downlink, "space_weather": SpaceWeather}


def create(mode_id):
    return REGISTRY[mode_id]() if mode_id in REGISTRY else REGISTRY["imaging"]()
