// CC Events — « Le montage » : une maquette d'architecte où une équipe installe un événement.
// Une seule scène pour toute la page ; le défilement avance une ligne de temps (J-30 → Jour J),
// puis déplace la caméra pour chaque offre et change l'ambiance lumineuse pour chaque règle.
import { THREE, createStage, runLoop, addOutlines } from './common.js';
import { brandMaterials, buildEventsSolid } from './logos-solid.js';

const sm = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Personnages façon maquette ----------
function makePerson(mat, accentMat, { carry = null, seated = false } = {}) {
  const p = new THREE.Group();
  const limb = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10);
  const torso = new THREE.Mesh(limb(0.17, 0.42), accentMat || mat);
  torso.position.y = 1.0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), mat);
  head.position.y = 1.5;
  const legL = new THREE.Group(), legR = new THREE.Group();
  [legL, legR].forEach((g, i) => {
    const m = new THREE.Mesh(limb(0.075, 0.5), mat);
    m.position.y = -0.3;
    g.add(m);
    g.position.set(i ? 0.09 : -0.09, 0.72, 0);
  });
  const armL = new THREE.Group(), armR = new THREE.Group();
  [armL, armR].forEach((g, i) => {
    const m = new THREE.Mesh(limb(0.055, 0.42), mat);
    m.position.y = -0.24;
    g.add(m);
    g.position.set(i ? 0.24 : -0.24, 1.22, 0);
  });
  p.add(torso, head, legL, legR, armL, armR);
  if (carry) {
    carry.position.set(0, 1.05, 0.32);
    p.add(carry);
    armL.rotation.x = armR.rotation.x = -1.1;
  }
  if (seated) {
    legL.rotation.x = legR.rotation.x = -1.4;
    p.position.y = -0.35;
  }
  p.userData = { legL, legR, armL, armR, carry: !!carry, seated };
  p.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return p;
}

function animateWalk(p, t, speed = 1) {
  const s = Math.sin(t * 6 * speed);
  p.userData.legL.rotation.x = s * 0.5;
  p.userData.legR.rotation.x = -s * 0.5;
  if (!p.userData.carry) {
    p.userData.armL.rotation.x = -s * 0.4;
    p.userData.armR.rotation.x = s * 0.4;
  }
}

