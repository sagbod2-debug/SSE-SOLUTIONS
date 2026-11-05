// CC Care — « Le réseau humain » : constellation organique que la caméra traverse au défilement,
// logo en verre satiné aux tons chauds, et alvéoles 3D qui s'emboîtent pour les missions.
import { THREE, createStage, liquid, buildSvgLogo, runLoop, viewSize } from './common.js';
import logos from '../../data/logos-3d.json';

const WARM = {
  clair: ['#E8A25B', '#E9877A', '#E7A9B4', '#C9A04A', '#D97A5B'],
  sombre: ['#F2B36E', '#F49A8B', '#F2B8C2', '#E9C46E', '#EE9070'],
};

export function satinMaterials(timeU, dark) {
  const mk = (att, glow) =>
    liquid(
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.42, transmission: 1, thickness: 1.6, ior: 1.45,
        attenuationColor: new THREE.Color(att), attenuationDistance: 0.9,
        sheen: 1, sheenColor: new THREE.Color(glow), sheenRoughness: 0.5,
        clearcoat: 0.6, clearcoatRoughness: 0.35,
        emissive: new THREE.Color(glow), emissiveIntensity: dark ? 0.22 : 0.12, envMapIntensity: 1.1,
      }),
      timeU, 0.01, 1.4
    );
  return {
    bleu: mk('#E7A9B4', '#F6C7CF'), // quartz rose
    vert: mk('#E8A25B', '#F7C98F'), // ambre
    or: mk('#E9877A', '#F8B3A6'), // corail
    default: mk('#E8A25B', '#F7C98F'),
  };
}

