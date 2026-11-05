// Présentoir d'un logo en relief, avec trois effets de lumière au choix :
// « balayage » (un reflet traverse le métal), « studio » (lumière douce, liserés colorés),
// « projecteur » (un faisceau tourne autour du logo).
import { THREE, createStage, runLoop, viewSize } from './common.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { brandMaterials, SOLID_LOGOS } from './logos-solid.js';

let rectInit = false;

export function mountLogoShowcase(canvas, { logo = 'cc-consulting', dark = false, preset = 'balayage', interactive = true } = {}) {
  if (!rectInit) {
    RectAreaLightUniformsLib.init();
    rectInit = true;
  }
  const bg = dark ? '#0E0F11' : '#FFFFFF';
  const stage = createStage(canvas, { background: bg, z: 14, fov: 30, exposure: dark ? 1.0 : 1.0 });
  if (!stage) return null;
  const { scene, camera, renderer } = stage;
  // caméra légèrement au-dessus : l'ombre au sol se lit comme une tache douce
  camera.position.set(0, 2.2, 14);
  camera.lookAt(0, 0, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const def = SOLID_LOGOS[logo] || SOLID_LOGOS['cc-consulting'];
  const mats = brandMaterials();
  const obj = def.build(mats);
  obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const pivot = new THREE.Group();
  pivot.add(obj);
  scene.add(pivot);

  // ombre portée douce sous le logo (seule l'ombre s'imprime sur le fond)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: dark ? '#000000' : '#1d2026', opacity: dark ? 0.5 : 0.14 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const key = new THREE.DirectionalLight('#ffffff', 1.4);
  key.position.set(3, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  key.shadow.radius = 6;
  scene.add(key);

  // barre de lumière qui balaie le logo
  const sweep = new THREE.RectAreaLight('#ffffff', 0, 1.2, 9);
  sweep.position.set(-8, 0, 4);
  sweep.lookAt(0, 0, 0);
  scene.add(sweep);

  // liserés colorés (studio)
  const rimA = new THREE.PointLight(dark ? '#7f9cff' : '#9fb4ff', 0, 30);
  const rimB = new THREE.PointLight('#ffcf8a', 0, 30);
  rimA.position.set(-6, 3, -3);
  rimB.position.set(6, -1, -3);
  scene.add(rimA, rimB);

  // projecteur qui tourne
  const spot = new THREE.SpotLight('#ffffff', 0, 40, 0.32, 0.6, 1);
  spot.position.set(0, 6, 9);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = true;
  scene.add(spot, spot.target);

  // halo léger sur les reflets les plus forts (fond sombre seulement : sur blanc, il voilerait l'image)
  let composer = null;
  if (dark) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.38, 0.35, 0.86));
    composer.addPass(new OutputPass());
    stage.renderFrame = () => composer.render();
  }

  let mode = preset, floorY = -2;
  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      const tt = reduce ? 0 : t;
      // présentation : lente oscillation + regard vers la souris
      pivot.rotation.y = Math.sin(tt * 0.45) * 0.42 + (interactive ? px * 0.35 : 0);
      pivot.rotation.x = interactive ? py * 0.12 : 0;
      pivot.position.y = Math.sin(tt * 0.9) * 0.05;

      const envSpin = mode === 'balayage' ? tt * 0.35 : mode === 'projecteur' ? tt * 0.1 : 0.6;
      scene.environmentRotation.set(0, envSpin, 0);
      scene.environmentIntensity = mode === 'projecteur' ? (dark ? 0.35 : 0.55) : dark ? 1 : 0.85;

      // balayage : passe toutes les 5 s
      const cyc = (tt % 5) / 5;
      sweep.intensity = mode === 'balayage' ? 26 : 0;
      sweep.position.set(-9 + cyc * 18, 0, 4);
      sweep.lookAt(0, 0, 0);

      rimA.intensity = mode === 'studio' ? 60 : mode === 'balayage' ? 15 : 0;
      rimB.intensity = mode === 'studio' ? 50 : mode === 'balayage' ? 12 : 0;

      spot.intensity = mode === 'projecteur' ? 180 : 0;
      spot.position.set(Math.cos(tt * 0.6) * 7, 5.5, Math.sin(tt * 0.6) * 3 + 8);
      key.intensity = mode === 'projecteur' ? 0.35 : dark ? 1.1 : 1.6;
      floor.position.y = floorY;
    },
    (w, h) => {
      composer?.setSize(w, h);
      const { vw, vh } = viewSize(camera);
      const s = Math.min((vw * 0.78) / def.width, (vh * 0.62) / 4.6);
      pivot.scale.setScalar(s);
      floorY = -(4.6 * s) / 2 - 0.6;
    }
  );

  return {
    setPreset(p) {
      mode = p;
      loop.redraw();
    },
    setPaused: loop.setPaused,
    dispose() {
      composer?.dispose?.();
      loop.dispose();
    },
  };
}
