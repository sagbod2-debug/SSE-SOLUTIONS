// Accueil SSE Solutions — « Une maison, trois métiers ».
// Le logo SSE en verre liquide ; au défilement, le trait doré devient un anneau de lumière,
// puis le logo se sépare : S → Social (CC Care), S → Security (CC Consulting), E → Events (CC Events).
// Chaque lettre rejoint son univers miniature.
import { THREE, createStage, runLoop, viewSize } from './common.js';
import { glassSet, buildSSELogo } from './logos.js';

const sm = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function lines(points, color) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, toneMapped: false }));
}

/** Univers Social : un petit réseau de personnes reliées. */
function careWorld(dark) {
  const g = new THREE.Group();
  const col = new THREE.Color(dark ? '#4FBF95' : '#0B7A5A');
  const mat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.35, clearcoat: 1 });
  const pts = [];
  const nodes = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996, r = 0.5 + Math.sqrt(i / 14) * 1.6;
    const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.8, Math.sin(i * 1.7) * 0.6);
    nodes.push(p);
    const m = new THREE.Mesh(new THREE.SphereGeometry(i % 4 === 0 ? 0.14 : 0.08, 20, 14), mat);
    m.position.copy(p);
    g.add(m);
  }
  nodes.forEach((p, i) => {
    nodes.map((q, j) => [j, p.distanceTo(q)]).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 2)
      .forEach(([j]) => pts.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z));
  });
  g.add(lines(pts, col.clone().lerp(new THREE.Color(dark ? '#0E0F11' : '#FFFFFF'), 0.35)));
  return g;
}

/** Univers Sécurité : trois niveaux de plan de bâtiment. */
function consultingWorld(dark) {
  const g = new THREE.Group();
  const col = new THREE.Color(dark ? '#EF6A70' : '#D42A3A');
  const soft = col.clone().lerp(new THREE.Color(dark ? '#0E0F11' : '#FFFFFF'), 0.45);
  for (let l = 0; l < 3; l++) {
    const y = (l - 1) * 0.55, pts = [];
    const r = (x, z, w, d) => pts.push(x, y, z, x + w, y, z, x + w, y, z, x + w, y, z + d, x + w, y, z + d, x, y, z + d, x, y, z + d, x, y, z);
    r(-1.6, -1, 3.2, 2);
    r(-1.6, -1, 1.2, 0.9);
    r(0.4, 0.2, 1.2, 0.8);
    pts.push(-1.6, y, 0.05, 1.6, y, 0.05);
    g.add(lines(pts, l === 1 ? col : soft));
  }
  const dash = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.4, 0.02, 0.05), new THREE.Vector3(-1.2, 0.02, 0.05), new THREE.Vector3(-1.4, 0.02, -0.8)]),
    new THREE.LineDashedMaterial({ color: dark ? '#4FBF95' : '#2F8F5B', dashSize: 0.12, gapSize: 0.08, toneMapped: false })
  );
  dash.computeLineDistances();
  g.add(dash);
  g.rotation.x = 0.7;
  g.rotation.y = -0.5;
  return g;
}

/** Univers Événements : une scène miniature et un faisceau. */
function eventsWorld(dark) {
  const g = new THREE.Group();
  const col = new THREE.Color(dark ? '#A498F2' : '#5B4BC4');
  const clay = new THREE.MeshStandardMaterial({ color: dark ? '#3A3D44' : '#ECEAE5', roughness: 0.9 });
  const stage = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 1.1), clay);
  stage.position.y = -0.7;
  g.add(stage);
  const truss = [];
  for (const x of [-1.3, 1.3]) truss.push(x, -0.6, -0.5, x, 0.9, -0.5);
  truss.push(-1.3, 0.9, -0.5, 1.3, 0.9, -0.5);
  g.add(lines(truss, col));
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.5, 32, 1, true).translate(0, -0.75, 0),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: dark ? 0.22 : 0.14, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  cone.position.set(0, 0.88, -0.3);
  g.add(cone);
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.12, 3, 8), clay);
    h.position.set(-1 + (i % 5) * 0.5, -0.95, 0.8 + Math.floor(i / 5) * 0.35);
    g.add(h);
  }
  g.rotation.x = 0.35;
  g.rotation.y = -0.35;
  g.userData.cone = cone;
  return g;
}