export function mountEventsFilm(canvas, { dark = false } = {}) {
  const bgHex = dark ? '#0E0F11' : '#FFFFFF';
  const stage = createStage(canvas, { background: bgHex, z: 30, fov: 34, exposure: dark ? 1.0 : 0.95 });
  if (!stage) return null;
  const { scene, camera, renderer, timeU } = stage;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.fog = new THREE.Fog(bgHex, 38, 90);

  const clay = new THREE.MeshStandardMaterial({ color: dark ? '#2B2D33' : '#FFFFFF', roughness: 0.92 });
  const clay2 = new THREE.MeshStandardMaterial({ color: dark ? '#3A3D44' : '#E4E5E8', roughness: 0.9 });
  const violet = new THREE.MeshStandardMaterial({ color: dark ? '#8E80EE' : '#5B4BC4', roughness: 0.6 });
  const gold = new THREE.MeshStandardMaterial({ color: dark ? '#E9C46E' : '#C79A3E', roughness: 0.45, metalness: 0.3 });
  const crewMat = new THREE.MeshStandardMaterial({ color: dark ? '#5A5E68' : '#5D626B', roughness: 0.85 });
  const guestMat = new THREE.MeshStandardMaterial({ color: dark ? '#474A52' : '#A9ADB5', roughness: 0.9 });

  // ---------- Sol ----------
  // sol : en clair, seules les ombres s'impriment sur le blanc pur (aucune teinte de fond)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    dark ? new THREE.MeshStandardMaterial({ color: bgHex, roughness: 1 }) : new THREE.ShadowMaterial({ color: '#1d2026', opacity: 0.16 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(60, 60, dark ? '#24262B' : '#D3D5DA', dark ? '#1B1D21' : '#E9EAED');
  grid.position.y = 0.01;
  scene.add(grid);

  // plan au sol (tracé de la salle), visible au début et en vue du dessus
  const planPts = [];
  const rect = (x, z, w, d) => planPts.push(x, 0.02, z, x + w, 0.02, z, x + w, 0.02, z, x + w, 0.02, z + d, x + w, 0.02, z + d, x, 0.02, z + d, x, 0.02, z + d, x, 0.02, z);
  rect(-9, -9, 18, 5); // scène
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) rect(-7.5 + i * 4.2, 0 + j * 3.6, 2, 2); // tables
  rect(-2, 13, 4, 2.2); // régie
  const planGeo = new THREE.BufferGeometry();
  planGeo.setAttribute('position', new THREE.Float32BufferAttribute(planPts, 3));
  const planMat = new THREE.LineDashedMaterial({ color: dark ? '#8E80EE' : '#5B4BC4', dashSize: 0.4, gapSize: 0.25, transparent: true, opacity: 0.9 });
  const plan = new THREE.LineSegments(planGeo, planMat);
  plan.computeLineDistances();
  scene.add(plan);

  // ---------- Éléments qui se montent (apparition par phase) ----------
  const builds = [];
  const add = (obj, at, { grow = 'y' } = {}) => {
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    obj.userData.at = at;
    obj.userData.grow = grow;
    obj.userData.base = obj.scale.clone();
    if (!dark) addOutlines(obj, { color: '#2a2c31', opacity: 0.45 });
    builds.push(obj);
    scene.add(obj);
    return obj;
  };
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return m;
  };

  // scène et marches
  const platform = new THREE.Group();
  platform.add(box(18, 1, 5, clay, 0, 0.5, -6.5));
  platform.add(box(6, 0.5, 1, clay2, 0, 0.25, -3.5));
  add(platform, 0.05);

  // structure (truss) : poteaux + poutre, en éléments fins
  const trussMat = clay2;
  const post = (x) => {
    const g = new THREE.Group();
    for (const dx of [-0.2, 0.2]) for (const dz of [-0.2, 0.2]) g.add(box(0.08, 8, 0.08, trussMat, x + dx, 4, -8.5 + dz));
    for (let y = 0.5; y < 8; y += 0.8) g.add(box(0.5, 0.06, 0.06, trussMat, x, y, -8.3), box(0.5, 0.06, 0.06, trussMat, x, y, -8.7));
    return g;
  };
  add(post(-9), 0.16);
  add(post(9), 0.2);
  const beam = new THREE.Group();
  for (const dy of [7.8, 8.2]) for (const dz of [-8.3, -8.7]) beam.add(box(18.4, 0.08, 0.08, trussMat, 0, dy, dz));
  for (let x = -9; x <= 9; x += 0.8) beam.add(box(0.06, 0.4, 0.06, trussMat, x, 8, -8.3), box(0.06, 0.4, 0.06, trussMat, x, 8, -8.7));
  add(beam, 0.26, { grow: 'x' });

  // écran / mur LED en fond
  const screenMat = new THREE.MeshStandardMaterial({ color: dark ? '#1A1B20' : '#E6E3DC', roughness: 0.4, emissive: new THREE.Color(dark ? '#5B4BC4' : '#8E80EE'), emissiveIntensity: 0 });
  const screen = box(11, 5, 0.3, screenMat, 0, 4.2, -8.9);
  add(screen, 0.4);

  // projecteurs accrochés à la poutre
  const fixtures = [];
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.6, 16), dark ? clay2 : new THREE.MeshStandardMaterial({ color: '#3A3D44', roughness: 0.6 }));
    body.rotation.x = Math.PI / 2.6;
    f.add(body);
    f.position.set(-7.5 + i * 3, 7.5, -8.5);
    fixtures.push(add(f, 0.32 + i * 0.015));
  }

  // tables rondes + nappes + petits centres de table
  const tables = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const t = new THREE.Group();
    t.add(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 28), clay));
    t.children[0].position.y = 0.85;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8), clay2);
    leg.position.y = 0.42;
    t.add(leg);
    const deco = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), (i + j) % 2 ? violet : gold);
    deco.position.y = 1.05;
    t.add(deco);
    t.position.set(-6.5 + i * 4.2, 0, 1 + j * 3.6);
    tables.push(add(t, 0.5 + (i * 3 + j) * 0.012));
  }

  // arche décorative (déco) et plantes
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 12, 60, Math.PI), gold);
  arch.position.set(0, 1, 12);
  add(arch, 0.62);
  for (const x of [-10.5, 10.5]) {
    const plant = new THREE.Group();
    plant.add(box(0.8, 0.8, 0.8, clay2, 0, 0.4, 0));
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), new THREE.MeshStandardMaterial({ color: dark ? '#4E6B5A' : '#9DB8A6', roughness: 0.9, flatShading: true }));
    leaves.position.y = 1.5;
    plant.add(leaves);
    plant.position.set(x, 0, -3);
    add(plant, 0.66);
  }

  // régie
  const regie = new THREE.Group();
  regie.add(box(4, 1, 1.4, clay2, 0, 0.5, 14));
  const desk = box(3.6, 0.1, 1.2, violet, 0, 1.05, 14);
  desk.rotation.x = -0.25;
  regie.add(desk);
  add(regie, 0.45);

  // ---------- Équipe ----------
  const crew = [];
  const crate = () => box(0.6, 0.45, 0.45, gold, 0, 0, 0);
  const plank = () => box(0.12, 0.12, 1.6, clay2, 0, 0, 0);
  const crewDefs = [
    { from: [-12, 6], to: [-5, -3], carry: crate },
    { from: [12, 8], to: [6, -3], carry: crate },
    { from: [-4, 16], to: [-8, 2], carry: plank },
    { from: [4, 16], to: [8, 2], carry: plank },
    { from: [-14, -2], to: [-9.6, -6], carry: null },
    { from: [14, -2], to: [9.6, -6], carry: null },
    { from: [0, 10], to: [0, -2.8], carry: crate },
    { from: [-2, 14.8], to: [2, 14.8], carry: null },
  ];
  crewDefs.forEach((d, i) => {
    const p = makePerson(crewMat, i % 2 ? violet : gold, { carry: d.carry ? d.carry() : null });
    p.userData.path = d;
    p.userData.phase = i * 0.37;
    scene.add(p);
    crew.push(p);
  });
  // deux personnes avec plan / tablette au début
  const planners = [makePerson(crewMat, violet), makePerson(crewMat, gold)];
  planners[0].position.set(-1.2, 0, 4);
  planners[1].position.set(1.0, 0, 4.4);
  planners[0].rotation.y = 0.6;
  planners[1].rotation.y = -0.8;
  planners.forEach((p) => scene.add(p));

  // public (Jour J)
  const guests = [];
  const R = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  tables.forEach((t) => {
    for (let k = 0; k < 4; k++) {
      const g = makePerson(guestMat, R() > 0.5 ? clay2 : guestMat, { seated: true });
      const a = (k / 4) * Math.PI * 2 + 0.4;
      g.position.set(t.position.x + Math.cos(a) * 1.45, -0.35, t.position.z + Math.sin(a) * 1.45);
      g.rotation.y = -a - Math.PI / 2;
      g.scale.setScalar(0.001);
      g.userData.delay = R() * 0.6;
      guests.push(g);
      scene.add(g);
    }
  });
  // artiste sur scène
  const artist = makePerson(crewMat, violet);
  artist.position.set(0, 1, -6.2);
  artist.scale.setScalar(0.001);
  scene.add(artist);

  // ---------- Logo en relief (laque noire et or) suspendu au-dessus de la scène ----------
  const logo = buildEventsSolid(brandMaterials(), { dark });
  const logoPivot = new THREE.Group();
  logoPivot.add(logo);
  logoPivot.position.set(0, 9.7, -7.5);
  logoPivot.scale.setScalar(1.1);
  scene.add(logoPivot);

  // ---------- Lumières ----------
  const hemi = new THREE.HemisphereLight(dark ? '#9aa0b5' : '#ffffff', dark ? '#0b0c0e' : '#e8e4dc', dark ? 0.35 : 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffffff', dark ? 0.35 : 1.4);
  sun.position.set(-14, 24, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const spots = [];
  const beamMeshes = [];
  fixtures.forEach((f, i) => {
    const sp = new THREE.SpotLight(i % 2 ? '#A498F2' : '#F3D58E', 0, 30, 0.42, 0.55, 1.2);
    sp.position.copy(f.position);
    sp.target.position.set(-3 + i * 1.2, 0, -4 + (i % 3) * 3);
    scene.add(sp, sp.target);
    spots.push(sp);
    const len = sp.position.distanceTo(sp.target.position);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(Math.tan(0.42) * len, len, 32, 1, true).translate(0, -len / 2, 0),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: { uColor: { value: new THREE.Color(sp.color) }, uOpacity: { value: 0 } },
        vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying float vY; void main(){ gl_FragColor = vec4(uColor, pow(vY, 1.8) * uOpacity); }',
      })
    );
    cone.position.copy(sp.position);
    cone.lookAt(sp.target.position);
    cone.rotateX(-Math.PI / 2);
    scene.add(cone);
    beamMeshes.push(cone);
  });
  const work = new THREE.PointLight('#dfe8ff', 0, 40);
  work.position.set(0, 12, 6);
  scene.add(work);

  // ---------- Ligne de temps ----------
  // clés de caméra : [p, position, cible]
  const CAM = [
    [0.0, [20, 14, 30], [-8, 5, -3]],
    [0.3, [13, 9, 25], [-6, 4.5, -4]],
    [0.4, [0.01, 42, 3], [0, 0, 2]], // offre 1 : vue du dessus (plan de salle)
    [0.52, [-9, 3.2, 9], [2, 2, -2]], // offre 2 : à hauteur d'équipe
    [0.64, [0, 4.2, 20], [0, 4, -6]], // offre 3 : depuis la régie
    [0.76, [-14, 9, 20], [0, 3, -3]], // règles
    [1.0, [12, 8, 22], [0, 3.5, -4]],
  ];
  // ambiances : [p, travail, spectacle, écran]
  const LIGHT = [
    [0.0, 1, 0, 0], [0.28, 1, 0.2, 0], [0.34, 0.2, 1, 1], [0.4, 1, 0, 0], [0.6, 0.6, 0.6, 0.5], [0.66, 0.1, 1, 1],
    [0.74, 1, 0, 0], [0.82, 1, 0, 0], [0.86, 0.6, 0.5, 0.4], [0.92, 0.1, 1, 1], [1.0, 0.1, 1, 1],
  ];
  const sample = (keys, p) => {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1];
    const t = sm(a[0], b[0], p);
    return [a, b, t];
  };

  let target = 0, prog = 0;
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();

  const loop = runLoop(canvas, stage, (t, { px, py, reduce }) => {
    prog += ((reduce ? target : target) - prog) * (reduce ? 1 : 0.06);
    const intro = reduce ? 1 : Math.min(1, t / 3);
    // phase de montage : 0 (J-30) → 1 (Jour J) sur la première partie
    const phase = Math.max(sm(0, 0.3, prog), 0.12 * intro);

    builds.forEach((o) => {
      const k = sm(o.userData.at, o.userData.at + 0.08, phase);
      const b = o.userData.base;
      if (o.userData.grow === 'x') o.scale.set(Math.max(0.001, b.x * k), b.y, b.z);
      else o.scale.set(b.x, Math.max(0.001, b.y * k), b.z);
      o.visible = k > 0.002;
    });
    planMat.opacity = Math.max(0.15, 1 - phase * 1.4) * (prog > 0.36 && prog < 0.46 ? 1.6 : 1);

    // équipe : allers-retours tant que le montage n'est pas fini, puis vers la régie et les coulisses
    const busy = 1 - sm(0.82, 0.98, phase);
    crew.forEach((p, i) => {
      const d = p.userData.path;
      const cyc = (t * 0.05 + p.userData.phase) % 1;
      const u = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2;
      const x = lerp(d.from[0], d.to[0], u), z = lerp(d.from[1], d.to[1], u);
      const ex = i % 2 ? 13 : -13, ez = 10 + i;
      p.position.set(lerp(ex, x, busy), 0, lerp(ez, z, busy));
      p.rotation.y = Math.atan2(d.to[0] - d.from[0], d.to[1] - d.from[1]) + (cyc < 0.5 ? 0 : Math.PI);
      if (!reduce) animateWalk(p, t + i, 0.9);
    });
    planners.forEach((p, i) => {
      p.scale.setScalar(Math.max(0.001, 1 - sm(0.3, 0.45, phase)));
      p.userData.armR.rotation.x = -0.9 + Math.sin(t * 2 + i) * 0.1;
    });
    guests.forEach((g) => g.scale.setScalar(Math.max(0.001, sm(0.86 + g.userData.delay * 0.1, 0.96 + g.userData.delay * 0.1, phase))));
    const show = sm(0.9, 1, phase);
    artist.scale.setScalar(Math.max(0.001, show));
    if (show > 0.5 && !reduce) {
      artist.userData.armL.rotation.z = -1.2 + Math.sin(t * 3) * 0.3;
      artist.userData.armR.rotation.z = 1.2 - Math.sin(t * 3) * 0.3;
    }

    // lumières
    const [la, lb, lt] = sample(LIGHT, prog);
    const workI = lerp(la[1], lb[1], lt), showI = lerp(la[2], lb[2], lt) * sm(0.6, 0.9, phase), scr = lerp(la[3], lb[3], lt) * sm(0.6, 0.9, phase);
    sun.intensity = (dark ? 0.45 : 2.4) * (0.35 + 0.65 * workI);
    hemi.intensity = (dark ? 0.35 : 0.75) * (0.4 + 0.6 * workI);
    work.intensity = workI * (dark ? 40 : 10);
    spots.forEach((s, i) => {
      s.intensity = showI * (dark ? 260 : 160) * (0.85 + 0.15 * Math.sin(t * 1.3 + i));
      s.target.position.x = -3 + i * 1.2 + (reduce ? 0 : Math.sin(t * 0.5 + i) * 1.2);
    });
    beamMeshes.forEach((c, i) => {
      c.material.uniforms.uOpacity.value = showI * (dark ? 0.22 : 0.16);
      c.lookAt(spots[i].target.position);
      c.rotateX(-Math.PI / 2);
    });
    screenMat.emissiveIntensity = scr * (dark ? 1.2 : 0.8) * (0.85 + 0.15 * Math.sin(t * 2));

    // logo suspendu
    logoPivot.rotation.y = reduce ? 0 : Math.sin(t * 0.35) * 0.6;
    logoPivot.position.y = 9.7 + Math.sin(t * 0.8) * 0.12;
    // sur téléphone, le générique remonte par-dessus le logo à la fin du montage : le logo s'efface le temps du passage
    const narrowView = camera.aspect < 0.9;
    const pass = narrowView ? sm(0.29, 0.318, prog) * (1 - sm(0.36, 0.42, prog)) : 0;
    logoPivot.scale.setScalar(Math.max(0.001, 1.1 * (1 - pass)));

    // caméra
    const [ca, cb, ct] = sample(CAM, prog);
    camPos.set(lerp(ca[1][0], cb[1][0], ct), lerp(ca[1][1], cb[1][1], ct), lerp(ca[1][2], cb[1][2], ct));
    camTgt.set(lerp(ca[2][0], cb[2][0], ct), lerp(ca[2][1], cb[2][1], ct), lerp(ca[2][2], cb[2][2], ct));
    const narrow = camera.aspect < 0.9 ? 1.35 : 1;
    camera.position.set(camPos.x * narrow + px * 1.2, camPos.y * (narrow > 1 ? 1.1 : 1) - py * 0.8, camPos.z * narrow);
    // sur téléphone, le texte prend toute la largeur : on recentre la scène (et le logo) au lieu de la décaler
    if (narrow > 1) camTgt.x *= 0.25;
    camera.lookAt(camTgt);
  });

  return {
    setPaused: loop.setPaused,
    setProgress(p) {
      target = Math.max(0, Math.min(1, p));
      loop.redraw();
    },
    dispose: loop.dispose,
  };
}
