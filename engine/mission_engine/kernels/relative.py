"""K-REL: chuyen dong tuong doi sau khi tach (Clohessy-Wiltshire, nghiem giai tich). x huong tam, y doc quy dao, z ngang."""
import math

MANIFEST = {
    "id": "K-REL",
    "equations": ["x(t) = (4-3cos(nt))x0 + sin(nt)/n*vx0 + 2(1-cos(nt))/n*vy0",
                  "y(t) = 6(sin(nt)-nt)x0 + y0 - 2(1-cos(nt))/n*vx0 + (4sin(nt)-3nt)/n*vy0",
                  "z(t) = z0*cos(nt) + vz0/n*sin(nt)"],
    "assumptions": ["quy dao chu tron, khoang cach nho so voi ban kinh quy dao (tuyen tinh hoa)", "khong J2, khong drag"],
    "valid_range": "vai quy dao",
    "refs": ["Clohessy & Wiltshire (1960); Vallado"],
    "tests": ["cw_vs_two_body"],
}


def cw_state(s0, n, t):
    """s0 = [x,y,z,vx,vy,vz] (m, m/s) -> trang thai o thoi diem t; n = toc do goc quy dao (rad/s)."""
    x0, y0, z0, vx0, vy0, vz0 = s0
    c, s = math.cos(n * t), math.sin(n * t)
    x = (4 - 3*c)*x0 + s/n*vx0 + 2*(1 - c)/n*vy0
    y = 6*(s - n*t)*x0 + y0 - 2*(1 - c)/n*vx0 + (4*s - 3*n*t)/n*vy0
    z = z0*c + vz0/n*s
    vx = 3*n*s*x0 + c*vx0 + 2*s*vy0
    vy = -6*n*(1 - c)*x0 - 2*s*vx0 + (4*c - 3)*vy0
    vz = -n*z0*s + vz0*c
    return [x, y, z, vx, vy, vz]
