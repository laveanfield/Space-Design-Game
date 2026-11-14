"""K-ATT: tu the 3-DOF. Quaternion [w,x,y,z] + phuong trinh Euler, tich phan RK4; xung RCS lam doi toc do goc."""
import math
import numpy as np

MANIFEST = {
    "id": "K-ATT",
    "equations": ["q_dot = 0.5*q (x) [0,w]", "I*w_dot = tau - w x (I*w)", "dw = tau*t_pulse/I"],
    "assumptions": ["vat ran, tensor quan tinh cheo (I la vector 3 so)", "hop tac dong tuc thoi (khong mo hinh dong co cap hanh)"],
    "valid_range": "tu the ve tinh nho; dt <= 0.5 s",
    "refs": ["Cornelisse; Wertz (Spacecraft Attitude Determination and Control)"],
    "tests": ["quat_norm", "angular_momentum", "kinetic_energy", "rcs_pulse"],
}


def qmul(a, b):
    w1, x1, y1, z1 = a
    w2, x2, y2, z2 = b
    return np.array([w1*w2 - x1*x2 - y1*y2 - z1*z2, w1*x2 + x1*w2 + y1*z2 - z1*y2,
                     w1*y2 - x1*z2 + y1*w2 + z1*x2, w1*z2 + x1*y2 - y1*x2 + z1*w2])


def qnorm(q):
    return q / np.linalg.norm(q)


def rotate(q, v):
    """Quay vector v (he than -> he quan tinh) bang quaternion q."""
    qv = np.array([0.0, *v])
    qc = np.array([q[0], -q[1], -q[2], -q[3]])
    return qmul(qmul(q, qv), qc)[1:]


def deriv(q, w, I, tau):
    return 0.5 * qmul(q, np.array([0.0, *w])), (tau - np.cross(w, I * w)) / I


def step_rk4(q, w, I, tau, dt):
    k1q, k1w = deriv(q, w, I, tau)
    k2q, k2w = deriv(q + 0.5*dt*k1q, w + 0.5*dt*k1w, I, tau)
    k3q, k3w = deriv(q + 0.5*dt*k2q, w + 0.5*dt*k2w, I, tau)
    k4q, k4w = deriv(q + dt*k3q, w + dt*k3w, I, tau)
    return qnorm(q + dt/6*(k1q + 2*k2q + 2*k3q + k4q)), w + dt/6*(k1w + 2*k2w + 2*k3w + k4w)


def rcs_pulse(w, axis, sign, torque_nm, t_pulse_s, I):
    """Mot xung RCS: dw = tau*t/I tren truc 'axis' (0,1,2). Tha nut van tiep tuc quay."""
    w = w.copy()
    w[axis] += sign * torque_nm * t_pulse_s / I[axis]
    return w


def angle_deg(u, v):
    c = float(u @ v) / (np.linalg.norm(u) * np.linalg.norm(v))
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))


def axis_to(q, axis_body, target_dir):
    """Quay ngan nhat de truc than 'axis_body' huong vao 'target_dir' (tuc thoi). Dung cho che do NADIR/TRACK don gian."""
    a = rotate(q, axis_body)
    a = a / np.linalg.norm(a)
    b = target_dir / np.linalg.norm(target_dir)
    ax = np.cross(a, b)
    s = float(np.linalg.norm(ax))
    if s < 1e-12:
        return q if float(a @ b) > 0 else qmul(np.array([0.0, 1.0, 0.0, 0.0]), q)
    half = 0.5 * math.atan2(s, float(a @ b))
    dq = np.array([math.cos(half), *(math.sin(half) * ax / s)])
    return qnorm(qmul(dq, q))
