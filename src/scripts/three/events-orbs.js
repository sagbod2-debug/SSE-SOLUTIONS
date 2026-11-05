// CC Events — offres : trois sphères de verre reliées au logo par des lignes d'énergie.
// La sphère de l'offre active grossit et projette un faisceau sur sa carte ;
// le survol d'une carte déclenche une dispersion prismatique sur la sphère.
import { THREE, createStage, buildSvgLogo, runLoop, viewSize } from './common.js';
import { chromeMaterials } from './events-stage.js';
import logos from '../../data/logos-3d.json';

export function mountEventsOrbs(canvas, { dark = false, count = 3 } = {}) {
  const stage = createStage(canvas, { background: dark ? '#0E0F11' : '#FFFFFF', z: 16, fov: 32 });
  if (!stage) return null;
  const { scene, camera, timeU } = stage;

  const violet = new THREE.Color(dark ? '#A498F2' : '#5B4BC4');
  const gold = new THREE.Color(dark ? '#E9C46E' : '#C79A3E');
  const tints = [gold, violet, new THREE.Color(dark ? '#F09AC4' : '#C2508A')];

  const logo = buildSvgLogo(logos.events, chromeMaterials(timeU), { width: 3.4, depth: 0.26, bevel: 0.04 });
  const logoPivot = new THREE.Group();
  logoPivot.add(logo);
  scene.add(logoPivot);

  // Fond : faisceaux et arcs de scène très légers (opaques, pour que le verre ait quelque chose à réfracter)
  const bg = new THREE.Color(dark ? '#0E0F11' : '#FFFFFF');
  const rays = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    rays.push(0, 3, -4, Math.cos(a) * 30, 3 + Math.sin(a) * 30, -4);
  }
  for (let r = 3; r < 22; r += 2.2) {
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2;
      rays.push(Math.cos(a0) * r, 3 + Math.sin(a0) * r, -4, Math.cos(a1) * r, 3 + Math.sin(a1) * r, -4);
    }
  }
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.Float32BufferAttribute(rays, 3));
  const rayCol = [];
  for (let i = 0; i < rays.length / 3; i++) {
    const c = (i % 3 === 0 ? violet : i % 3 === 1 ? gold : new THREE.Color(dark ? '#8a8f99' : '#9aa0aa')).clone().lerp(bg, dark ? 0.72 : 0.78);
    rayCol.push(c.r, c.g, c.b);
  }
  rayGeo.setAttribute('color', new THREE.Float32BufferAttribute(rayCol, 3));
  const backdrop = new THREE.LineSegments(rayGeo, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
  scene.add(backdrop);

  const orbs = [];
  for (let i = 0; i < count; i++) {
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.9, ior: 1.52,
      iridescence: 0.5, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 600],
      clearcoat: 1, clearcoatRoughness: 0.03, dispersion: 1, envMapIntensity: 1.4,
      attenuationColor: tints[i].clone().lerp(new THREE.Color('#ffffff'), 0.35), attenuationDistance: 2.2,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.85, 64, 48), glass);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 32, 24),
      new THREE.MeshBasicMaterial({ color: tints[i], toneMapped: false })
    );
    orb.add(core);

    // faisceau « spotlight » vers la carte
    const beamGeo = new THREE.ConeGeometry(1.6, 6, 48, 1, true);
    beamGeo.translate(0, -3, 0);
    const beam = new THREE.Mesh(
      beamGeo,
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: { uColor: { value: tints[i].clone() }, uOpacity: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; void main(){ float edge = 1.0 - abs(vUv.x - 0.5) * 2.0; float a = pow(vUv.y, 1.3) * uOpacity * (0.55 + 0.45 * edge); gl_FragColor = vec4(uColor, a); }',
      })
    );
    const group = new THREE.Group();
    group.add(orb, beam);
    scene.add(group);

    // ligne d'énergie logo → sphère
    const lineMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false,
      blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uColor: { value: tints[i].clone() }, uTime: timeU, uOn: { value: 0.35 } },
      vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'uniform vec3 uColor; uniform float uTime; uniform float uOn; varying float vU; void main(){ float pulse = smoothstep(0.0, 0.08, fract(vU - uTime * 0.35)) * (1.0 - smoothstep(0.08, 0.22, fract(vU - uTime * 0.35))); gl_FragColor = vec4(uColor, (0.25 + pulse * 0.9) * uOn); }',
    });
    const tube = new THREE.Mesh(new THREE.BufferGeometry(), lineMat);
    scene.add(tube);

    orbs.push({ group, orb, core, beam, tube, glass, scale: 1, focus: 0, hover: 0, hoverT: 0, x: 0, y: 0 });
  }

  let active = -1;
  let logoY = 2.6;

  function rebuildTubes() {
    orbs.forEach((o) => {
      const a = new THREE.Vector3(0, logoY - 0.9, 0);
      const b = new THREE.Vector3(o.x, o.y + 0.85, 0);
      const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.6, 0.6);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      o.tube.geometry.dispose();
      o.tube.geometry = new THREE.TubeGeometry(curve, 64, 0.025, 8, false);
    });
  }

  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py }) => {
      logoPivot.rotation.y = Math.sin(t * 0.5) * 0.35 + px * 0.3;
      backdrop.rotation.z = t * 0.02;
      logoPivot.rotation.x = py * 0.12;
      orbs.forEach((o, i) => {
        const on = i === active ? 1 : 0;
        o.focus += (on - o.focus) * 0.07;
        o.hover += (o.hoverT - o.hover) * 0.08;
        o.scale += ((1 + o.focus * 0.28 + o.hover * 0.06) - o.scale) * 0.1;
        o.group.position.set(o.x, o.y + Math.sin(t * 0.9 + i * 1.7) * 0.08, 0);
        o.orb.scale.setScalar(o.scale);
        o.orb.rotation.y = t * 0.2 + i;
        o.glass.dispersion = 1 + o.hover * 9;
        o.glass.iridescence = 0.5 + o.hover * 0.5;
        o.glass.iridescenceThicknessRange = [100 + o.hover * 200, 600 + Math.sin(t * 2) * 150 * o.hover];
        o.core.scale.setScalar(0.8 + o.focus * 0.6 + Math.sin(t * 2.4 + i) * 0.04);
        o.beam.material.uniforms.uOpacity.value = o.focus * (dark ? 0.38 : 0.2);
        o.tube.material.uniforms.uOn.value = 0.35 + o.focus * 0.65;
      });
    },
    () => {
      const { vw, vh } = viewSize(camera);
      const wide = camera.aspect > 1;
      const spread = wide ? vw / 3 : vw * 0.3;
      logoY = vh * (wide ? 0.32 : 0.3);
      logoPivot.position.set(0, logoY, 0);
      logoPivot.scale.setScalar(Math.min(1, (vw * 0.5) / 3.4));
      orbs.forEach((o, i) => {
        o.x = (i - (count - 1) / 2) * spread;
        o.y = wide ? vh * 0.02 : -vh * 0.12;
        const s = wide ? 1 : Math.min(1, vw / 9);
        o.group.scale.setScalar(s);
        o.beam.scale.set(1, (vh * 0.5 + o.y) / 6 / s, 1);
      });
      rebuildTubes();
    }
  );

  return {
    setActive(i) {
      active = i;
      loop.redraw();
    },
    setHover(i, on) {
      if (orbs[i]) orbs[i].hoverT = on ? 1 : 0;
      loop.redraw();
    },
    dispose: loop.dispose,
  };
}
