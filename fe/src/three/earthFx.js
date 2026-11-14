/**
 * earthFx -- Trai Dat nhin tu khong gian, dung chung cho canh phong (Launch3DCanvas) va qua cau quy dao (OrbitOps3DCanvas).
 *
 * Bo anh trong fe/public/earth/ (sinh boi be/tools/15-11-2026-render_earth.py):
 *   earth_day_8k.jpg (hoac 4k)  ban ngay, sac net, tuoi tan
 *   earth_aux.png               R = anh den thanh pho, G = mat nuoc, B = bang / tuyet
 *   earth_clouds.jpg            do day may
 *
 * Shader ve (cung mot cong thuc cho moi canh):
 *   - ngay / dem theo huong Mat Troi: vung giao thoi (terminator) mem, hoang hon cam do
 *   - ban dem: anh den thanh pho am (vang cam -> trang o loi), bi may che bot
 *   - may: lop rieng, bi "xoi mon" boi nhieu 3D de mep sac ca khi lai gan, kem bong may tren mat dat
 *   - dai duong: loa nang (specular), phan xa troi o goc xien; dat: chi tiet dia hinh nho (nhieu 3D, mo dan khi ra xa)
 *   - vien khi quyen: xanh phia ngay, cam o hoang hon, vach airglow xanh la manh phia dem
 * Tat ca chi tiet them vao la MINH HOA (sinh bang thuat toan), khong phai anh ve tinh that.
 */
import * as THREE from 'three';

const BASE = '/earth/';
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- nap texture (dung chung, chi tai mot lan)
const pending = {};
function loadTexture(url, { color = false } = {}) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      url,
      (t) => {
        t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.generateMipmaps = true;
        t.anisotropy = 8;
        resolve(t);
      },
      undefined,
      () => resolve(null)
    );
  });
}

/** Tai bo texture. may yeu (GPU khong co texture 8K, hoac it RAM) dung ban 4K. */
export function loadEarthTextures(maxTexture = 8192) {
  const lowMem = typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory < 4;
  const key = maxTexture >= 8192 && !lowMem ? '8k' : '4k';
  if (!pending[key]) {
    pending[key] = Promise.all([
      loadTexture(`${BASE}earth_day_${key}.jpg`, { color: true }),
      loadTexture(`${BASE}earth_aux.png`),
      loadTexture(`${BASE}earth_clouds.jpg`),
    ]).then(([day, aux, clouds]) => ({ day, aux, clouds }));
  }
  return pending[key];
}

const solid = (r, g, b, color) => {
  const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1, THREE.RGBAFormat);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
};

