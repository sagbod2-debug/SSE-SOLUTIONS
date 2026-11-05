// Autonomie & Inclusion — carrousel 3D des domaines du programme.
// Chaque sphère de verre contient une petite matière animée propre à son domaine ;
// la sphère choisie grossit, s'avance et le reste passe en flou de profondeur (bokeh).
import { THREE, createStage, runLoop } from './common.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const COLORS = {
  quotidien: '#E8A25B',
  sante: '#5FA8D3',
  citoyennete: '#E9877A',
  prevention: '#D9534F',
  competences: '#7C6FD6',
  culture: '#C9A04A',
};

function gearShape(teeth = 10, r1 = 0.62, r2 = 0.8, hole = 0.25) {
  const s = new THREE.Shape();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 4 < 2 ? r2 : r1;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  const h = new THREE.Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

/** Petite matière intérieure par domaine. Renvoie { obj, tick(t) }. */
function innerFor(cat, color) {
  const c = new THREE.Color(color);
  const solid = (extra = {}) =>
    new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, metalness: 0.1, clearcoat: 1, emissive: c, emissiveIntensity: 0.18, ...extra });
  const g = new THREE.Group();

  if (cat === 'sante') {
    // flux d'eau claire : particules qui s'enroulent
    const N = 420;
    const pos = new Float32Array(N * 3);
    const seed = Array.from({ length: N }, () => Math.random());
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: c, size: 0.035, toneMapped: false }));
    g.add(pts);
    return {
      obj: g,
      tick(t) {
        for (let i = 0; i < N; i++) {
          const u = (seed[i] + t * 0.12) % 1;
          const a = u * Math.PI * 6 + seed[i] * 0.6;
          const r = 0.18 + 0.35 * Math.sin(u * Math.PI);
          pos[i * 3] = Math.cos(a) * r;
          pos[i * 3 + 1] = (u - 0.5) * 1.2;
          pos[i * 3 + 2] = Math.sin(a) * r;
        }
        geo.attributes.position.needsUpdate = true;
      },
    };
  }
  if (cat === 'competences') {
    // réseau géométrique (raisonnement, mathématiques)
    const ico = new THREE.IcosahedronGeometry(0.5, 1);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(ico), new THREE.LineBasicMaterial({ color: c, toneMapped: false }));
    const nodes = new THREE.Points(ico, new THREE.PointsMaterial({ color: c, size: 0.07, toneMapped: false }));
    g.add(wire, nodes);
    return { obj: g, tick(t) { g.rotation.y = t * 0.4; g.rotation.x = t * 0.25; } };
  }
  if (cat === 'culture') {
    // rouages (histoire, culture)
    const ext = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 };
    const a = new THREE.Mesh(new THREE.ExtrudeGeometry(gearShape(12, 0.36, 0.46, 0.12), ext), solid({ metalness: 0.8, roughness: 0.25 }));
    const b = new THREE.Mesh(new THREE.ExtrudeGeometry(gearShape(8, 0.22, 0.3, 0.08), ext), solid({ metalness: 0.8, roughness: 0.25 }));
    a.position.set(-0.17, 0.08, -0.06);
    b.position.set(0.42, -0.2, -0.06);
    g.add(a, b);
    return { obj: g, tick(t) { a.rotation.z = t * 0.5; b.rotation.z = -t * 0.5 * (12 / 8) + 0.2; g.rotation.y = Math.sin(t * 0.4) * 0.5; } };
  }
  if (cat === 'citoyennete') {
    // anneaux entrelacés (lien social)
    const mat = solid();
    for (let i = 0; i < 3; i++) {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 16, 64), mat);
      tor.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.2, Math.sin((i / 3) * Math.PI * 2) * 0.2, 0);
      tor.rotation.set(i * 0.9, i * 0.6, 0);
      g.add(tor);
    }
    return { obj: g, tick(t) { g.rotation.y = t * 0.35; g.rotation.z = t * 0.15; } };
  }
  if (cat === 'prevention') {
    // ondes de vigilance autour d'un noyau
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), solid());
    g.add(core);
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.012, 8, 80),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1, toneMapped: false })
      );
      rings.push(r);
      g.add(r);
    }
    return {
      obj: g,
      tick(t) {
        core.rotation.y = t * 0.8;
        rings.forEach((r, i) => {
          const u = (t * 0.35 + i / 3) % 1;
          r.scale.setScalar(0.6 + u * 1.2);
          r.material.opacity = 1 - u;
          r.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.3;
        });
      },
    };
  }
  // quotidien : feuillets et démarches qui s'empilent
  const mat = solid({ roughness: 0.5, emissiveIntensity: 0.1 });
  const pages = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.66, 0.025), mat);
    pages.push(p);
    g.add(p);
  }
  return {
    obj: g,
    tick(t) {
      pages.forEach((p, i) => {
        p.position.set(0, (i - 2) * 0.05, (i - 2) * 0.09);
        p.rotation.y = Math.sin(t * 0.6 + i * 0.5) * 0.5;
        p.rotation.x = -0.4;
      });
      g.rotation.y = t * 0.2;
    },
  };
}

