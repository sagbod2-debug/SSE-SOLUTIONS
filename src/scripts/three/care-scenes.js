// CC Care — « Ensemble ».
// Hero : de petites formes de verre arrondies, éparpillées, se rapprochent (au défilement
// et autour de la souris) pour former un groupe autour du logo.
// Missions : une personne seule, puis des arcs de verre viennent l'entourer, un par mission.
import { THREE, createStage, runLoop, viewSize } from './common.js';
import { glassSet, buildCareLogo, liquidGlass } from './logos.js';

const sm = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function backdrop(scene, dark) {
  // fond opaque très léger pour que le verre ait des reflets à dévier
  const bg = new THREE.Color(dark ? '#0E0F11' : '#FFFFFF');
  const pts = [];
  for (let r = 2; r < 26; r += 1.6) {
    for (let i = 0; i < 120; i++) {
      const a0 = (i / 120) * Math.PI * 2, a1 = ((i + 1) / 120) * Math.PI * 2;
      pts.push(Math.cos(a0) * r, Math.sin(a0) * r, -5, Math.cos(a1) * r, Math.sin(a1) * r, -5);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const col = new THREE.Color(dark ? '#4FBF95' : '#0B7A5A').lerp(bg, dark ? 0.8 : 0.88);
  const obj = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col, toneMapped: false }));
  scene.add(obj);
  return obj;
}

export function mountCareHero(canvas, { dark = false } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 18, fov: 32 });
  if (!stage) return null;
  const { scene, camera, timeU } = stage;
  const rings = backdrop(scene, dark);

  const glass = glassSet(timeU);
  const tints = [
    liquidGlass(timeU, dark ? '#7fd3b1' : '#9fd6bf', 3),
    liquidGlass(timeU, dark ? '#8fb3e6' : '#b5cbe9', 3),
    liquidGlass(timeU, '#e7cf9f', 2.5),
    glass.clear,
  ];

  // galets
  const R = rng(5);
  const N = 30;
  const geo = new THREE.SphereGeometry(1, 40, 28);
  const pebbles = [];
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(geo, tints[i % tints.length]);
    const s = 0.18 + R() * 0.3;
    m.scale.set(s, s * (0.72 + R() * 0.2), s * 0.85);
    // position éparse (départ) et place dans le groupe (arrivée : anneau souple autour du logo)
    const a = R() * Math.PI * 2;
    const far = 8 + R() * 9;
    const start = new THREE.Vector3(Math.cos(a) * far * 1.4, Math.sin(a) * far * 0.8, -2 + R() * 4);
    const ga = (i / N) * Math.PI * 2 + R() * 0.2;
    const gr = 4.2 + (i % 3) * 0.8 + R() * 0.3;
    const goal = new THREE.Vector3(Math.cos(ga) * gr * 1.45, Math.sin(ga) * gr * 0.5, -1.2 + R() * 1.2);
    m.userData = { start, goal, ph: R() * 6.28, cur: start.clone(), rot: new THREE.Euler(R() * 3, R() * 3, R() * 3) };
    m.position.copy(start);
    scene.add(m);
    pebbles.push(m);
  }

  const logo = buildCareLogo(glass);
  const pivot = new THREE.Group();
  pivot.add(logo);
  scene.add(pivot);
  scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.2 : 0.5));

  let target = 0, prog = 0, intro = 0, lay = { vw: 10, vh: 6, wide: true };
  const ptr = new THREE.Vector3();

  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      intro = reduce ? 1 : Math.min(1, t / 3);
      prog += (target - prog) * (reduce ? 1 : 0.08);
      const gather = reduce ? 1 : Math.min(1, 0.25 * intro + prog);
      const { vw, vh, wide } = lay;
      const cy = wide ? -vh * 0.06 : -vh * 0.04;
      ptr.set(px * vw * 0.5, -py * vh * 0.5, 0);

      pebbles.forEach((m, i) => {
        const u = m.userData;
        const k = sm(i / N * 0.4, i / N * 0.4 + 0.6, gather);
        const tx = u.start.x + (u.goal.x - u.start.x) * k;
        const ty = u.start.y + (u.goal.y + cy - u.start.y) * k;
        const tz = u.start.z + (u.goal.z - u.start.z) * k;
        // la souris attire doucement les galets proches
        const dx = ptr.x - tx, dy = ptr.y - ty, d = Math.hypot(dx, dy);
        const pull = reduce ? 0 : Math.max(0, 1 - d / 4) * 0.9;
        const bob = reduce ? 0 : Math.sin(t * 0.7 + u.ph) * 0.12;
        u.cur.x += (tx + dx * pull * 0.35 - u.cur.x) * 0.06;
        u.cur.y += (ty + dy * pull * 0.35 + bob - u.cur.y) * 0.06;
        u.cur.z += (tz - u.cur.z) * 0.06;
        m.position.copy(u.cur);
        m.rotation.set(u.rot.x + t * 0.1, u.rot.y + t * 0.13, u.rot.z);
      });

      const logoIn = sm(0.0, 0.5, gather);
      const sc = (wide ? Math.min(1.2, (vh * 0.5) / 5) : Math.min(1, (vw * 0.62) / 5)) * (0.6 + 0.4 * logoIn);
      pivot.scale.setScalar(Math.max(0.001, sc));
      pivot.position.set(0, cy + Math.sin(t * 0.7) * 0.06, 0.4);
      pivot.rotation.y = Math.sin(t * 0.4) * 0.35 + px * 0.25;
      pivot.rotation.x = py * 0.12;
      rings.rotation.z = t * 0.01;
    },
    () => {
      const { vw, vh } = viewSize(camera);
      lay = { vw, vh, wide: camera.aspect > 1.05 };
    }
  );

  return {
    setProgress(p) {
      target = Math.max(0, Math.min(1, p));
      loop.redraw();
    },
    setPaused: loop.setPaused,
    dispose: loop.dispose,
  };
}

