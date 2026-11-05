import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import fontData from '../../data/cc-consulting-3d-font.json';

const font = new Font(fontData);

/**
 * Hero 3D CC Consulting : plan de bâtiment sur 3 niveaux (vue éclatée au défilement)
 * et monogramme « CC » (ou mot « CC CONSULTING ») en verre liquide.
 */
export function mountHeroScene(canvas, opts = {}) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const BG = new THREE.Color(opts.background || '#ffffff');
  scene.background = BG;
  const isDark = (BG.r + BG.g + BG.b) / 3 < 0.5;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  camera.position.set(0, 0, 16);

  const timeU = { value: 0 };

  // ---------- Plan de bâtiment (3 niveaux) ----------
  const accent = new THREE.Color(opts.accent || '#b4232a');
  const gold = new THREE.Color('#b98a4e');
  const graphite = new THREE.Color('#5b6068');
  const tint = (c, k) => c.clone().lerp(BG, k);

  const plan = new THREE.Group();
  scene.add(plan);
  const floors = [];

  function floorLines(level) {
    const W = 10, D = 6.4, segs = [];
    const add = (x1, z1, x2, z2) => segs.push(x1, 0, z1, x2, 0, z2);
    const rect = (x, z, w, d) => { add(x, z, x + w, z); add(x + w, z, x + w, z + d); add(x + w, z + d, x, z + d); add(x, z + d, x, z); };
    const hw = W / 2, hd = D / 2;
    rect(-hw, -hd, W, D);
    // couloir central
    const c1 = -0.55, c2 = 0.55;
    const rooms = level === 0 ? [-5, -2.6, -0.6, 1.6, 3.2, 5] : level === 1 ? [-5, -3.4, -1.8, 0.2, 2.2, 3.6, 5] : [-5, -1.8, 1.4, 5];
    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i], b = rooms[i + 1];
      // mur côté couloir avec porte
      const door = 0.42, mid = (a + b) / 2;
      add(a, c1, mid - door, c1); add(mid + door, c1, b, c1);
      add(a, c2, mid - door + 0.3, c2); add(mid + door + 0.3, c2, b, c2);
      if (i > 0) { add(a, -hd, a, c1); add(a, c2, a, hd); }
    }
    // escaliers / cage protégée
    rect(-4.6, -2.8, 1.1, 1.6);
    for (let k = 1; k < 6; k++) add(-4.6, -2.8 + k * 0.27, -3.5, -2.8 + k * 0.27);
    rect(3.6, 1.3, 1.0, 1.5);
    for (let k = 1; k < 6; k++) add(3.6, 1.3 + k * 0.25, 4.6, 1.3 + k * 0.25);
    return new Float32Array(segs);
  }

  function colorize(pos) {
    const col = new Float32Array(pos.length);
    const c = new THREE.Color();
    for (let i = 0; i < pos.length; i += 3) {
      const t = (pos[i] + 5) / 10;
      if (t < 0.5) c.copy(accent).lerp(graphite, t * 2); else c.copy(graphite).lerp(gold, (t - 0.5) * 2);
      c.lerp(BG, isDark ? 0.58 : 0.4);
      col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b;
    }
    return col;
  }

  for (let l = 0; l < 3; l++) {
    const g = new THREE.Group();
    const pos = floorLines(l);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorize(pos), 3));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false })));

    // dalle très légère
    const slab = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6.4),
      new THREE.MeshBasicMaterial({ color: tint(l === 1 ? accent : graphite, 0.93), transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
    );
    slab.rotation.x = -Math.PI / 2; slab.position.y = -0.01;
    g.add(slab);

    // chemin d'évacuation en pointillés
    const pts = [new THREE.Vector3(4.4, 0.02, 0), new THREE.Vector3(-3.4, 0.02, 0), new THREE.Vector3(-4.05, 0.02, -1.2)];
    const ev = new THREE.BufferGeometry().setFromPoints(pts);
    const evLine = new THREE.Line(ev, new THREE.LineDashedMaterial({ color: tint(l === 0 ? new THREE.Color('#2f8f5b') : accent, 0.35), dashSize: 0.18, gapSize: 0.14, toneMapped: false }));
    evLine.computeLineDistances();
    g.add(evLine);

    // équipements : points pulsants
    const eq = [];
    for (let k = 0; k < 7; k++) eq.push((Math.sin(k * 12.9 + l * 3.1) * 0.5) * 9, 0.03, (Math.cos(k * 7.3 + l) * 0.5) * 5.6);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(eq), 3));
    const pm = new THREE.PointsMaterial({ color: accent, size: 0.16, sizeAttenuation: true, toneMapped: false });
    g.add(new THREE.Points(pg, pm));

    g.userData.baseY = (l - 1) * 1.55;
    g.position.y = g.userData.baseY;
    plan.add(g);
    floors.push({ g, pm });
  }
  // colonnes verticales reliant les niveaux
  {
    const v = [];
    for (const [x, z] of [[-5, -3.2], [5, -3.2], [5, 3.2], [-5, 3.2]]) v.push(x, -1.55, z, x, 1.55, z);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3));
    const cols = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({ color: tint(graphite, 0.72), dashSize: 0.12, gapSize: 0.12, toneMapped: false }));
    cols.computeLineDistances();
    plan.add(cols);
    floors.cols = cols;
  }
  plan.rotation.set(0.82, -0.55, 0);
  plan.position.set(0, -0.6, -5);
  plan.scale.setScalar(1.05);

  // ---------- Verre liquide ----------
  function glass(att, attDist = 2.6) {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 1.1, ior: 1.42,
      attenuationColor: new THREE.Color(att), attenuationDistance: attDist,
      clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.4, iridescenceIOR: 1.25,
      iridescenceThicknessRange: [120, 420], specularIntensity: 1, envMapIntensity: 1.35, dispersion: 4
    });
    m.onBeforeCompile = (s) => {
      s.uniforms.uTime = timeU;
      s.vertexShader = 'uniform float uTime;\n' + s.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  transformed += objectNormal * (sin(position.y * 2.1 + uTime * 1.3) * cos(position.x * 1.6 - uTime * 0.9) * 0.03);'
      );
    };
    return m;
  }
  const glassLight = glass('#f2f4f7', 6);
  const glassDark = glass('#aab1b9', 3);
  const glassGold = glass('#c9a06a', 1.2);

  const extrude = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 10, curveSegments: 120 };

  function cShape(R, r, gap) {
    const s = new THREE.Shape();
    const a0 = gap, a1 = Math.PI * 2 - gap;
    s.absarc(0, 0, R, a0, a1, false);
    s.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    s.absarc(0, 0, r, a1, a0, true);
    s.closePath();
    return s;
  }

  const logo = new THREE.Group();
  {
    const g1 = new THREE.ExtrudeGeometry(cShape(1.9, 1.42, 0.72), extrude); g1.center();
    const c1 = new THREE.Mesh(g1, glassLight); c1.position.set(-0.78, 0, 0.12);
    const g2 = new THREE.ExtrudeGeometry(cShape(1.9, 1.42, 0.72), extrude); g2.center();
    const c2 = new THREE.Mesh(g2, glassDark); c2.position.set(0.98, 0, -0.12);
    // chevron (toit) dans le second C
    const ch = new THREE.Shape();
    ch.moveTo(-0.95, -0.55); ch.lineTo(0.1, 0.62); ch.lineTo(1.1, -0.55); ch.lineTo(0.62, -0.55); ch.lineTo(0.1, 0.05); ch.lineTo(-0.47, -0.55); ch.closePath();
    const gch = new THREE.ExtrudeGeometry(ch, { ...extrude, depth: 0.42, curveSegments: 8 }); gch.center();
    const chev = new THREE.Mesh(gch, glassGold); chev.position.set(1.2, -0.18, 0.15);
    logo.add(c1, c2, chev);
  }

  const wordmark = new THREE.Group();
  let wordmarkBuilt = false;
  function buildWordmark() {
    if (wordmarkBuilt) return; wordmarkBuilt = true;
    const letters = (str, size, mat, spacing) => {
      const grp = new THREE.Group(); let x = 0;
      const scale = size / font.data.resolution;
      for (const ch of str) {
        const glyph = font.data.glyphs[ch];
        if (ch !== ' ') {
          const shapes = font.generateShapes(ch, size);
          const geo = new THREE.ExtrudeGeometry(shapes, { depth: size * 0.32, bevelEnabled: true, bevelThickness: size * 0.07, bevelSize: size * 0.045, bevelSegments: 5, curveSegments: 24 });
          const m = new THREE.Mesh(geo, mat); m.position.x = x; grp.add(m);
        }
        x += glyph.ha * scale + spacing;
      }
      const w = x - spacing;
      grp.children.forEach((m) => { m.position.x -= w / 2; });
      grp.userData.w = w;
      return grp;
    };
    const cc = letters('CC', 2.5, glassLight, 0.05);
    cc.position.y = 0.2;
    cc.children[1].material = glassDark;
    // centrer verticalement la hauteur de capitale
    cc.children.forEach((m) => { m.position.y -= 0.9; });
    const sub = letters('CONSULTING', 0.46, glassDark, 0.2);
    sub.position.y = -1.55;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.06), glassGold);
    bar.position.y = -2.05;
    wordmark.add(cc, sub, bar);
  }
  wordmark.visible = false;

  const hero = new THREE.Group();
  hero.add(logo, wordmark);
  scene.add(hero);

  // lumière d'appoint (reflets)
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 6, 8); scene.add(key);

  // ---------- état ----------
  let mode = opts.mode || 'logo';
  let scrollP = 0, ptrX = 0, ptrY = 0, tx = 0, ty = 0;
  let w = 1, h = 1, running = true, raf = 0, baseY = 0.1;

  function setMode(m) { mode = m; if (m === 'texte') buildWordmark(); logo.visible = m !== 'texte'; wordmark.visible = m === 'texte'; layout(); }
  function layout() {
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const vw = vh * camera.aspect;
    const wide = camera.aspect > 1.05;
    const obj = mode === 'texte' ? wordmark : logo;
    const objW = mode === 'texte' ? 5.6 : 5.6;
    let s = wide ? Math.min(1, (vw * 0.42) / objW) : Math.min(1, (vw * 0.8) / objW);
    hero.scale.setScalar(s);
    baseY = wide ? 0.1 : vh * 0.2;
    hero.position.set(wide ? vw * 0.24 : 0, baseY, 0);
    plan.position.x = wide ? vw * 0.12 : 0;
    obj.position.set(0, 0, 0);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    layout();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  resize();
  setMode(mode);

  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    ptrX = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptrY = ((e.clientY - r.top) / r.height) * 2 - 1;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });

  const io = new IntersectionObserver((en) => { running = en[0].isIntersecting; if (running && !raf) loop(); }, { threshold: 0 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function loop() {
    raf = 0;
    if (!running) return;
    const t = clock.getElapsedTime();
    timeU.value = reduce ? 0 : t;
    tx += (ptrX - tx) * 0.05; ty += (ptrY - ty) * 0.05;

    // rotation : un tour complet toutes les 14 s, avec une pause de face
    const cyc = reduce ? 0 : ((t % 14) / 14);
    const spin = cyc < 0.55 ? 0 : ease((cyc - 0.55) / 0.45) * Math.PI * 2;
    hero.rotation.y = spin + tx * 0.35 + scrollP * 0.8;
    hero.rotation.x = ty * 0.18 - scrollP * 0.25;
    hero.position.y += (baseY + Math.sin(t * 0.8) * 0.08 + scrollP * 1.6 - hero.position.y) * 0.08;

    // plan : rotation lente + éclatement au défilement
    plan.rotation.y = -0.55 + (reduce ? 0 : t * 0.05) + tx * 0.08;
    floors.forEach((f, i) => {
      f.g.position.y = f.g.userData.baseY * (1 + scrollP * 1.4);
      f.pm.size = 0.14 + 0.08 * Math.max(0, Math.sin(t * 2.2 + i * 1.7));
    });
    floors.cols.scale.y = 1 + scrollP * 1.4;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  loop();

  return {
    setMode,
    setScroll(p) { scrollP = Math.max(0, Math.min(1, p)); },
    setAccent(hex) { accent.set(hex); },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      if (scene.environment) scene.environment.dispose();
      renderer.dispose(); pmrem.dispose();
    }
  };
}

