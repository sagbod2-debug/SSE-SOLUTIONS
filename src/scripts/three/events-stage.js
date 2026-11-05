// CC Events — hero : une scène événementielle filaire qui se construit au défilement
// (plateau, tours de structure, dôme, projecteurs puis flux de lumière) et le logo en chrome iridescent.
import { THREE, createStage, liquid, buildSvgLogo, runLoop, viewSize } from './common.js';
import logos from '../../data/logos-3d.json';

const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function chromeMaterials(timeU) {
  const silver = liquid(
    new THREE.MeshPhysicalMaterial({
      color: '#c9ccd6', metalness: 1, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05,
      iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [180, 820], envMapIntensity: 1.7,
    }),
    timeU, 0.012, 1.6
  );
  const gold = liquid(
    new THREE.MeshPhysicalMaterial({
      color: '#f1cf86', metalness: 1, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06,
      iridescence: 0.75, iridescenceIOR: 1.7, iridescenceThicknessRange: [250, 700], envMapIntensity: 1.6,
    }),
    timeU, 0.012, 1.6
  );
  return { noir: silver, or: gold, default: silver };
}

function lineObj(points, color, opacity, dark) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const mat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, toneMapped: false,
    blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const obj = new THREE.LineSegments(geo, mat);
  obj.userData.count = points.length / 3;
  geo.setDrawRange(0, 0);
  return obj;
}

