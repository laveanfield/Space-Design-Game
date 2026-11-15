/**
 * payloadAdapter -- DOAN CHOP NOI (payload adapter cone) giua tang tren cung cua ten lua va ve tinh.
 *
 * Giong anh tham khao (hoat hinh tach tai trong): tang tren trang -> thanh tru den (skirt) -> chop den thu nho dan -> VONG TACH
 * (separation ring, bang kep bac + bu long) -> ve tinh. O vach noi voi tang co mot vach vang mong. Co 4 lo xo day ve tinh
 * (nhin thay khe giua vong tach va ve tinh), hop noi cap (umbilical) + day cap chay doc chop, 2 cua kiem tra.
 *
 * He truc: z huong len (cung he voi cac luoi ten lua), day chop o z = 0, dinh o z = height.
 * Kich thuoc theo ten lua va ve tinh THAT: ban kinh day = ban kinh dinh tang tren cung; ban kinh dinh = nua be rong ve tinh.
 * Hinh dang chi tiet (so bu long, lo xo, cua) la MINH HOA, khong phai ban ve ky thuat cua ten lua nao.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const MAT = {
  composite: new THREE.MeshStandardMaterial({ color: 0x1b1e22, metalness: 0.38, roughness: 0.5 }),
  panel: new THREE.MeshStandardMaterial({ color: 0x2c3138, metalness: 0.42, roughness: 0.45 }),
  lid: new THREE.MeshStandardMaterial({ color: 0x23272d, metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd9a84a, metalness: 0.92, roughness: 0.3 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: 0.88, roughness: 0.32 }),
  bolt: new THREE.MeshStandardMaterial({ color: 0x8e969e, metalness: 0.8, roughness: 0.4 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x0c0d0f, metalness: 0.2, roughness: 0.7 }),
  spring: new THREE.MeshStandardMaterial({ color: 0xb9c0c8, metalness: 0.9, roughness: 0.25 }),
  warn: new THREE.MeshStandardMaterial({ color: 0xd8532c, metalness: 0.2, roughness: 0.6 }),
};

// truc tru / chop dung CylinderGeometry (truc y) -> xoay sang truc z
const zUp = (geo) => geo.rotateX(Math.PI / 2);

/** Gop nhieu hinh nho thanh MOT luoi (it draw call). */
function merged(geos, material) {
  const m = new THREE.Mesh(mergeGeometries(geos, false), material);
  return m;
}

export function buildPayloadAdapter({ rBase, rTop, height }) {
  const g = new THREE.Group();
  g.name = 'payload-adapter';
  const hs = height * 0.24; // thanh tru (ngan hon, de phan chop dai va thon)
  const hr = height * 0.085; // vong tach
  const hc = height - hs - hr; // chop

  // 1) thanh tru den (skirt) + chop den
  const skirt = new THREE.Mesh(zUp(new THREE.CylinderGeometry(rBase, rBase, hs, 64, 1, true).translate(0, hs / 2, 0)), MAT.composite);
  const cone = new THREE.Mesh(zUp(new THREE.CylinderGeometry(rTop * 1.04, rBase, hc, 64, 1, true).translate(0, hs + hc / 2, 0)), MAT.composite);
  g.add(skirt, cone);
  // nap day (che khoang trong khi nhin tu duoi len)
  const lid = new THREE.Mesh(new THREE.CircleGeometry(rBase, 48), MAT.lid);
  lid.position.z = 0.004;
  g.add(lid);

  // 2) vach vang mong o day (noi voi tang) + vanh gia cuong cuoi thanh tru
  const goldGeos = [
    zUp(new THREE.CylinderGeometry(rBase * 1.012, rBase * 1.012, height * 0.022, 64).translate(0, height * 0.011, 0)),
    zUp(new THREE.CylinderGeometry(rBase * 1.006, rBase * 1.006, height * 0.012, 64).translate(0, hs, 0)),
  ];
  g.add(merged(goldGeos, MAT.gold));

  // 3) vong tach (clamp band) + bu long + 4 lo xo day
  const ringZ = hs + hc + hr / 2;
  const rr = rTop * 1.08;
  const ringGeos = [zUp(new THREE.CylinderGeometry(rr, rr, hr, 64).translate(0, ringZ, 0))];
  g.add(merged(ringGeos, MAT.silver));
  const boltGeos = [];
  const nBolts = Math.max(12, Math.min(40, Math.round(rr * 30)));
  for (let i = 0; i < nBolts; i++) {
    const a = (i / nBolts) * Math.PI * 2;
    const b = new THREE.BoxGeometry(rr * 0.07, rr * 0.07, hr * 0.5);
    b.translate(Math.cos(a) * (rr + rr * 0.015), Math.sin(a) * (rr + rr * 0.015), ringZ);
    b.rotateZ(0);
    boltGeos.push(b);
  }
  g.add(merged(boltGeos, MAT.bolt));
  // mat tren vong tach: dia den (giao dien ve tinh)
  const plate = new THREE.Mesh(zUp(new THREE.CylinderGeometry(rTop * 0.98, rTop * 0.98, height * 0.012, 48).translate(0, hs + hc + hr + height * 0.006, 0)), MAT.panel);
  g.add(plate);
  const springGeos = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const sp = new THREE.CylinderGeometry(rTop * 0.045, rTop * 0.045, height * 0.06, 12).translate(0, hs + hc + hr + height * 0.03, 0);
    zUp(sp).translate(Math.cos(a) * rTop * 0.72, Math.sin(a) * rTop * 0.72, 0);
    springGeos.push(sp);
  }
  g.add(merged(springGeos, MAT.spring));

  // 4) hop noi cap (umbilical) + day cap chay doc chop, 2 cua kiem tra o thanh tru
  const box = new THREE.Mesh(new THREE.BoxGeometry(rBase * 0.12, rBase * 0.07, hs * 0.5), MAT.warn);
  box.position.set(rBase * 1.01, 0, hs * 0.5);
  g.add(box);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(rBase * 1.02, 0, hs * 0.75),
    new THREE.Vector3(rBase * 0.86, 0, hs + hc * 0.32),
    new THREE.Vector3(rTop * 1.12, 0, hs + hc * 0.88),
    new THREE.Vector3(rTop * 1.12, 0, ringZ),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 24, Math.max(0.008, rBase * 0.012), 6), MAT.cable));
  for (const a of [Math.PI * 0.6, Math.PI * 1.45]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(rBase * 0.34, rBase * 0.012, hs * 0.55), MAT.panel);
    door.position.set(Math.cos(a) * (rBase + 0.002), Math.sin(a) * (rBase + 0.002), hs * 0.52);
    door.rotation.z = a + Math.PI / 2;
    g.add(door);
  }
  g.userData.ringZ = ringZ + hr / 2; // z cua mat tren vong tach (de dat ve tinh / ban tia lua khi tach)
  g.userData.height = height;
  return g;
}