/** Une personne au centre ; chaque mission ajoute un arc de verre qui vient l'entourer. */
export function mountCareShelter(canvas, { dark = false, count = 4 } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 12, fov: 32 });
  if (!stage) return null;
  const { scene, timeU } = stage;
  backdrop(scene, dark);
  const glass = glassSet(timeU);

  const person = new THREE.Group();
  const warm = new THREE.MeshPhysicalMaterial({ color: dark ? '#4FBF95' : '#0B7A5A', roughness: 0.35, clearcoat: 1 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 40, 30), warm);
  head.position.y = 0.55;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.5, 8, 24), warm);
  body.position.y = -0.3;
  body.scale.set(1, 1, 0.8);
  person.add(head, body);
  scene.add(person);

  const mats = [glass.clear, liquidGlass(timeU, dark ? '#7fd3b1' : '#9fd6bf', 3), glass.gold, liquidGlass(timeU, dark ? '#8fb3e6' : '#b5cbe9', 3)];
  const arcs = [];
  for (let i = 0; i < count; i++) {
    const r = 1.35 + i * 0.42;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09 + i * 0.01, 24, 160, Math.PI * (1.15 + i * 0.12)), mats[i % mats.length]);
    const holder = new THREE.Group();
    holder.add(arc);
    holder.userData = { k: 0, base: (i / count) * Math.PI * 2, tilt: (i % 2 ? 1 : -1) * (0.35 + i * 0.12) };
    scene.add(holder);
    arcs.push(holder);
  }

  let active = -1, scale = 1;
  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      arcs.forEach((h, i) => {
        const on = i <= active ? 1 : 0;
        h.userData.k += (on - h.userData.k) * (reduce ? 1 : 0.06);
        const k = h.userData.k;
        const e = 1 - Math.pow(1 - k, 3);
        h.scale.setScalar(Math.max(0.001, scale * (0.4 + 0.6 * e)));
        h.children[0].material.opacity = 1;
        h.visible = k > 0.01;
        h.rotation.set(h.userData.tilt * e + py * 0.1, px * 0.2 + (1 - e) * 2, h.userData.base + (reduce ? 0 : t * (0.12 + i * 0.03)) * (i % 2 ? -1 : 1));
        h.position.z = (1 - e) * 4;
      });
      person.scale.setScalar(scale * (1 + Math.sin(t * 1.4) * 0.02));
      person.rotation.y = px * 0.3;
    },
    () => {
      const { vw, vh } = viewSize(stage.camera);
      scale = Math.min(1.1, Math.min(vw, vh) / 7);
    }
  );

  return {
    setActive(i) {
      active = i;
      loop.redraw();
    },
    setPaused: loop.setPaused,
    dispose: loop.dispose,
  };
}
