// =====================================================================
//  [anatomy] Kiem tra hinh be phong (skill /anatomy):
//    node fe/anatomy/14-11-2026-launchpad_build.mjs            -> ghi trang thu fe/anatomy/out/launchpad.html (+ -arms.html)
//    node fe/anatomy/14-11-2026-launchpad_build.mjs --audit    -> do va cham / do sau / chong do o ca 2 tu the
//  Sau do chay kiem tra dau net:  node <skill>/scripts/lines.mjs fe/anatomy/out/launchpad.html
// =====================================================================
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from '../src/anatomy/kit/iso-kit.mjs';
import * as G from '../src/anatomy/kit/lathe.mjs';
import * as A from '../src/anatomy/kit/audit.mjs';
import { items, projection, launchPadSvg, ogiveProfile, ogiveR, ogiveSlope, W, H } from '../src/anatomy/14-11-2026-launchpad.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
mkdirSync(OUT, { recursive: true });

/** Mo ta hinh khoi -> hinh khoi cua kit/audit.mjs. */
function shapeOf(s) {
  const meta = { name: s.name, ...(s.owner ? { owner: s.owner } : {}), ...(s.ground ? { ground: true } : {}) };
  if (s.t === 'slab') return A.slab(s.plan, s.z, s.h, meta, 1);
  if (s.t === 'ext') return A.extruded(s.ring, s.z, s.h, meta);
  if (s.t === 'cyl') return A.cylinder(s.cx, s.cy, s.r, s.z, s.h, meta);
  if (s.t === 'disc') return A.disc(G.frameAlong(s.o, s.a), s.s0, s.s1, s.r, meta);
  if (s.t === 'ogive') return A.solid(G.frameAlong(s.o, [0, 0, 1]), ogiveProfile(), { ...meta, radius: ogiveR });
  throw new Error('shape ' + s.t);
}

function audited(state, label) {
  const P = projection();
  const R = A.recorder(P);
  const list = items(P, state);
  list.forEach((it, i) => R.put({ key: i, name: it.id, svg: it.svg, shapes: it.shapes.map((s) => R.solid(shapeOf(s))) }));
  const before = R.items.map((it) => it.name);
  A.settle(R, P);
  const after = [...R.items].sort((a, b) => a.key - b.key).map((it) => it.name);
  const moved = before.filter((n, i) => after[i] !== n);
  console.log(`--- ${label}: ${R.items.length} item, ${R.solids.length} hinh khoi; thu tu ve doi so voi thu tu viet tay: ${moved.length ? moved.join(', ') : 'khong'}`);
  return { R, P, after };
}

// Thu tu ve do duoc phai GIONG NHAU o moi tu the (trang web dung mot thu tu co dinh, chi doi hinh phan dong)
const orders = [];
const ORDER_PATH = join(HERE, '..', 'src', 'anatomy', '14-11-2026-launchpad_order.json');

const poses = [[{ arm: 0, clamp: 0, lift: 0 }, 'tu the nghi'], [{ arm: 1, clamp: 1, lift: 0 }, 'can noi rut ra, kep mo']];
{
  const audit = process.argv.includes('--audit');
  let failed = 0;
  for (const [state, label] of poses) {
    const { R, P, after } = audited(state, label);
    orders.push(after);
    if (!audit) continue;
    const res = A.audit(R, P);
    console.log(A.report(res));
    failed += A.failures(res);
  }
  const same = orders.every((o) => o.join() === orders[0].join());
  console.log(same ? 'thu tu ve: giong nhau o moi tu the' : 'CANH BAO: thu tu ve khac nhau giua cac tu the');
  if (!same) failed += 1;
  writeFileSync(ORDER_PATH, JSON.stringify({ note: 'Sinh boi fe/anatomy/14-11-2026-launchpad_build.mjs (A.settle). Chay lai build de cap nhat.', order: orders[0] }, null, 1));
  if (audit) console.log(failed ? `audit failed: ${failed} problems` : 'audit passed');
  if (failed) process.exitCode = 1;
}

for (const [state, name] of [[poses[0][0], 'launchpad.html'], [poses[1][0], 'launchpad-arms.html']]) {
  const { svg } = launchPadSvg({ state });
  const body = k.plateHtml({ fig: 'Fig 1', title: 'Bệ phóng', hint: 'Cần nối rút ra trước T-0', readout: state.arm ? 'cần nối 80° • kẹp mở' : 'cần nối áp thân • kẹp đóng', caption: 'Minh họa: tháp dịch vụ, 2 cần nối, 4 kẹp giữ chân, bệ phóng di động trên bệ bê tông có muống dẫn lửa.', body: `<div class="iso-stage">${svg}</div>` });
  writeFileSync(join(OUT, name), k.pageHtml({ title: 'Launch pad', theme: 'dark', body }));
  console.log('ghi', name, `${W}x${H}`);
}
void ogiveSlope;