/**
 * Dat ve tinh THAT len doan chop noi o dinh tang tren cung cua ten lua `rig` (buildRocket).
 * - chop gan vao nhom tang tren cung -> luc tach, chop lui ve cung tang, ve tinh o lai
 * - ve tinh nam trong `rig.payload` (nhu truoc) nhung nang len theo chieu cao chop; chieu cao chop bi gioi han de ve tinh van
 *   nam trong fairing.
 * Tra { adapter, carrier, height, ringWorld(out) } hoac null neu ten lua khong co khoang tai trong.
 */
export function mountSatelliteOnAdapter(rig, satRig) {
  if (!rig?.payload || !rig.stages?.length) return null;
  const lastIdx = rig.stages.length - 1;
  const top = rig.stages[lastIdx];
  const sm = rig.info.meshes.find((m) => m.role === 'stage' && m.index === lastIdx);
  const fm = rig.info.meshes.find((m) => m.role === 'fairing');
  if (!top || !sm) return null;
  const stageTop = sm.lo[2] + sm.span[2];
  const rBase = 0.5 * Math.min(sm.span[0], sm.span[1]) * 0.985;
  const box = new THREE.Box3().setFromObject(satRig.inner);
  const size = box.getSize(new THREE.Vector3());
  const lift = Math.max(0, -box.min.z); // ve tinh co anten nho xuong duoi day: nang len cho khoi dam vao chop
  const satHalf = 0.5 * Math.max(size.x, size.y);
  const rTop = Math.max(0.10, Math.max(rBase * 0.24, Math.min(rBase * 0.52, satHalf * 0.80))); // chop thon dan ro: dinh chi khoang nua day, ve tinh co the rong hon vong tach
  // chieu cao chop theo co tang (nhu hinh tham khao: dai khoang 1 duong kinh), nhung dinh ve tinh phai con duoi dinh fairing
  const fairingTop = fm ? fm.lo[2] + fm.span[2] : stageTop + 3 * rBase;
  const room = fairingTop - 0.12 * (fairingTop - stageTop) - stageTop - size.z - lift - 0.05;
  const height = Math.max(0.28, Math.min(rBase * 1.35, 3.0, room));
  const adapter = buildPayloadAdapter({ rBase, rTop, height });
  adapter.position.z = stageTop;
  top.add(adapter);
  const carrier = new THREE.Group();
  carrier.position.set(0, 0, stageTop + height * 1.0 + 0.065 * height + 0.012 + lift); // khe nho cho 4 lo xo day ve tinh
  carrier.add(satRig.inner);
  rig.payload.clear();
  rig.payload.add(carrier);
  const ringWorld = (out = new THREE.Vector3()) => adapter.localToWorld(out.set(0, 0, adapter.userData.ringZ));
  return { adapter, carrier, height, rBase, rTop, ringWorld };
}

/**
 * Dat doan chop noi PHIA DUOI ve tinh dung rieng (be lap rap / xem rieng ve tinh): ve tinh dung tren chop nhu tren ten lua.
 * Chop gan vao `satRig.inner` (he z-up cua ve tinh), day chop o duoi, dinh chop sat day ve tinh.
 */
export function addAdapterBelow(satRig) {
  const d = satRig.info?.dims || [0.4, 0.4, 0.6];
  const satHalf = 0.5 * Math.max(d[0], d[1]);
  const rTop = Math.max(0.08, satHalf * 0.85);
  const rBase = Math.max(rTop * 2.0, satHalf * 1.5);
  const height = Math.max(0.16, rBase * 1.1);
  const adapter = buildPayloadAdapter({ rBase, rTop, height });
  adapter.position.z = -height - 0.02;
  satRig.inner.add(adapter);
  return adapter;
}
