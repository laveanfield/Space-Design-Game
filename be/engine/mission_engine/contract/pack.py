"""Nen mang so thanh chuoi 'f32:BASE64' / 'u8:BASE64' de FlightBundle nho gon (theo docs/architecture.md muc 10.3)."""
import base64
import numpy as np


def encode_f32(seq):
    return "f32:" + base64.b64encode(np.asarray(seq, dtype="<f4").tobytes()).decode()


def encode_u8(seq):
    return "u8:" + base64.b64encode(np.asarray(seq, dtype="u1").tobytes()).decode()


def decode(s):
    kind, _, b = s.partition(":")
    return np.frombuffer(base64.b64decode(b), dtype="<f4" if kind == "f32" else "u1")