export function mountAutonomieOrbs(canvas, { dark = false, domains = [], onSelect } = {}) {
  const stage = createStage(canvas, { background: dark ? '#16181B' : '#FFFFFF', z: 11, fov: 34 });
  if (!stage) return null;
  const { scene, camera, renderer } = stage;
  // sans correction de tonalité : le fond reste exactement de la couleur de la page après le post-traitement
  renderer.toneMapping = THREE.NoToneMapping;
  const bg = new THREE.Color(dark ? '#16181B' : '#FFFFFF');

  // décor léger derrière (opaque, pour la réfraction et le bokeh)
  const dots = [];
  for (let i = 0; i < 260; i++) dots.push((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 16, -6 - Math.random() * 8);
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: new THREE.Color(dark ? '#F2B36E' : '#C9A04A').lerp(bg, 0.35), size: 0.09, toneMapped: false })));

  const ring = new THREE.Group();
  scene.add(ring);
  const R = 4.4;
  const orbs = domains.map((d, i) => {
    const color = COLORS[d.cat] || '#C9A04A';
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', roughness: 0.05, transmission: 1, thickness: 0.6, ior: 1.45,
      iridescence: 0.3, iridescenceIOR: 1.3, clearcoat: 1, envMapIntensity: 1.2,
      attenuationColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.6), attenuationDistance: 3,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), glass);
    const inner = innerFor(d.cat, color);
    const holder = new THREE.Group();
    holder.add(orb, inner.obj);
    const a = (i / domains.length) * Math.PI * 2;
    holder.userData = { a, idx: i, inner, focus: 0 };
    orb.userData.idx = i;
    ring.add(holder);
    return holder;
  });

  // post-traitement : profondeur de champ
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 8, aperture: 0.004, maxblur: 0.01 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());
  stage.renderFrame = () => composer.render();

  let active = 0, angle = 0;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function onClick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(orbs.map((h) => h.children[0]), false)[0];
    if (hit) onSelect?.(hit.object.userData.idx);
  }
  canvas.addEventListener('click', onClick);

  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      const goal = -(active / domains.length) * Math.PI * 2;
      let diff = goal - angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      angle += diff * (reduce ? 1 : 0.07);
      orbs.forEach((h, i) => {
        const a = h.userData.a + angle + Math.PI / 2;
        h.userData.focus += ((i === active ? 1 : 0) - h.userData.focus) * (reduce ? 1 : 0.08);
        const f = h.userData.focus;
        h.position.set(Math.cos(a) * R, Math.sin(t * 0.8 + i) * 0.1 - 0.2, Math.sin(a) * R * 0.55 - 1.5 + f * 3.2);
        h.scale.setScalar(0.78 + f * 0.62);
        h.userData.inner.tick(t + i * 2);
      });
      ring.rotation.x = 0.12 + py * 0.06;
      ring.rotation.y = px * 0.12;
      const act = orbs[active];
      if (act) {
        const wp = new THREE.Vector3();
        act.getWorldPosition(wp);
        bokeh.uniforms.focus.value = camera.position.distanceTo(wp);
      }
    },
    (w, h) => composer.setSize(w, h)
  );

  return {
    setActive(i) {
      active = Math.max(0, Math.min(domains.length - 1, i));
      loop.redraw();
    },
    dispose() {
      canvas.removeEventListener('click', onClick);
      composer.dispose?.();
      bokeh.dispose?.();
      loop.dispose();
    },
  };
}
