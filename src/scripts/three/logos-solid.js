// Logos en relief dans leurs vraies matières (métal brossé, or, laque, émail), sans verre.
// Pensés pour le fond blanc pur comme pour le mode sombre, avec des effets de lumière.
import { THREE } from './common.js';
import { glyph, swooshShape, taperedArc, flat, buildEventsLogo, buildCareLogo } from './logos.js';

/** Matières de la maison. */
export function brandMaterials() {
  const metal = (color, roughness, extra = {}) =>
    new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.25, ...extra });
  const enamel = (color) =>
    new THREE.MeshPhysicalMaterial({ color, metalness: 0.05, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.75 });
  return {
    silver: metal('#d8dbe1', 0.26, { anisotropy: 0.55 }),
    graphite: metal('#5c616b', 0.3, { anisotropy: 0.4 }),
    gold: metal('#e3b25b', 0.2),
    black: new THREE.MeshPhysicalMaterial({ color: '#0f1013', metalness: 0.2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }),
    blue: enamel('#1f5aa0'),
    green: enamel('#468a2b'),
  };
}

// ---------- CC Consulting : deux C (argent, graphite) et le toit doré ----------
function cShape(R, r, gap) {
  const s = new THREE.Shape();
  const a0 = gap, a1 = Math.PI * 2 - gap;
  s.absarc(0, 0, R, a0, a1, false);
  s.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
  s.absarc(0, 0, r, a1, a0, true);
  s.closePath();
  return s;
}

const EXT = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 8, curveSegments: 120 };

export function buildConsultingSolid(m) {
  const g = new THREE.Group();
  const g1 = new THREE.ExtrudeGeometry(cShape(1.9, 1.42, 0.72), EXT);
  g1.center();
  const c1 = new THREE.Mesh(g1, m.silver);
  c1.position.set(-0.78, 0, 0.12);
  const g2 = new THREE.ExtrudeGeometry(cShape(1.9, 1.42, 0.72), EXT);
  g2.center();
  const c2 = new THREE.Mesh(g2, m.graphite);
  c2.position.set(0.98, 0, -0.12);
  const ch = new THREE.Shape();
  ch.moveTo(-0.95, -0.55); ch.lineTo(0.1, 0.62); ch.lineTo(1.1, -0.55); ch.lineTo(0.62, -0.55); ch.lineTo(0.1, 0.05); ch.lineTo(-0.47, -0.55); ch.closePath();
  const gch = new THREE.ExtrudeGeometry(ch, { ...EXT, depth: 0.42, curveSegments: 8 });
  gch.center();
  const chev = new THREE.Mesh(gch, m.gold);
  chev.position.set(1.2, -0.18, 0.15);
  g.add(c1, c2, chev);
  return g;
}

// ---------- SSE Solutions : S argent, S doré, E argent, trait doré et deux arcs ----------
export function buildSSESolid(m) {
  const g = new THREE.Group();
  const s1 = glyph('S', 3.4, m.silver, 0.55);
  s1.position.set(-1.75, 0.35, 0);
  const s2 = glyph('S', 2.9, m.gold, 0.5);
  s2.position.set(-0.35, -0.45, 0.25);
  const e = glyph('E', 3.4, m.silver, 0.55);
  e.position.set(1.65, 0.1, -0.1);
  const swoosh = flat(swooshShape(-2.9, -1.5, 3.4, 1.0, 0.25, 0.14), m.gold, 0.16);
  swoosh.position.z = 0.55;
  const arcTop = flat(taperedArc(2.85, Math.PI * 0.28, Math.PI * 0.78, 0.07), m.gold, 0.12);
  const arcBot = flat(taperedArc(2.85, Math.PI * 1.25, Math.PI * 1.72, 0.07), m.gold, 0.12);
  g.add(s1, s2, e, swoosh, arcTop, arcBot);
  return g;
}

// ---------- CC Events : C noir laqué (argent sur fond sombre, comme le logo officiel), C doré, orbite, silhouette et étoile dorées ----------
export function buildEventsSolid(m, { dark = false } = {}) {
  return buildEventsLogo({ smoke: dark ? m.silver : m.black, gold: m.gold, clear: m.gold });
}

// ---------- CC Care : adulte bleu, enfant et feuilles verts, cercle doré ----------
export function buildCareSolid(m) {
  return buildCareLogo(null, { bleu: m.blue, vert: m.green, or: m.gold, default: m.blue });
}

export const SOLID_LOGOS = {
  'sse-solutions': { label: 'SSE Solutions', build: buildSSESolid, width: 6.2 },
  'cc-consulting': { label: 'CC Consulting', build: buildConsultingSolid, width: 5.6 },
  'cc-events': { label: 'CC Events', build: buildEventsSolid, width: 6.4 },
  'cc-care': { label: 'CC Care', build: buildCareSolid, width: 5.0 },
};
