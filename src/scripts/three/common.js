// Outils Three.js partagés par les pages d'activité (rendu, environnement, logos en relief, boucle).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export { THREE };

export const prefersReducedMotion = () =>
  !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const isDarkTheme = () => document.documentElement.getAttribute('data-theme') === 'dark';

/** Rendu WebGL + environnement studio. Renvoie null si WebGL est indisponible. */
export function createStage(canvas, { background = null, fov = 30, z = 16, exposure = 1.05 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !background, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (!background) renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 300);
  camera.position.set(0, 0, z);

  const timeU = { value: 0 };

  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { renderer, scene, camera, timeU, dispose };
}

/** Ondulation « liquide » douce appliquée aux sommets d'un matériau. */
export function liquid(material, timeU, amp = 0.03, freq = 2.0) {
  material.onBeforeCompile = (s) => {
    s.uniforms.uTime = timeU;
    s.vertexShader =
      'uniform float uTime;\n' +
      s.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
  transformed += objectNormal * (sin(position.y * ${freq.toFixed(2)} + uTime * 1.3) * cos(position.x * ${(freq * 0.8).toFixed(2)} - uTime * 0.9) * ${amp.toFixed(3)});`
      );
  };
  return material;
}

/**
 * Logo en relief à partir de tracés vectoriels (src/data/logos-3d.json).
 * materials : { [idCalque]: Material } ; le groupe est centré et mis à la largeur `width`.
 */
export function buildSvgLogo(data, materials, { width = 5, depth = 0.35, bevel = 0.05, layerGap = 0.08 } = {}) {
  const loader = new SVGLoader();
  const group = new THREE.Group();
  const scale = width / data.w;
  data.layers.forEach((layer, li) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${data.w} ${data.h}"><path d="${layer.d}" fill="#000" fill-rule="evenodd"/></svg>`;
    const parsed = loader.parse(svg);
    const shapes = [];
    parsed.paths.forEach((p) => shapes.push(...SVGLoader.createShapes(p)));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: depth / scale,
      bevelEnabled: true,
      bevelThickness: bevel / scale,
      bevelSize: (bevel * 0.7) / scale,
      bevelSegments: 4,
      curveSegments: 6,
    });
    geo.scale(scale, -scale, scale);
    geo.translate(-width / 2, (data.h * scale) / 2, li * layerGap - (depth / 2));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, materials[layer.id] || materials.default);
    mesh.userData.layer = layer.id;
    group.add(mesh);
  });
  return group;
}

/**
 * Boucle de rendu : taille, pointeur lissé, pause hors écran, mouvement réduit.
 * onFrame(t, { px, py }) est appelé à chaque image.
 */
export function runLoop(canvas, stage, onFrame, onResize) {
  const reduce = prefersReducedMotion();
  let raf = 0;
  let running = true;
  let ptrX = 0, ptrY = 0, px = 0, py = 0;
  const clock = new THREE.Clock();

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    stage.renderer.setSize(w, h, false);
    stage.camera.aspect = w / h;
    stage.camera.updateProjectionMatrix();
    if (onResize) onResize(w, h);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    ptrX = ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1;
    ptrY = ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });

  function frame() {
    raf = 0;
    if (!running) return;
    const t = reduce ? 0 : clock.getElapsedTime();
    stage.timeU.value = t;
    px += (ptrX - px) * 0.05;
    py += (ptrY - py) * 0.05;
    onFrame(t, { px, py, reduce });
    if (stage.renderFrame) stage.renderFrame();
    else stage.renderer.render(stage.scene, stage.camera);
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  let visible = true, paused = false;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    running = visible && !paused;
    if (running && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(canvas);
  raf = requestAnimationFrame(frame);

  return {
    /** Met la boucle en pause (scène hors champ, par exemple derrière un bloc opaque). */
    setPaused(v) {
      paused = !!v;
      running = visible && !paused;
      if (running && !raf) raf = requestAnimationFrame(frame);
    },
    /** Redessine une image (utile en mouvement réduit quand l'état change). */
    redraw() {
      if (!raf && running) raf = requestAnimationFrame(frame);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      stage.dispose();
    },
  };
}

/** Taille visible (en unités monde) à la profondeur z=0. */
export function viewSize(camera) {
  const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  return { vw: vh * camera.aspect, vh };
}