function rand(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Hero : constellation + logo. setTravel(p) fait avancer la caméra (0 → 1). */
export function mountCareHero(canvas, { dark = false } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 16, fov: 34 });
  if (!stage) return null;
  const { scene, camera, timeU } = stage;
  const palette = WARM[dark ? 'sombre' : 'clair'].map((c) => new THREE.Color(c));
  const bg = new THREE.Color(dark ? '#0E0F11' : '#FFFFFF');

  // --- Constellation ---
  const R = rand(7);
  const N = 170;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    // nuage allongé dans la profondeur (la caméra le traverse)
    const z = -R() * 60 + 6;
    const a = R() * Math.PI * 2;
    const r = 2.5 + Math.pow(R(), 0.7) * 9;
    nodes.push(new THREE.Vector3(Math.cos(a) * r * 1.3, Math.sin(a) * r * 0.75, z));
  }
  const sizes = nodes.map(() => 0.06 + R() * 0.16);
  const inst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshPhysicalMaterial({ roughness: 0.35, transmission: 0.6, thickness: 0.5, clearcoat: 0.6, envMapIntensity: 1 }),
    N
  );
  const m4 = new THREE.Matrix4();
  nodes.forEach((p, i) => {
    m4.makeScale(sizes[i], sizes[i], sizes[i]).setPosition(p);
    inst.setMatrixAt(i, m4);
    inst.setColorAt(i, palette[i % palette.length]);
  });
  scene.add(inst);

  // liens vers les plus proches voisins, révélés progressivement pendant le voyage
  const links = [];
  nodes.forEach((p, i) => {
    const near = nodes
      .map((q, j) => [j, p.distanceToSquared(q)])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    near.forEach(([j, d]) => {
      if (j > i && d < 40) links.push([i, j]);
    });
  });
  links.sort((a, b) => nodes[b[0]].z + nodes[b[1]].z - (nodes[a[0]].z + nodes[a[1]].z)); // du proche au lointain
  const lp = new Float32Array(links.length * 6);
  const lc = new Float32Array(links.length * 6);
  links.forEach(([i, j], k) => {
    lp.set([nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z], k * 6);
    const c1 = palette[i % palette.length].clone().lerp(bg, dark ? 0.35 : 0.3);
    const c2 = palette[j % palette.length].clone().lerp(bg, dark ? 0.35 : 0.3);
    lc.set([c1.r, c1.g, c1.b, c2.r, c2.g, c2.b], k * 6);
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const linesObj = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
  lg.setDrawRange(0, 0);
  scene.add(linesObj);

  scene.fog = new THREE.Fog(bg, 14, 46);

  // --- Logo satiné ---
  const logo = buildSvgLogo(logos.care, satinMaterials(timeU, dark), { width: 5.2, depth: 0.42, bevel: 0.07, layerGap: 0.12 });
  const pivot = new THREE.Group();
  pivot.add(logo);
  scene.add(pivot);
  const warmLight = new THREE.PointLight(dark ? '#FFB27A' : '#FFC79A', dark ? 18 : 10, 12);
  warmLight.position.set(0, 0, 2.2);
  pivot.add(warmLight);

  let travel = 0, target = 0, intro = 0, baseX = 0, baseY = 0;
  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      intro = reduce ? 1 : Math.min(1, t / 2.5);
      travel += (target - travel) * (reduce ? 1 : 0.06);
      const reveal = reduce ? 1 : 0.3 * intro + 0.7 * travel;
      lg.setDrawRange(0, Math.floor(links.length * 2 * reveal));

      // la caméra avance dans la constellation ; le logo reste devant elle
      const camZ = 16 - travel * 34;
      camera.position.set(px * 0.6 + Math.sin(t * 0.1) * 0.4, -py * 0.4, camZ);
      camera.lookAt(px * 0.6, -py * 0.4, camZ - 16);
      pivot.position.set(baseX, baseY + Math.sin(t * 0.7) * 0.08, camZ - 16);
      pivot.rotation.y = Math.sin(t * 0.45) * 0.45 + px * 0.25;
      pivot.rotation.x = py * 0.12;
      inst.rotation.z = reduce ? 0 : t * 0.01;
      linesObj.rotation.z = inst.rotation.z;
    },
    () => {
      const { vw, vh } = viewSize(camera);
      const wide = camera.aspect > 1.05;
      pivot.scale.setScalar(wide ? Math.min(1, (vw * 0.4) / 5.2) : Math.min(1, (vw * 0.75) / 5.2));
      baseX = wide ? vw * 0.24 : 0;
      baseY = wide ? 0.1 : vh * 0.2;
    }
  );

  return {
    setTravel(p) {
      target = Math.max(0, Math.min(1, p));
      loop.redraw();
    },
    dispose: loop.dispose,
  };
}