export function mountEventsHero(canvas, { dark = false } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 18, fov: 32 });
  if (!stage) return null;
  const { scene, camera, timeU } = stage;

  const ink = new THREE.Color(dark ? '#cfd2da' : '#3a3d44');
  const violet = new THREE.Color(dark ? '#A498F2' : '#5B4BC4');
  const gold = new THREE.Color(dark ? '#E9C46E' : '#B98A3E');

  const world = new THREE.Group();
  scene.add(world);
  world.position.set(0, -0.6, -3);
  world.scale.setScalar(0.8);

  // --- Plateau et sol ---
  const floorPts = [];
  const R = 11;
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    floorPts.push(0, -2.4, 2, Math.cos(a) * R, -2.4, 2 - Math.sin(a) * R * 0.0 + Math.sin(a) * 6);
  }
  for (let r = 3; r <= R; r += 2) {
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * Math.PI, a1 = ((i + 1) / 24) * Math.PI;
      floorPts.push(Math.cos(a0) * r, -2.4, 2 + Math.sin(a0) * r * 0.55, Math.cos(a1) * r, -2.4, 2 + Math.sin(a1) * r * 0.55);
    }
  }
  const floor = lineObj(floorPts, ink, dark ? 0.3 : 0.28, dark);
  const platform = lineObj(
    Array.from(new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 0.5, 4.5)).translate(0, -2.15, -0.5).attributes.position.array),
    ink, dark ? 0.7 : 0.7, dark
  );
  world.add(floor, platform);

  // --- Tours de structure (treillis) ---
  const towerPts = [];
  const towers = [[-5.2, -2.6], [5.2, -2.6], [-5.2, 1.4], [5.2, 1.4]];
  const s = 0.32;
  towers.forEach(([x, z]) => {
    for (let y = -2.4; y < 3.6; y += 0.6) {
      const y2 = y + 0.6;
      const c = [[x - s, z - s], [x + s, z - s], [x + s, z + s], [x - s, z + s]];
      c.forEach(([cx, cz], k) => {
        const [nx, nz] = c[(k + 1) % 4];
        towerPts.push(cx, y, cz, cx, y2, cz); // montants
        towerPts.push(cx, y2, cz, nx, y2, nz); // ceinture
        towerPts.push(cx, y, cz, nx, y2, nz); // diagonale
      });
    }
  });
  // poutre de face entre les tours avant
  for (let x = -5.2; x < 5.2; x += 0.6) {
    const x2 = Math.min(5.2, x + 0.6);
    towerPts.push(x, 3.6, -2.6, x2, 3.6, -2.6, x, 3.2, -2.6, x2, 3.2, -2.6, x, 3.2, -2.6, x2, 3.6, -2.6);
    towerPts.push(x, 3.6, 1.4, x2, 3.6, 1.4, x, 3.2, 1.4, x2, 3.2, 1.4, x, 3.2, 1.4, x2, 3.6, 1.4);
  }
  const truss = lineObj(towerPts, ink, dark ? 0.55 : 0.5, dark);
  world.add(truss);

  // --- Dôme géodésique ---
  const ico = new THREE.IcosahedronGeometry(7.2, 2);
  const edges = new THREE.EdgesGeometry(ico);
  const ep = edges.attributes.position.array;
  const domePts = [];
  for (let i = 0; i < ep.length; i += 6) {
    if (ep[i + 1] > -0.4 && ep[i + 4] > -0.4) domePts.push(ep[i], ep[i + 1] * 0.8 + 1.0, ep[i + 2] - 0.6, ep[i + 3], ep[i + 4] * 0.8 + 1.0, ep[i + 5] - 0.6);
  }
  // tri par hauteur pour qu'il « pousse » du bas vers le haut
  const segs = [];
  for (let i = 0; i < domePts.length; i += 6) segs.push(domePts.slice(i, i + 6));
  segs.sort((a, b) => Math.min(a[1], a[4]) - Math.min(b[1], b[4]));
  const dome = lineObj(segs.flat(), violet, dark ? 0.5 : 0.45, dark);
  world.add(dome);
  ico.dispose();
  edges.dispose();

  // --- Projecteurs (cônes de lumière) ---
  const beamMat = (color) =>
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uColor: { value: color }, uOpacity: { value: 0 } },
      vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uOpacity; varying float vY; void main(){ float a = pow(vY, 1.6) * uOpacity; gl_FragColor = vec4(uColor, a); }',
    });
  const beams = [];
  const beamTargets = [[-2.5, -2.1, 0], [0, -2.1, -0.5], [2.5, -2.1, 0], [-1.2, -2.1, 0.8], [1.2, -2.1, 0.8], [0, -2.1, 1.2]];
  const beamOrigins = [[-4.6, 3.4, -2.6], [0, 3.4, -2.6], [4.6, 3.4, -2.6], [-4.6, 3.4, 1.4], [4.6, 3.4, 1.4], [0, 3.4, 1.4]];
  beamOrigins.forEach((o, i) => {
    const from = new THREE.Vector3(...o), to = new THREE.Vector3(...beamTargets[i]);
    const len = from.distanceTo(to);
    const geo = new THREE.ConeGeometry(0.9 + (i % 3) * 0.2, len, 40, 1, true);
    geo.translate(0, -len / 2, 0); // sommet à l'origine
    const m = new THREE.Mesh(geo, beamMat(i % 2 ? violet.clone() : gold.clone()));
    m.position.copy(from);
    m.lookAt(to);
    m.rotateX(-Math.PI / 2);
    m.userData.phase = i * 1.3;
    beams.push(m);
    world.add(m);
  });

  // --- Flux de particules (de la régie vers la scène) ---
  const N = 900;
  const pPos = new Float32Array(N * 3);
  const pSeed = new Float32Array(N);
  for (let i = 0; i < N; i++) pSeed[i] = Math.random();
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: dark ? '#F3E3B8' : '#7A6BD8', size: 0.06, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const particles = new THREE.Points(pGeo, pMat);
  world.add(particles);

  // --- Logo chrome iridescent ---
  const logo = buildSvgLogo(logos.events, chromeMaterials(timeU), { width: 6.2, depth: 0.32, bevel: 0.05 });
  const logoPivot = new THREE.Group();
  logoPivot.add(logo);
  scene.add(logoPivot);

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 6, 8);
  scene.add(key);

  let build = 0, target = 0, intro = 0, baseX = 0, baseY = 0;
  const parts = [
    [floor, 0.0, 0.18], [platform, 0.04, 0.2], [truss, 0.12, 0.42], [dome, 0.3, 0.66],
  ];

  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      intro = reduce ? 1 : Math.min(1, t / 2.8);
      const goal = reduce ? 1 : 0.36 * intro + 0.64 * target;
      build += (goal - build) * (reduce ? 1 : 0.08);

      parts.forEach(([obj, a, b]) => obj.geometry.setDrawRange(0, Math.floor(obj.userData.count * smooth(a, b, build))));

      const lightOn = smooth(0.55, 0.8, build);
      beams.forEach((m, i) => {
        const flick = 0.85 + 0.15 * Math.sin(t * 1.7 + m.userData.phase);
        m.material.uniforms.uOpacity.value = lightOn * (dark ? 0.32 : 0.16) * flick * smooth(0.55 + i * 0.03, 0.7 + i * 0.03, build);
        m.rotation.z = Math.sin(t * 0.4 + m.userData.phase) * 0.06;
      });

      const flow = smooth(0.7, 0.95, build);
      pMat.opacity = flow * (dark ? 0.9 : 0.7);
      if (flow > 0) {
        for (let i = 0; i < N; i++) {
          const k = i % beamOrigins.length;
          const o = beamOrigins[k], d = beamTargets[k];
          const u = (pSeed[i] + t * (0.08 + (i % 5) * 0.012)) % 1;
          const sw = Math.sin(u * Math.PI) * 0.6;
          pPos[i * 3] = o[0] + (d[0] - o[0]) * u + Math.sin(i * 12.9 + t) * 0.35 * sw;
          pPos[i * 3 + 1] = o[1] + (d[1] - o[1]) * u;
          pPos[i * 3 + 2] = o[2] + (d[2] - o[2]) * u + Math.cos(i * 7.3 + t) * 0.35 * sw;
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      world.rotation.y = -0.35 + px * 0.12 + build * 0.5 + (reduce ? 0 : Math.sin(t * 0.08) * 0.08);
      world.rotation.x = 0.18 + py * 0.05 - build * 0.06;

      const cyc = reduce ? 0 : (t % 16) / 16;
      const spin = cyc < 0.6 ? 0 : ((x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2))((cyc - 0.6) / 0.4) * Math.PI * 2;
      logoPivot.rotation.y = spin + px * 0.3;
      logoPivot.rotation.x = py * 0.15;
      logoPivot.position.set(baseX, baseY + Math.sin(t * 0.8) * 0.08 + target * 1.2, 0);
    },
    () => {
      const { vw, vh } = viewSize(camera);
      const wide = camera.aspect > 1.05;
      const sc = wide ? Math.min(1, (vw * 0.42) / 6.2) : Math.min(1, (vw * 0.82) / 6.2);
      logoPivot.scale.setScalar(sc);
      baseX = wide ? vw * 0.23 : 0;
      baseY = wide ? 0.2 : vh * 0.22;
      world.position.x = wide ? vw * 0.1 : 0;
      world.position.y = wide ? -0.2 : vh * 0.12;
    }
  );

  return {
    setBuild(p) {
      target = Math.max(0, Math.min(1, p));
      loop.redraw();
    },
    dispose: loop.dispose,
  };
}