// ---------------------------------------------------------------- shader be mat
const SURFACE_VS = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldN;
varying vec3 vObj;
void main() {
  vUv = uv;
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SURFACE_FS = /* glsl */ `
precision highp float;
uniform sampler2D uDay;
uniform sampler2D uAux;
uniform sampler2D uClouds;
uniform vec3 uSun;        // huong TOI Mat Troi (he the gioi, da chuan hoa)
uniform vec3 uSunObj;     // cung huong, trong he cua qua cau (de tinh bong may)
uniform float uCloudShift;
uniform float uTime;
uniform float uNight;
uniform float uDetail;
uniform float uCloudAmt;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldN;
varying vec3 vObj;

const float PI = 3.14159265;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm3(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.07 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s / 0.875;
}

void main() {
  vec3 N = normalize(vWorldN);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSun);
  vec3 O = normalize(vObj);
  float ndl = dot(N, L);
  float ndv = max(dot(N, V), 0.0);
  float dpx = length(fwidth(O));                 // goc (rad) moi diem anh: de mo chi tiet khi nhin tu xa (tranh nhieu hat)

  vec3 day = texture2D(uDay, vUv).rgb;
  vec3 aux = texture2D(uAux, vUv).rgb;           // R den, G nuoc, B bang
  float lamps = aux.r;
  float ocean = aux.g;
  float ice = aux.b;

  // ---- chi tiet dia hinh bang nhieu 3D (dinh vao be mat hanh tinh)
  float f1 = 650.0, f2 = 2100.0, f3 = 6800.0;
  float a1 = 1.0 - smoothstep(0.18, 0.55, f1 * dpx);
  float a2 = 1.0 - smoothstep(0.18, 0.55, f2 * dpx);
  float a3 = 1.0 - smoothstep(0.18, 0.55, f3 * dpx);
  float dn = (vnoise(O * f1) - 0.5) * 0.30 * a1 + (vnoise(O * f2) - 0.5) * 0.24 * a2 + (vnoise(O * f3) - 0.5) * 0.18 * a3;
  float landK = (1.0 - ocean) * (1.0 - 0.7 * ice);
  vec3 albedo = day * (1.0 + uDetail * (landK * dn * 1.25 + ocean * dn * 0.22));

  // ---- may: texture + xoi mon 3D de mep sac. Vi tri may truot theo kinh do (uCloudShift)
  vec2 cuv = vec2(vUv.x + uCloudShift, vUv.y);
  float cb = texture2D(uClouds, cuv).r;
  float ph = cuv.x * 2.0 * PI;
  float th = (1.0 - cuv.y) * PI;
  vec3 cdir = vec3(-cos(ph) * sin(th), cos(th), sin(ph) * sin(th));
  float e1 = 1.0 - smoothstep(0.18, 0.5, 240.0 * dpx);
  float e2 = 1.0 - smoothstep(0.18, 0.5, 1000.0 * dpx);
  float er = fbm3(cdir * 240.0);
  float cd = cb + (er - 0.5) * 0.46 * e1 + (vnoise(cdir * 1000.0) - 0.5) * 0.20 * e2;
  float thick = smoothstep(0.45, 1.05, cd);                       // may mong -> day
  float cloud = smoothstep(0.38, 0.74, cd) * mix(0.60, 0.97, thick) * uCloudAmt;

  // ---- bong may tren mat dat (lech theo huong Mat Troi)
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), O));
  vec3 north = cross(O, east);
  float coslat = max(0.15, sqrt(max(0.0, 1.0 - O.y * O.y)));
  float sunE = dot(uSunObj, east);
  float sunN = dot(uSunObj, north);
  float lamK = 1.0 / max(0.22, ndl);
  vec2 soff = vec2(-sunE / (2.0 * PI * coslat), -sunN / PI) * 0.0034 * min(lamK, 3.0);
  float shadow = smoothstep(0.34, 0.66, texture2D(uClouds, cuv + soff).r) * uCloudAmt;

  // ---- anh sang: ngay (trang) -> hoang hon (cam do) -> dem
  float lam = max(ndl, 0.0);
  float dayK = smoothstep(-0.08, 0.22, ndl);
  vec3 sunCol = mix(vec3(1.0, 0.58, 0.30), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.26, ndl));
  float skyL = smoothstep(-0.12, 0.40, ndl);                      // anh sang khuech tan tu bau troi: ban ngay khong bao gio toi nau
  vec3 lit = albedo * (sunCol * 1.38 * pow(lam, 0.58) + vec3(0.085, 0.135, 0.235) * skyL + vec3(0.020, 0.030, 0.060));
  lit *= 1.0 - 0.42 * shadow * dayK * (1.0 - cloud);

  // dai duong: loa nang + phan xa troi
  vec3 Hh = normalize(L + V);
  float ndh = max(dot(N, Hh), 0.0);
  float glint = ocean * (1.0 - cloud) * lam * (pow(ndh, 420.0) * 3.2 + pow(ndh, 64.0) * 0.14);
  lit += glint * sunCol;
  lit += ocean * pow(1.0 - ndv, 4.0) * vec3(0.07, 0.17, 0.34) * dayK * 0.8;
  lit += ocean * vec3(0.020, 0.075, 0.190) * skyL;               // dai duong phan xa bau troi xanh

  // may: trang khi co nang (mong thi xam hon, day thi sang), xam xanh duoi anh trang khi toi (KHONG tinh mau hoang hon cho phia dem)
  vec3 cloudCol = sunCol * 1.22 * pow(lam, 0.70) * mix(0.68, 1.04, thick) + vec3(0.030, 0.040, 0.075) * mix(0.6, 1.0, thick);
  cloudCol *= mix(0.88, 1.08, er);                                // cau truc ben trong may day
  lit = mix(lit, cloudCol, cloud);

  // ---- ban dem: anh den thanh pho
  float nightK = 1.0 - smoothstep(-0.16, 0.05, ndl);
  float lamp = pow(lamps, 1.12);
  float dots = mix(1.0, 0.50 + 1.0 * vnoise(O * 14000.0), 1.0 - smoothstep(0.1, 0.45, 14000.0 * dpx));
  vec3 lampCol = mix(vec3(1.0, 0.50, 0.19), vec3(1.0, 0.88, 0.66), smoothstep(0.28, 0.95, lamp));
  float twk = 0.95 + 0.05 * sin(uTime * 1.7 + hash13(floor(O * 3000.0)) * 6.28);
  lit += lampCol * lamp * 2.7 * dots * twk * (1.0 - 0.75 * cloud) * nightK * uNight;

  // ---- khi quyen: lop suong xanh o goc xien, hoang hon cam o gan terminator
  float haze = pow(1.0 - ndv, 2.7);
  float tw = exp(-pow(ndl / 0.20, 2.0));
  vec3 sky = mix(vec3(0.018, 0.035, 0.085), vec3(0.34, 0.58, 1.0), dayK);
  sky = mix(sky, vec3(1.0, 0.50, 0.22), tw * 0.50);
  lit = mix(lit, sky * (0.40 + 1.05 * dayK + 0.35 * tw), clamp(haze * 0.50, 0.0, 0.85));

  gl_FragColor = vec4(lit, 1.0);
  #include <colorspace_fragment>
}`;

// ---------------------------------------------------------------- shader vien khi quyen (cau lon hon, ve mat trong, cong mau)
const ATMO_VS = /* glsl */ `
varying vec3 vWP;
varying vec3 vNW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vNW = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const ATMO_FS = /* glsl */ `
precision highp float;
uniform vec3 uSun;
uniform vec3 uCenter;
uniform float uK;
varying vec3 vWP;
varying vec3 vNW;
void main() {
  vec3 V = normalize(cameraPosition - vWP);
  float ndv = abs(dot(normalize(vNW), V));
  vec3 up = normalize(vWP - uCenter);
  float s = dot(up, normalize(uSun));
  float lit = smoothstep(-0.28, 0.45, s);
  float wide = pow(1.0 - ndv, 4.2);
  float thin = pow(1.0 - ndv, 15.0);
  vec3 col = vec3(0.30, 0.56, 1.0) * lit * (wide * 0.95 + thin * 1.7);
  float tw = exp(-pow(s / 0.20, 2.0));
  col += vec3(1.0, 0.42, 0.14) * tw * (wide * 0.60 + thin * 1.1);
  col += vec3(0.10, 0.90, 0.42) * (1.0 - lit) * thin * 0.55;     // airglow xanh la manh o phia dem
  gl_FragColor = vec4(col * uK, 1.0);
  #include <colorspace_fragment>
}`;

/**
 * Tao Trai Dat. Tra { mesh, update(opts), ready, dispose }.
 *  update({ sun: Vector3 huong toi Mat Troi (the gioi), time, cloudShift, night, atmosphere, detail })
 */
export function createEarth({ radius = 1, widthSegments = 128, heightSegments = 96, renderer = null, atmosphereScale = 1.012 } = {}) {
  const uniforms = {
    uDay: { value: solid(14, 50, 120, true) },
    uAux: { value: solid(0, 0, 0, false) },
    uClouds: { value: solid(0, 0, 0, false) },
    uSun: { value: new THREE.Vector3(1, 0.3, 0.4).normalize() },
    uSunObj: { value: new THREE.Vector3(1, 0.3, 0.4).normalize() },
    uCloudShift: { value: 0 },
    uTime: { value: 0 },
    uNight: { value: 1 },
    uDetail: { value: 1 },
    uCloudAmt: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: SURFACE_VS, fragmentShader: SURFACE_FS });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, widthSegments, heightSegments), material);

  const atmoUniforms = { uSun: { value: new THREE.Vector3(1, 0.3, 0.4).normalize() }, uCenter: { value: new THREE.Vector3() }, uK: { value: 1 } };
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: atmoUniforms,
    vertexShader: ATMO_VS,
    fragmentShader: ATMO_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * atmosphereScale, 96, 64), atmoMat);
  mesh.add(atmosphere);

  let disposed = false;
  const maxTex = renderer?.capabilities?.maxTextureSize ?? 4096;
  const ready = loadEarthTextures(maxTex).then((t) => {
    if (disposed) return t;
    if (t.day) uniforms.uDay.value = t.day;
    if (t.aux) uniforms.uAux.value = t.aux;
    if (t.clouds) uniforms.uClouds.value = t.clouds;
    return t;
  });

  const q = new THREE.Quaternion();
  const update = ({ sun, time, cloudShift, night, atmosphere: atmoK, detail, clouds } = {}) => {
    mesh.updateWorldMatrix(true, false);
    if (sun) {
      uniforms.uSun.value.copy(sun).normalize();
      atmoUniforms.uSun.value.copy(uniforms.uSun.value);
      mesh.getWorldQuaternion(q).invert();
      uniforms.uSunObj.value.copy(uniforms.uSun.value).applyQuaternion(q);
    }
    mesh.getWorldPosition(atmoUniforms.uCenter.value);
    if (time !== undefined) uniforms.uTime.value = time;
    if (cloudShift !== undefined) uniforms.uCloudShift.value = cloudShift;
    if (night !== undefined) uniforms.uNight.value = night;
    if (detail !== undefined) uniforms.uDetail.value = detail;
    if (clouds !== undefined) uniforms.uCloudAmt.value = clouds;
    if (atmoK !== undefined) atmoUniforms.uK.value = atmoK;
  };

  const dispose = () => {
    disposed = true;
    mesh.geometry.dispose();
    atmosphere.geometry.dispose();
    material.dispose();
    atmoMat.dispose();
    // texture dung chung (cache) nen KHONG giai phong o day
  };
  return { mesh, atmosphere, uniforms, update, ready, dispose };
}

// ---------------------------------------------------------------- duong bay tren mat dat: de Trai Dat quay dung duoi ve tinh
/**
 * Duong tron lon xuat phat tu bai phong (vi do, kinh do) theo huong cua quy dao (do nghieng i):
 * cos(i) = sin(phuong vi) * cos(vi do). He toa do Trai Dat = he cuc bo cua SphereGeometry:
 * (cos lat cos lon, sin lat, -cos lat sin lon).
 */
export function makeGroundTrack({ latDeg = 5.24, lonDeg = -52.77, incDeg = 51.6 } = {}) {
  const lat = latDeg * D2R;
  const lon = lonDeg * D2R;
  const p0 = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
  const east = new THREE.Vector3(-Math.sin(lon), 0, -Math.cos(lon));
  const north = new THREE.Vector3(-Math.sin(lat) * Math.cos(lon), Math.cos(lat), Math.sin(lat) * Math.sin(lon));
  const s = Math.max(-1, Math.min(1, Math.cos(incDeg * D2R) / Math.max(0.05, Math.cos(lat))));
  const az = incDeg <= 90 ? Math.asin(s) : Math.PI - Math.asin(s);
  const t0 = east.clone().multiplyScalar(Math.sin(az)).addScaledVector(north, Math.cos(az));

  const at = (theta) => {
    const c = Math.cos(theta);
    const sn = Math.sin(theta);
    const p = p0.clone().multiplyScalar(c).addScaledVector(t0, sn);
    const h = p0.clone().multiplyScalar(-sn).addScaledVector(t0, c);
    return { p, h, z: h.clone().cross(p) };
  };

  /** Quaternion cua mesh Trai Dat: diem duoi ve tinh -> +y, huong bay -> +x */
  const orientation = (theta, out = new THREE.Quaternion()) => {
    const { p, h, z } = at(theta);
    const m = new THREE.Matrix4().makeBasis(h, p, z).transpose();
    return out.setFromRotationMatrix(m);
  };

  /**
   * Huong Mat Troi trong he Trai Dat sao cho luc tach ve tinh (goc thetaDep) Mat Troi o thap `elevDeg` do tren duong chan troi
   * tai diem duoi ve tinh, nam sau va lech ve phia may anh. Luc phong (som hon) Mat Troi cao hon -> ban ngay.
   */
  const sunDirection = (thetaDep, elevDeg = 6, offsetDeg = 35) => {
    const { p, h, z } = at(thetaDep);
    const alpha = (90 - elevDeg) * D2R;
    const beta = offsetDeg * D2R;
    return p.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(h, -Math.sin(alpha) * Math.cos(beta)).addScaledVector(z, Math.sin(alpha) * Math.sin(beta)).normalize();
  };

  return { at, orientation, sunDirection, azimuthDeg: az / D2R };
}