export function mountHomeScene(canvas, { dark = false } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 16, fov: 32 });
  if (!stage) return null;
  const { scene, camera, timeU } = stage;
  const bg = new THREE.Color(dark ? '#0E0F11' : '#FFFFFF');

  // fond : fine trame (opaque, pour que le verre ait quelque chose à réfracter)
  const gp = [];
  for (let i = -24; i <= 24; i++) gp.push(i, -14, -6, i, 14, -6);
  for (let j = -14; j <= 14; j++) gp.push(-24, j, -6, 24, j, -6);
  const grid = lines(gp, new THREE.Color(dark ? '#3a3d44' : '#c9a04a').lerp(bg, dark ? 0.55 : 0.82));
  scene.add(grid);

  const glass = glassSet(timeU);
  const logo = buildSSELogo(glass);
  scene.add(logo);
  const P = logo.userData.parts;
  const home = {};
  Object.entries(P).forEach(([k, m]) => (home[k] = m.position.clone()));

  // l'anneau de lumière qui naît du trait doré
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.006, 8, 240),
    new THREE.MeshBasicMaterial({ color: dark ? '#E9C46E' : '#C79A3E', transparent: true, opacity: 0.9, toneMapped: false })
  );
  ring.scale.setScalar(0.001);
  scene.add(ring);

  const worlds = [careWorld(dark), consultingWorld(dark), eventsWorld(dark)];
  worlds.forEach((w) => { w.scale.setScalar(0.001); scene.add(w); });
  const letters = [P.s1, P.s2, P.e];

  let target = 0, prog = 0, lay = { vw: 10, vh: 6, wide: true };

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 6, 8);
  scene.add(key, new THREE.AmbientLight(0xffffff, dark ? 0.25 : 0.6));

  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      prog += (target - prog) * (reduce ? 1 : 0.1);
      const ringIn = sm(0.08, 0.38, prog);
      const split = sm(0.4, 0.72, prog);
      const worldIn = sm(0.6, 0.9, prog);
      const { vw, vh, wide } = lay;

      // logo entier : légère respiration et tour lent tant qu'il n'est pas séparé
      const whole = 1 - split;
      const spin = reduce ? 0 : Math.sin(t * 0.35) * 0.35 * whole;
      logo.rotation.y = spin + px * 0.25 * whole;
      logo.rotation.x = py * 0.12 * whole;
      logo.position.y = vh * (wide ? 0.17 : 0.14) + Math.sin(t * 0.8) * 0.06 * whole;
      const sc = (wide ? Math.min(1, (vw * 0.28) / 6.2, (vh * 0.42) / 6.2) : Math.min(1, (vw * 0.66) / 6.2));
      logo.scale.setScalar(sc);

      // trait doré → anneau
      P.swoosh.scale.setScalar(Math.max(0.001, 1 - ringIn));
      P.arcTop.scale.setScalar(Math.max(0.001, 1 - ringIn * 0.9));
      P.arcBot.scale.setScalar(Math.max(0.001, 1 - ringIn * 0.9));
      const ringR = (wide ? vw * 0.4 : vw * 0.46) * (0.35 + 0.65 * ringIn);
      ring.scale.setScalar(Math.max(0.001, ringR * ringIn));
      ring.position.set(0, logo.position.y * (1 - ringIn) - vh * 0.04 * ringIn, -0.8);
      ring.rotation.x = Math.PI / 2 - 0.42 + (reduce ? 0 : Math.sin(t * 0.3) * 0.04);
      ring.rotation.z = t * 0.1;

      // séparation : chaque lettre vers son univers
      const slots = wide
        ? [[-vw * 0.31, vh * 0.16], [0, vh * 0.16], [vw * 0.31, vh * 0.16]]
        : [[-vw * 0.22, vh * 0.3], [-vw * 0.22, vh * 0.02], [-vw * 0.22, -vh * 0.26]];
      const worldSlots = wide
        ? [[-vw * 0.31, -vh * 0.04], [0, -vh * 0.04], [vw * 0.31, -vh * 0.04]]
        : [[vw * 0.12, vh * 0.3], [vw * 0.12, vh * 0.02], [vw * 0.12, -vh * 0.26]];
      letters.forEach((m, i) => {
        const h = home[['s1', 's2', 'e'][i]];
        const [tx, ty] = slots[i];
        m.position.set(
          h.x + (tx / sc - h.x) * split,
          h.y + ((ty - logo.position.y) / sc - h.y) * split,
          h.z + split * 0.6
        );
        m.rotation.y = split * (reduce ? 0 : Math.sin(t * 0.5 + i) * 0.4) + split * px * 0.2;
        m.scale.setScalar(1 - split * (wide ? 0.45 : 0.6));
      });

      // univers miniatures
      worlds.forEach((w, i) => {
        const [tx, ty] = worldSlots[i];
        const s = Math.max(0.001, worldIn) * (wide ? Math.min(1.2, vw / 14) : Math.min(0.75, vw / 8));
        w.scale.setScalar(s);
        w.position.set(tx, ty, -1.2);
        w.rotation.y += reduce ? 0 : 0.003 * (i % 2 ? -1 : 1);
        if (w.userData.cone) w.userData.cone.material.opacity = (dark ? 0.22 : 0.14) * (0.8 + 0.2 * Math.sin(t * 2));
      });
      grid.position.x = px * 0.3;
      grid.position.y = -py * 0.2;
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
