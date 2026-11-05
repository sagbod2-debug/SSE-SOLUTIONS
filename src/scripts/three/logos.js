// Logos de la maison en verre liquide (même matière que le monogramme CC Consulting).
// Chaque logo est redessiné en formes nettes pour rester reconnaissable en 3D.
import { THREE, buildSvgLogo } from './common.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import cinzelData from '../../data/cinzel-3d-font.json';
import logos from '../../data/logos-3d.json';

const cinzel = new Font(cinzelData);

/** Verre liquide : transparent, épais, légère ondulation. `att` teinte le cœur du verre. */
export function liquidGlass(timeU, att = '#f2f4f7', attDist = 6) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06, transmission: 1, thickness: 1.1, ior: 1.42,
    attenuationColor: new THREE.Color(att), attenuationDistance: attDist,
    clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.4, iridescenceIOR: 1.25,
    iridescenceThicknessRange: [120, 420], specularIntensity: 1, envMapIntensity: 1.35, dispersion: 4,
  });
  m.onBeforeCompile = (s) => {
    s.uniforms.uTime = timeU;
    s.vertexShader =
      'uniform float uTime;\n' +
      s.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  transformed += objectNormal * (sin(position.y * 2.1 + uTime * 1.3) * cos(position.x * 1.6 - uTime * 0.9) * 0.03);'
      );
  };
  return m;
}

/**
 * Jeu de verres. Sur fond sombre, le verre clair ressort de lui-même.
 * Sur fond blanc pur (`light`), un verre clair disparaît : on passe à un verre fumé,
 * plus dense, qui garde la transparence et les reflets mais dessine nettement la forme.
 */
export function glassSet(timeU, { light = false } = {}) {
  if (light) {
    const tune = (m) => {
      m.envMapIntensity = 1.8;
      m.iridescence = 0.25;
      m.thickness = 1.6;
      return m;
    };
    return {
      clear: tune(liquidGlass(timeU, '#8a929c', 1.6)),
      smoke: tune(liquidGlass(timeU, '#59616b', 1.1)),
      gold: tune(liquidGlass(timeU, '#c9a24b', 1.25)),
    };
  }
  return {
    clear: liquidGlass(timeU, '#f2f4f7', 6),
    smoke: liquidGlass(timeU, '#aab1b9', 3),
    gold: liquidGlass(timeU, '#c9a06a', 1.2),
  };
}

const EXTRUDE = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.08, bevelSegments: 10, curveSegments: 64 };

export function glyph(ch, size, mat, depth = 0.5) {
  const geo = new THREE.ExtrudeGeometry(cinzel.generateShapes(ch, size), { ...EXTRUDE, depth, curveSegments: 48 });
  geo.center();
  return new THREE.Mesh(geo, mat);
}

/** Croissant fin (trait de pinceau) entre deux points, courbé vers le haut. */
export function swooshShape(x0, y0, x1, y1, bend, thick) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + bend;
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.quadraticCurveTo(mx, my + thick, x1, y1);
  s.quadraticCurveTo(mx, my - thick, x0, y0);
  return s;
}

/** Arc de cercle effilé aux deux bouts. */
export function taperedArc(r, a0, a1, thick) {
  const s = new THREE.Shape();
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = a0 + (a1 - a0) * u, w = Math.sin(u * Math.PI) * thick;
    const x = Math.cos(a) * (r + w), y = Math.sin(a) * (r + w);
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N, a = a0 + (a1 - a0) * u, w = Math.sin(u * Math.PI) * thick;
    s.lineTo(Math.cos(a) * (r - w), Math.sin(a) * (r - w));
  }
  return s;
}

export function flat(shape, mat, depth = 0.18) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 6, curveSegments: 64 });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, mat);
}

export function star4(r, inner) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? inner : r;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/** CC Events : deux C, orbite dorée, silhouette qui saute et étoile. Largeur ≈ 6. */
export function buildEventsLogo(g) {
  const grp = new THREE.Group();
  const c1 = glyph('C', 3.3, g.smoke, 0.55);
  c1.position.set(-1.15, 0.1, 0);
  const c2 = glyph('C', 3.0, g.gold, 0.5);
  c2.position.set(0.75, 0.35, -0.2);
  // orbite : ellipse effilée inclinée qui passe devant les lettres
  const orbit = new THREE.Shape();
  const N = 96, rx = 3.2, ry = 0.9;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = Math.PI * 1.05 + u * Math.PI * 1.25, w = Math.sin(u * Math.PI) * 0.13;
    pts.push([Math.cos(a) * (rx + w), Math.sin(a) * (ry + w), Math.cos(a) * (rx - w), Math.sin(a) * (ry - w)]);
  }
  pts.forEach((p, i) => (i === 0 ? orbit.moveTo(p[0], p[1]) : orbit.lineTo(p[0], p[1])));
  for (let i = pts.length - 1; i >= 0; i--) orbit.lineTo(pts[i][2], pts[i][3]);
  const ring = flat(orbit, g.gold, 0.14);
  ring.rotation.z = 0.22;
  ring.position.set(0.1, -0.15, 0.6);
  // silhouette : tête + corps en arc, bras levés
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), g.gold);
  head.position.set(2.35, 1.55, 0.1);
  const body = flat(swooshShape(1.75, 0.55, 2.75, 1.45, -0.25, 0.16), g.gold, 0.14);
  const star = flat(star4(0.42, 0.09), g.gold, 0.12);
  star.position.set(3.0, 2.15, 0);
  // grands arcs du cercle extérieur
  const arc1 = flat(taperedArc(2.9, Math.PI * 0.45, Math.PI * 0.95, 0.06), g.clear, 0.1);
  const arc2 = flat(taperedArc(2.9, Math.PI * 1.35, Math.PI * 1.85, 0.06), g.clear, 0.1);
  grp.add(c1, c2, ring, head, body, star, arc1, arc2);
  grp.userData.parts = { c1, c2, ring, star };
  return grp;
}

/** CC Care : tracé net du logo (adulte, enfant, main, feuilles, cercle) en verre. Largeur ≈ 5. */
export function buildCareLogo(g, layers = null) {
  const grp = buildSvgLogo(logos.care, layers || { bleu: g.smoke, vert: g.clear, or: g.gold, default: g.clear }, { width: 5, depth: 0.42, bevel: 0.08, layerGap: 0.14 });
  return grp;
}
