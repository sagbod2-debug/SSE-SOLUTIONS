// Logo en relief, opaque, dans ses vraies matières : éclairage studio fixe, sans effet de lumière.
// Utilisé seul (présentoir, avec ombre au sol) ou incrusté dans un bloc de la page (fond transparent).
import { THREE, createStage, runLoop, viewSize } from './common.js';
import { brandMaterials, SOLID_LOGOS } from './logos-solid.js';

export function mountLogoShowcase(canvas, { logo = 'cc-consulting', dark = false, interactive = true, transparent = false, floor = !transparent, fill = 0.78 } = {}) {
  const stage = createStage(canvas, { background: transparent ? null : dark ? '#0E0F11' : '#FFFFFF', z: 14, fov: 30 });
  if (!stage) return null;
  const { scene, camera, renderer } = stage;
  camera.position.set(0, floor ? 2.2 : 0, 14);
  camera.lookAt(0, 0, 0);

  const def = SOLID_LOGOS[logo] || SOLID_LOGOS['cc-consulting'];
  const obj = def.build(brandMaterials(), { dark });
  const pivot = new THREE.Group();
  pivot.add(obj);
  scene.add(pivot);

  // lumière studio fixe : l'environnement donne la matière, une lumière principale le relief
  scene.environmentRotation.set(0, 0.6, 0);
  scene.environmentIntensity = dark ? 1 : 0.85;
  const key = new THREE.DirectionalLight('#ffffff', dark ? 1.1 : 1.6);
  key.position.set(3, 9, 6);
  scene.add(key);

  let ground = null;
  if (floor) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: dark ? '#000000' : '#1d2026', opacity: dark ? 0.5 : 0.14 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    key.shadow.radius = 6;
  }

  let floorY = -2;
  const loop = runLoop(
    canvas,
    stage,
    (t, { px, py, reduce }) => {
      const tt = reduce ? 0 : t;
      pivot.rotation.y = Math.sin(tt * 0.45) * 0.42 + (interactive ? px * 0.35 : 0);
      pivot.rotation.x = interactive ? py * 0.12 : 0;
      pivot.position.y = Math.sin(tt * 0.9) * 0.05;
      if (ground) ground.position.y = floorY;
    },
    () => {
      const { vw, vh } = viewSize(camera);
      const s = Math.min((vw * fill) / def.width, (vh * (floor ? 0.62 : 0.95)) / 4.6);
      pivot.scale.setScalar(s);
      floorY = -(4.6 * s) / 2 - 0.6;
    }
  );

  return { setPaused: loop.setPaused, dispose: loop.dispose };
}