/** Missions : alvéoles hexagonales en verre satiné qui s'emboîtent ; setAssemble(p) et setActive(i). */
export function mountCareCells(canvas, { dark = false, count = 4 } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 14, fov: 32 });
  if (!stage) return null;
  const { scene, timeU } = stage;
  const palette = WARM[dark ? 'sombre' : 'clair'];
  const bg = new THREE.Color(dark ? '#0E0F11' : '#FFFFFF');

  // fond : trame hexagonale très légère (opaque, pour la réfraction)
  const hexPts = [];
  const hr = 0.9;
  for (let q = -9; q <= 9; q++) {
    for (let r = -6; r <= 6; r++) {
      const cx = hr * 1.5 * q * 1.15, cy = hr * Math.sqrt(3) * (r + q / 2) * 1.15;
      for (let k = 0; k < 6; k++) {
        const a0 = (Math.PI / 3) * k, a1 = (Math.PI / 3) * (k + 1);
        hexPts.push(cx + Math.cos(a0) * hr, cy + Math.sin(a0) * hr, -3, cx + Math.cos(a1) * hr, cy + Math.sin(a1) * hr, -3);
      }
    }
  }
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.Float32BufferAttribute(hexPts, 3));
  const grid = new THREE.LineSegments(
    hg,
    new THREE.LineBasicMaterial({ color: new THREE.Color(palette[0]).lerp(bg, dark ? 0.8 : 0.82), toneMapped: false })
  );
  scene.add(grid);

  // alvéoles : une centrale (la personne) et des cellules qui viennent l'entourer
  const hexShape = (r) => {
    const s = new THREE.Shape();
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (k === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const hole = new THREE.Path();
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      const x = Math.cos(a) * r * 0.62, y = Math.sin(a) * r * 0.62;
      if (k === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    s.holes.push(hole);
    return s;
  };
  const cellGeo = new THREE.ExtrudeGeometry(hexShape(1), { depth: 0.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4 });
  cellGeo.center();
  const coreGeo = new THREE.SphereGeometry(0.42, 40, 30);

  const center = new THREE.Mesh(
    coreGeo,
    new THREE.MeshPhysicalMaterial({ color: palette[0], roughness: 0.3, clearcoat: 1, emissive: new THREE.Color(palette[0]), emissiveIntensity: 0.25 })
  );
  scene.add(center);

  // positions finales (anneau autour du centre) et positions de départ (dispersées)
  const ring = [];
  const d = Math.sqrt(3) * 1.04;
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    ring.push(new THREE.Vector3(Math.cos(a) * d, Math.sin(a) * d, 0));
  }
  const cells = [];
  const slots = [0, 2, 4, 1, 3, 5];
  const total = Math.max(count, 6);
  for (let i = 0; i < total; i++) {
    const mat = liquid(
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff', roughness: 0.38, transmission: 1, thickness: 1.2, ior: 1.45,
        attenuationColor: new THREE.Color(palette[i % palette.length]), attenuationDistance: 1.1,
        sheen: 1, sheenColor: new THREE.Color(palette[i % palette.length]), clearcoat: 0.5, envMapIntensity: 1.1,
        emissive: new THREE.Color(palette[i % palette.length]), emissiveIntensity: 0,
      }),
      timeU, 0.008, 1.5
    );
    const mesh = new THREE.Mesh(cellGeo, mat);
    const end = ring[slots[i]];
    const a = Math.atan2(end.y, end.x);
    const start = new THREE.Vector3(Math.cos(a) * 9, Math.sin(a) * 6, -4 + (i % 2) * 3);
    mesh.userData = { end, start, lift: 0, mission: i < count };
    scene.add(mesh);
    cells.push(mesh);
  }
  let assemble = 0, target = 0, active = -1, scale = 1;
  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      assemble += ((reduce ? 1 : target) - assemble) * (reduce ? 1 : 0.07);
      cells.forEach((m, i) => {
        const k = Math.max(0, Math.min(1, assemble * 1.6 - i * 0.12));
        const e = 1 - Math.pow(1 - k, 3);
        m.position.lerpVectors(m.userData.start, m.userData.end, e).multiplyScalar(scale);
        m.userData.lift += ((i === active ? 1 : 0) - m.userData.lift) * 0.08;
        m.position.z += m.userData.lift * 0.9;
        m.scale.setScalar(scale * (1 + m.userData.lift * 0.12));
        m.rotation.z = (1 - e) * (i % 2 ? 1.2 : -1.2) + Math.sin(t * 0.6 + i) * 0.03;
        m.rotation.x = (1 - e) * 0.8 + py * 0.15;
        m.rotation.y = px * 0.2;
        m.material.emissiveIntensity = m.userData.lift * (dark ? 0.35 : 0.2);
      });
      center.scale.setScalar(scale * (1 + Math.sin(t * 1.6) * 0.04));
      grid.rotation.z = t * 0.01;
    },
    () => {
      const { vw, vh } = viewSize(stage.camera);
      scale = Math.min(1.25, Math.min(vw, vh) / 7.2);
    }
  );

  return {
    setAssemble(p) {
      target = Math.max(0, Math.min(1, p));
      loop.redraw();
    },
    setActive(i) {
      active = i;
      loop.redraw();
    },
    dispose: loop.dispose,
  };
}
