// Autonomie & Inclusion — « Le quotidien en miniature ».
// Une petite ville vue d'en haut (logement, démarches, santé, arrêt de bus, épicerie).
// Un personnage la traverse ; chaque lieu s'éclaire à son passage.
// setProgress(p) : 0 = vue d'ensemble (promenade libre), puis la caméra suit le personnage
// d'étape en étape (4 étapes du parcours).
import { THREE, createStage, runLoop } from './common.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const sm = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const PLACES = [
  { key: 'logement', label: 'Logement', u: 0.02 },
  { key: 'demarches', label: 'Démarches', u: 0.22 },
  { key: 'sante', label: 'Santé', u: 0.42 },
  { key: 'bus', label: 'Mobilité', u: 0.62 },
  { key: 'epicerie', label: 'Budget', u: 0.82 },
];

export function mountAutonomieTown(canvas, { dark = false, labels = [] } = {}) {
  const bgHex = dark ? '#0E0F11' : '#FFFFFF';
  const stage = createStage(canvas, { background: bgHex, exposure: 1.0 });
  if (!stage) return null;
  const { scene, renderer } = stage;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // caméra orthographique isométrique
  const cam = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 200);
  stage.camera = cam;
  const iso = new THREE.Vector3(1, 1.05, 1).normalize().multiplyScalar(60);

  const accent = new THREE.Color(dark ? '#4FC3D1' : '#0A7A88');
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  const wall = M(dark ? '#2C3034' : '#FBFAF7');
  const wall2 = M(dark ? '#353A3F' : '#EFECE6');
  const roof = M(dark ? '#2E5E66' : '#8CC5CC');
  const ground = M(dark ? '#16191B' : '#EEF4F1');
  const pathMat = M(dark ? '#23282B' : '#DCE7E2');
  const tree = M(dark ? '#2F5546' : '#A9CDB6', { flatShading: true });
  const trunk = M(dark ? '#4A4038' : '#CDBBA6');

  const world = new THREE.Group();
  scene.add(world);
  const cast = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

  // socle
  const base = new THREE.Mesh(new RoundedBoxGeometry(22, 0.8, 16, 4, 0.4), ground);
  base.position.y = -0.4;
  base.receiveShadow = true;
  world.add(base);

  // chemin en boucle
  const curve = new THREE.CatmullRomCurve3(
    [[-7, 4.5], [-2, 5.2], [4, 4.6], [7.5, 1.5], [6.5, -3.5], [1.5, -5], [-4, -4.4], [-7.6, -0.8]].map(([x, z]) => new THREE.Vector3(x, 0.02, z)),
    true, 'catmullrom', 0.4
  );
  const N = 240;
  const ribbon = [];
  const idx = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u);
    const n = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(0.55);
    ribbon.push(p.x + n.x, 0.03, p.z + n.z, p.x - n.x, 0.03, p.z - n.z);
    if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(ribbon, 3));
  rg.setIndex(idx);
  rg.computeVertexNormals();
  const road = new THREE.Mesh(rg, pathMat);
  road.receiveShadow = true;
  world.add(road);

  // lieux
  const box = (w, h, d, m, x, y, z) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.08), m);
    b.position.set(x, y, z);
    return b;
  };
  const windowMat = () => new THREE.MeshStandardMaterial({ color: dark ? '#1b2a2d' : '#d8e7ea', roughness: 0.4, emissive: accent.clone(), emissiveIntensity: 0 });
  const builders = {
    logement() {
      const g = new THREE.Group();
      g.add(box(2.2, 1.6, 1.8, wall, 0, 0.8, 0));
      const r = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.0, 4, 1), roof);
      r.rotation.y = Math.PI / 4;
      r.position.y = 2.1;
      r.scale.set(1, 1, 0.82);
      g.add(r);
      const win = box(0.5, 0.45, 0.05, windowMat(), 0.5, 0.95, 0.92);
      const door = box(0.45, 0.8, 0.05, wall2, -0.45, 0.4, 0.92);
      g.add(win, door);
      g.userData.windows = [win];
      return g;
    },
    demarches() {
      const g = new THREE.Group();
      g.add(box(2.8, 2.4, 2, wall, 0, 1.2, 0));
      g.add(box(3.1, 0.25, 2.3, roof, 0, 2.5, 0));
      const wins = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
        const w = box(0.45, 0.45, 0.05, windowMat(), -0.85 + i * 0.85, 0.75 + j * 0.85, 1.02);
        wins.push(w);
        g.add(w);
      }
      g.userData.windows = wins;
      return g;
    },
    sante() {
      const g = new THREE.Group();
      g.add(box(2.2, 1.7, 1.8, wall, 0, 0.85, 0));
      const crossM = new THREE.MeshStandardMaterial({ color: dark ? '#4FBF95' : '#2F8F5B', roughness: 0.5, emissive: new THREE.Color(dark ? '#4FBF95' : '#2F8F5B'), emissiveIntensity: 0 });
      const c1 = box(0.6, 0.18, 0.06, crossM, 0, 1.25, 0.93);
      const c2 = box(0.18, 0.6, 0.06, crossM, 0, 1.25, 0.93);
      const win = box(1.2, 0.4, 0.05, windowMat(), 0, 0.55, 0.92);
      g.add(c1, c2, win);
      g.add(box(2.4, 0.18, 2.0, roof, 0, 1.78, 0));
      g.userData.windows = [win, c1, c2];
      return g;
    },
    bus() {
      const g = new THREE.Group();
      g.add(box(1.8, 0.08, 0.9, roof, 0, 1.4, 0));
      for (const x of [-0.8, 0.8]) g.add(box(0.08, 1.4, 0.08, wall2, x, 0.7, -0.35));
      g.add(box(1.7, 1.2, 0.05, new THREE.MeshStandardMaterial({ color: dark ? '#203033' : '#e3f0f2', transparent: true, opacity: 0.7, roughness: 0.2 }), 0, 0.75, -0.4));
      const busBody = new THREE.Group();
      busBody.add(box(3.2, 1.2, 1.2, M(dark ? '#3A6E76' : '#BFE0E4'), 0, 0.75, 0));
      const wins = [];
      for (let i = 0; i < 4; i++) {
        const w = box(0.5, 0.4, 0.05, windowMat(), -1.1 + i * 0.72, 0.95, 0.61);
        wins.push(w);
        busBody.add(w);
      }
      busBody.position.set(0.2, 0, 1.6);
      g.add(busBody);
      g.userData.windows = wins;
      g.userData.bus = busBody;
      return g;
    },
    epicerie() {
      const g = new THREE.Group();
      g.add(box(2.4, 1.5, 1.8, wall, 0, 0.75, 0));
      for (let i = 0; i < 6; i++) {
        const s = box(0.4, 0.08, 0.6, i % 2 ? wall2 : roof, -1 + i * 0.4, 1.4, 1.1);
        s.rotation.x = 0.35;
        g.add(s);
      }
      const win = box(1.6, 0.6, 0.05, windowMat(), 0, 0.65, 0.92);
      g.add(win);
      g.userData.windows = [win];
      return g;
    },
  };
  const places = PLACES.map((pl) => {
    const g = cast(builders[pl.key]());
    const p = curve.getPointAt(pl.u);
    const t = curve.getTangentAt(pl.u);
    const out = new THREE.Vector3(-t.z, 0, t.x).normalize();
    // côté extérieur de la boucle
    if (out.dot(p) < 0) out.negate();
    g.position.copy(p).add(out.multiplyScalar(2.1));
    g.position.y = 0;
    g.lookAt(p.x, 0, p.z);
    g.userData.u = pl.u;
    g.userData.glow = 0;
    world.add(g);
    return g;
  });

  // arbres
  const R = (() => { let s = 3; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  for (let i = 0; i < 16; i++) {
    const tr = new THREE.Group();
    const h = 0.6 + R() * 0.5;
    const tk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, h, 6), trunk);
    tk.position.y = h / 2;
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + R() * 0.3, 0), tree);
    top.position.y = h + 0.35;
    tr.add(tk, top);
    let x, z;
    do { x = (R() - 0.5) * 19; z = (R() - 0.5) * 13; } while (Math.hypot(x, z) > 2.8 && Math.hypot(x, z) < 8.6 && Math.abs(x) < 9);
    tr.position.set(x, 0, z);
    world.add(cast(tr));
  }

  // personnage
  const person = new THREE.Group();
  const skin = M(dark ? '#E7E4DE' : '#3A3D44');
  const shirt = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 12), shirt);
  body.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skin);
  head.position.y = 1.2;
  const legs = [0, 1].map((i) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.32, 3, 8), skin);
    m.position.y = -0.2;
    g.add(m);
    g.position.set(i ? 0.09 : -0.09, 0.42, 0);
    return g;
  });
  person.add(body, head, ...legs);
  cast(person);
  world.add(person);

  // lumière
  scene.add(new THREE.HemisphereLight('#ffffff', dark ? '#0b0c0e' : '#dfe8e4', dark ? 0.5 : 1.0));
  const sun = new THREE.DirectionalLight('#ffffff', dark ? 0.8 : 1.6);
  sun.position.set(-12, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 1, far: 60 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  let target = 0, prog = 0, walkU = 0, aspect = 1;
  const tmp = new THREE.Vector3();
  const focus = new THREE.Vector3();

  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      prog += (target - prog) * (reduce ? 1 : 0.08);
      // 0 → 0.2 : vue d'ensemble, promenade libre ; 0.2 → 1 : les 4 étapes (lieux 1 à 4)
      const follow = sm(0.12, 0.25, prog);
      const stepF = Math.max(0, (prog - 0.2) / 0.8) * 4; // 0..4
      const k = Math.min(3, Math.floor(stepF));
      const within = sm(0.1, 0.55, stepF - k);
      const uFrom = PLACES[k].u, uTo = PLACES[k + 1].u;
      const guided = uFrom + (uTo - uFrom) * within - 0.025;
      const free = reduce ? 0.12 : (t * 0.018) % 1;
      walkU = follow > 0.5 ? guided : free;
      const u = ((walkU % 1) + 1) % 1;
      const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
      person.position.set(p.x, 0, p.z);
      person.rotation.y = Math.atan2(tg.x, tg.z);
      const moving = !reduce && (follow < 0.5 || (within > 0.05 && within < 0.95));
      const s = moving ? Math.sin(t * 9) : 0;
      legs[0].rotation.x = s * 0.6;
      legs[1].rotation.x = -s * 0.6;
      person.position.y = Math.abs(s) * 0.04;

      // lieux qui s'éclairent au passage
      places.forEach((g) => {
        let d = Math.abs(u - g.userData.u);
        d = Math.min(d, 1 - d);
        const on = d < 0.06 ? 1 : 0;
        g.userData.glow += (on - g.userData.glow) * 0.08;
        g.userData.windows.forEach((w) => (w.material.emissiveIntensity = g.userData.glow * (dark ? 1.4 : 0.9)));
        g.position.y = g.userData.glow * 0.12;
        if (g.userData.bus) g.userData.bus.position.x = 0.2 + (reduce ? 0 : Math.sin(t * 0.3) * 0.3);
      });

      // caméra : vue d'ensemble → suit le personnage
      const zoom = 1 + follow * 0.9;
      const half = (aspect > 1 ? 11 : 7.5) / zoom;
      // vue d'ensemble : la ville est décalée à droite du texte (grand écran)
      const shift = aspect > 1.1 ? half * aspect * 0.32 * (1 - follow) : 0;
      focus.set(p.x * follow - shift * 0.7071, 0, p.z * follow + shift * 0.7071);
      cam.left = -half * aspect;
      cam.right = half * aspect;
      cam.top = half;
      cam.bottom = -half;
      cam.updateProjectionMatrix();
      cam.position.copy(focus).add(iso).add(tmp.set(px * 1.5, 0, -px * 1.5));
      cam.lookAt(focus.x, focus.y + py * 0.3, focus.z);
      world.rotation.y = reduce ? 0 : Math.sin(t * 0.05) * 0.04;

      // étiquettes HTML au-dessus des lieux
      if (labels.length) {
        const rect = canvas.getBoundingClientRect();
        places.forEach((g, i) => {
          const el = labels[i];
          if (!el) return;
          tmp.set(0, 3.1, 0);
          g.localToWorld(tmp);
          tmp.project(cam);
          const x = (tmp.x * 0.5 + 0.5) * rect.width, y = (-tmp.y * 0.5 + 0.5) * rect.height;
          el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
          el.classList.toggle('is-on', g.userData.glow > 0.5);
        });
      }
    },
    (w, h) => {
      aspect = w / Math.max(1, h);
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
