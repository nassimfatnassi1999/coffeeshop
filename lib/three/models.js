/**
 * Modèles 3D procéduraux (100% code, aucune image externe).
 *
 * Ce fichier est partagé par :
 *  - le site Next.js (scène 3D temps réel du hero)
 *  - le script scripts/render-assets.mjs (génère les images, la séquence
 *    d'images pour le scroll et la vidéo en boucle)
 *
 * Il ne dépend que de "three" : il doit rester du JavaScript "pur".
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

/** Générateur aléatoire déterministe (même "seed" = même résultat). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Textures dessinées en canvas                                        */
/* ------------------------------------------------------------------ */

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.92);
  ctx.bezierCurveTo(x - s * 1.35, y + s * 0.05, x - s * 0.95, y - s * 1.0, x, y - s * 0.42);
  ctx.bezierCurveTo(x + s * 0.95, y - s * 1.0, x + s * 1.35, y + s * 0.05, x, y + s * 0.92);
  ctx.closePath();
}

/**
 * Surface du café vue de dessus (crema, latte art, mousse...).
 * kind: 'espresso' | 'latte' | 'cappuccino' | 'black'
 */
export function createCoffeeSurfaceTexture(kind = 'espresso', seed = 7) {
  const S = 1024;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);
  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2;

  const stops = {
    espresso: [
      [0, '#b4733a'],
      [0.35, '#a05e2a'],
      [0.7, '#7a4019'],
      [0.9, '#4e240c'],
      [1, '#241005'],
    ],
    latte: [
      [0, '#cfa77d'],
      [0.6, '#bf9064'],
      [0.88, '#9b673d'],
      [1, '#5e3418'],
    ],
    cappuccino: [
      [0, '#f6efe4'],
      [0.6, '#f0e5d4'],
      [0.78, '#dcc09c'],
      [0.92, '#a8764b'],
      [1, '#6a3e20'],
    ],
    black: [
      [0, '#4a2612'],
      [0.75, '#30170a'],
      [1, '#1a0b05'],
    ],
  }[kind];

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // Marbrure / "tiger striping" de la crema
  for (let i = 0; i < 1600; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.95;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const r = 2 + rnd() * 20;
    const dark = rnd() > 0.5;
    ctx.fillStyle = dark
      ? `rgba(70,32,12,${0.02 + rnd() * 0.06})`
      : `rgba(255,226,180,${0.02 + rnd() * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.4 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  if (kind === 'latte') {
    // Latte art : coeur "tulipe" en plusieurs couches
    const milk = '#f8f1e6';
    const base = '#c39468';
    ctx.save();
    ctx.filter = 'blur(2.5px)';
    const layers = [
      [milk, 300, cy + 70],
      [base, 252, cy + 22],
      [milk, 236, cy + 12],
      [base, 186, cy - 30],
      [milk, 172, cy - 40],
      [base, 120, cy - 78],
      [milk, 108, cy - 86],
    ];
    layers.forEach(([col, s, y]) => {
      ctx.fillStyle = col;
      heartPath(ctx, cx, y, s);
      ctx.fill();
    });
    // trait de la "tige" (pull-through)
    ctx.strokeStyle = base;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 230);
    ctx.quadraticCurveTo(cx + 4, cy + 120, cx, cy + 345);
    ctx.stroke();
    ctx.restore();
  }

  if (kind === 'cappuccino') {
    // Poudre de cacao au centre
    for (let i = 0; i < 9000; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.pow(rnd(), 0.8) * R * 0.42;
      ctx.fillStyle = `rgba(92,52,28,${0.08 + rnd() * 0.22})`;
      const r = 0.6 + rnd() * 1.8;
      ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, r);
    }
  }

  // Petites bulles près du bord
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.76 + rnd() * 0.2);
    const r = 1 + rnd() * 5;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    ctx.fillStyle = 'rgba(40,18,6,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,236,205,0.45)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(c);
}

/** Étiquette du sachet de café. */
export function createBagLabelTexture({
  origin = 'Éthiopie',
  region = 'Yirgacheffe',
  notes = 'Jasmin · Bergamote · Pêche',
  roast = 'Torréfaction claire',
  color = '#b4532a',
  ink = '#f5ead8',
  seed = 3,
} = {}) {
  const W = 1024;
  const H = 1460;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(seed);

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  // grain du papier
  for (let i = 0; i < 26000; i++) {
    const light = rnd() > 0.5;
    ctx.fillStyle = light ? `rgba(255,255,255,${rnd() * 0.05})` : `rgba(0,0,0,${rnd() * 0.07})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2);
  }

  // zone de soudure en haut
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, W, 150);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let y = 18; y < 150; y += 11) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.textAlign = 'center';

  // Marque
  ctx.font = '600 44px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '18px';
  ctx.fillText('KAHWA', W / 2 + 9, 290);
  ctx.letterSpacing = '0px';
  ctx.font = '400 22px Helvetica, Arial, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('SPECIALTY COFFEE ROASTERS', W / 2 + 4, 332);
  ctx.letterSpacing = '0px';

  // Médaillon
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W / 2, 560, 150, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, 560, 132, 0, Math.PI * 2);
  ctx.stroke();
  // grain de café stylisé dans le médaillon
  ctx.save();
  ctx.translate(W / 2, 560);
  ctx.rotate(-0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.bezierCurveTo(-26, -30, 26, 30, 0, 78);
  ctx.stroke();
  ctx.restore();

  // Origine
  ctx.fillStyle = ink;
  ctx.font = 'italic 400 120px Georgia, "Times New Roman", serif';
  ctx.fillText(origin, W / 2, 870);
  ctx.font = '400 30px Helvetica, Arial, sans-serif';
  ctx.letterSpacing = '10px';
  ctx.fillText(region.toUpperCase(), W / 2 + 5, 935);
  ctx.letterSpacing = '0px';

  ctx.globalAlpha = 0.6;
  ctx.fillRect(W / 2 - 160, 990, 320, 2);
  ctx.globalAlpha = 1;

  ctx.font = '400 32px Helvetica, Arial, sans-serif';
  ctx.fillText(notes, W / 2, 1060);
  ctx.font = '400 24px Helvetica, Arial, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText(roast.toUpperCase(), W / 2 + 3, 1110);
  ctx.letterSpacing = '0px';

  ctx.font = '600 26px Helvetica, Arial, sans-serif';
  ctx.fillText('250 G — GRAINS ENTIERS', W / 2, 1330);

  // valve de dégazage
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.arc(W - 150, 230, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(W - 150, 230, 20, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(c);
}

/* ------------------------------------------------------------------ */
/* Matériaux                                                           */
/* ------------------------------------------------------------------ */

export function createCeramicMaterial(color = '#f3eee7') {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    side: THREE.DoubleSide,
  });
}

export function createBeanMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.4,
  });
}

/* ------------------------------------------------------------------ */
/* Géométries                                                          */
/* ------------------------------------------------------------------ */

/** Disque légèrement bombé avec des UV "vue de dessus". */
export function createDomeDisc(radius = 0.6, dome = 0.0, radial = 28, seg = 96) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= radial; i++) {
    const r = (radius * i) / radial;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = dome * (1 - (r / radius) ** 2);
      pos.push(x, y, z);
      uv.push(0.5 + x / (2 * radius), 0.5 - z / (2 * radius));
    }
  }
  for (let i = 0; i < radial; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* Profil de la tasse (rayon extérieur en fonction de la hauteur) */
const CUP = { base: 0.36, rim: 0.65, h0: 0.06, h1: 0.88, wall: 0.035, level: 0.78 };
export const cupOuterRadius = (h) => {
  const t = clamp((h - CUP.h0) / (CUP.h1 - CUP.h0));
  return CUP.base + (CUP.rim - CUP.base) * (1 - Math.pow(1 - t, 2.2));
};
export const cupInnerRadius = (h) => cupOuterRadius(h) - CUP.wall;
export const CUP_LEVEL = CUP.level;

function cupProfile() {
  const p = [];
  const v = (x, y) => p.push(new THREE.Vector2(x, y));
  // pied
  v(0.0, 0.0);
  v(0.28, 0.0);
  v(0.305, 0.006);
  v(0.322, 0.024);
  v(0.33, 0.05);
  // paroi extérieure
  for (let i = 0; i <= 40; i++) {
    const h = CUP.h0 + ((CUP.h1 - CUP.h0) * i) / 40;
    v(cupOuterRadius(h), h);
  }
  // lèvre arrondie
  const rr = CUP.wall / 2;
  const rcx = CUP.rim - rr;
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI;
    v(rcx + rr * Math.cos(a), CUP.h1 + rr * Math.sin(a));
  }
  // paroi intérieure
  for (let i = 1; i <= 36; i++) {
    const h = CUP.h1 - ((CUP.h1 - 0.16) * i) / 36;
    v(cupInnerRadius(h), h);
  }
  // fond intérieur arrondi
  v(0.36, 0.118);
  v(0.3, 0.104);
  v(0.15, 0.1);
  v(0.0, 0.1);
  return p;
}

function saucerProfile() {
  const pts = [
    [0.0, 0.0],
    [0.4, 0.0],
    [0.43, 0.012],
    [0.445, 0.03],
    [0.5, 0.036],
    [0.7, 0.045],
    [0.9, 0.068],
    [1.0, 0.098],
    [1.045, 0.125],
    [1.06, 0.142],
    [1.05, 0.156],
    [1.025, 0.152],
    [0.95, 0.128],
    [0.8, 0.1],
    [0.6, 0.082],
    [0.47, 0.074],
    [0.44, 0.066],
    [0.0, 0.066],
  ];
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const out = curve.getPoints(90);
  out[0].set(0, 0);
  out[out.length - 1].set(0, 0.066);
  return out;
}

/** Géométrie d'un grain de café (ellipsoïde + face plate + sillon en S). */
export function createBeanGeometry(detail = 1) {
  let g = new THREE.SphereGeometry(1, Math.round(44 * detail), Math.round(30 * detail));
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const zOrig = z;
    // face plate
    if (z > 0) z *= 0.5;
    // sillon en S sur la face plate
    const cx = 0.11 * Math.sin(y * 2.6);
    const d = x - cx;
    const fade = smoothstep(0.02, 0.35, zOrig) * (1 - Math.pow(Math.abs(y), 6));
    const groove = Math.exp(-(d * d) / 0.0065) * 0.3 * fade;
    z -= groove;
    // légère courbure du grain
    x += 0.06 * (y * y - 0.5);
    p.setXYZ(i, x * 0.7, y, z * 0.62);
    // couleur : sillon un peu plus clair (pellicule argentée)
    const k = 1 + Math.exp(-(d * d) / 0.0016) * 0.55 * fade;
    colors[i * 3] = k;
    colors[i * 3 + 1] = 1 + (k - 1) * 0.85;
    colors[i * 3 + 2] = 1 + (k - 1) * 0.6;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

/** Couleurs de torréfaction variées pour les grains (à utiliser avec setColorAt). */
export function beanColor(rnd) {
  const a = new THREE.Color('#2a150b');
  const b = new THREE.Color('#5c331c');
  return a.lerp(b, rnd());
}

/* ------------------------------------------------------------------ */
/* Objets                                                              */
/* ------------------------------------------------------------------ */

/**
 * Tasse + anse + café.
 * Retourne { group, body, handle, coffee, surface }
 * - coffee : groupe "volume de café" (corps + surface), enfant du group,
 *   positionné à y=0 (on peut l'animer pour l'effet "vue éclatée").
 */
export function createCup({
  kind = 'espresso',
  color = '#f3eee7',
  seed = 7,
  segments = 128,
} = {}) {
  const group = new THREE.Group();
  group.name = 'cup';
  const ceramic = createCeramicMaterial(color);

  const body = new THREE.Mesh(new THREE.LatheGeometry(cupProfile(), segments), ceramic);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const handleCurve = new THREE.CatmullRomCurve3(
    [
      [0.58, 0.76],
      [0.76, 0.795],
      [0.885, 0.715],
      [0.912, 0.585],
      [0.855, 0.455],
      [0.72, 0.37],
      [0.5, 0.33],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    'centripetal'
  );
  const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 80, 0.042, 20, false), ceramic);
  handle.scale.z = 0.8;
  handle.castShadow = true;
  handle.receiveShadow = true;
  group.add(handle);

  // Volume de café (forme de l'intérieur de la tasse) + surface
  const coffee = new THREE.Group();
  coffee.name = 'coffee';
  const inner = [];
  inner.push(new THREE.Vector2(0, 0.1));
  inner.push(new THREE.Vector2(0.15, 0.1));
  inner.push(new THREE.Vector2(0.3, 0.104));
  inner.push(new THREE.Vector2(0.36, 0.118));
  for (let i = 0; i <= 20; i++) {
    const h = 0.16 + ((CUP.level - 0.16) * i) / 20;
    inner.push(new THREE.Vector2(cupInnerRadius(h) * 0.996, h));
  }
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: kind === 'latte' || kind === 'cappuccino' ? '#6b3a1c' : '#2a1309',
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const liquidBody = new THREE.Mesh(new THREE.LatheGeometry(inner, 96), liquidMat);
  liquidBody.castShadow = true;
  coffee.add(liquidBody);

  const surfaceTex = createCoffeeSurfaceTexture(kind, seed);
  const surface = new THREE.Mesh(
    createDomeDisc(cupInnerRadius(CUP.level) * 0.998, kind === 'cappuccino' ? 0.06 : kind === 'latte' ? 0.02 : 0.008),
    new THREE.MeshPhysicalMaterial({
      map: surfaceTex,
      roughness: kind === 'cappuccino' ? 0.8 : 0.5,
      clearcoat: kind === 'cappuccino' ? 0.05 : 0.25,
      clearcoatRoughness: 0.35,
    })
  );
  surface.position.y = CUP.level;
  surface.rotation.y = 0; // la pointe du coeur regarde vers +z (face caméra)
  surface.receiveShadow = true;
  coffee.add(surface);
  group.add(coffee);

  return { group, body, handle, coffee, surface };
}

export function createSaucer({ color = '#f3eee7', segments = 128 } = {}) {
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(saucerProfile(), segments), createCeramicMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Hauteur à laquelle la tasse repose sur la soucoupe. */
export const SAUCER_TOP = 0.066;

/** Grains en InstancedMesh. */
export function createBeans(count = 40, seed = 11, detail = 1) {
  const rnd = mulberry32(seed);
  const mesh = new THREE.InstancedMesh(createBeanGeometry(detail), createBeanMaterial(), count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false; // les grains bougent beaucoup : pas de culling global
  for (let i = 0; i < count; i++) mesh.setColorAt(i, beanColor(rnd));
  mesh.instanceColor.needsUpdate = true;
  return mesh;
}

/** Verre de cold brew avec glaçons et paille. */
export function createColdBrew({ seed = 5 } = {}) {
  const rnd = mulberry32(seed);
  const group = new THREE.Group();
  const H = 1.45;
  const rIn = (h) => 0.5 + (0.068 * (h - 0.14)) / (H - 0.14);

  const glassPts = [
    [0, 0],
    [0.5, 0],
    [0.535, 0.02],
    [0.548, 0.07],
  ];
  for (let i = 0; i <= 16; i++) {
    const h = 0.07 + ((H - 0.07) * i) / 16;
    glassPts.push([0.548 + (0.07 * (h - 0.07)) / (H - 0.07), h]);
  }
  glassPts.push([0.612, H + 0.012], [0.595, H + 0.016], [0.582, H]);
  for (let i = 1; i <= 16; i++) {
    const h = H - ((H - 0.16) * i) / 16;
    glassPts.push([rIn(h) + 0.006, h]);
  }
  glassPts.push([0.45, 0.14], [0, 0.14]);
  // Verre "classique" (transparence + reflets) : rend bien sur fond transparent
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.09,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
    envMapIntensity: 1.6,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(
      glassPts.map(([x, y]) => new THREE.Vector2(x, y)),
      128
    ),
    glassMat
  );
  glass.renderOrder = 3;
  group.add(glass);

  // Café glacé : café foncé en bas, crème en haut (dégradé en couleurs de sommets)
  const level = 1.12;
  const liqPts = [[0, 0.145]];
  for (let i = 0; i <= 40; i++) {
    const h = 0.15 + ((level - 0.15) * i) / 40;
    liqPts.push([rIn(h) - 0.004, h]);
  }
  liqPts.push([0, level]);
  const liqGeo = new THREE.LatheGeometry(
    liqPts.map(([x, y]) => new THREE.Vector2(x, y)),
    96
  );
  const lp = liqGeo.attributes.position;
  const lc = new Float32Array(lp.count * 3);
  const dark = new THREE.Color('#1c0a03');
  const amber = new THREE.Color('#4a1f09');
  const cream = new THREE.Color('#c99c70');
  const tmp = new THREE.Color();
  for (let i = 0; i < lp.count; i++) {
    const y = lp.getY(i);
    const t = (y - 0.15) / (level - 0.15);
    tmp.copy(dark).lerp(amber, smoothstep(0.0, 0.55, t));
    // nuage de crème qui descend en volutes
    const swirl = 0.06 * Math.sin(Math.atan2(lp.getZ(i), lp.getX(i)) * 3 + y * 9);
    tmp.lerp(cream, smoothstep(0.62 + swirl, 0.82 + swirl, t));
    lc[i * 3] = tmp.r;
    lc[i * 3 + 1] = tmp.g;
    lc[i * 3 + 2] = tmp.b;
  }
  liqGeo.setAttribute('color', new THREE.BufferAttribute(lc, 3));
  const liquid = new THREE.Mesh(
    liqGeo,
    new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  liquid.castShadow = true;
  group.add(liquid);

  const iceMat = new THREE.MeshPhysicalMaterial({
    color: '#f4f8ff',
    roughness: 0.08,
    transparent: true,
    opacity: 0.42,
    clearcoat: 1,
    envMapIntensity: 2.5,
    depthWrite: false,
  });
  const iceGeo = new RoundedBoxGeometry(0.34, 0.32, 0.33, 4, 0.06);
  const icePos = [
    [-0.18, level - 0.02, 0.14],
    [0.2, level + 0.04, -0.05],
    [-0.06, level + 0.14, -0.2],
    [0.1, level - 0.08, 0.24],
  ];
  icePos.forEach(([x, y, z]) => {
    const ice = new THREE.Mesh(iceGeo, iceMat);
    ice.position.set(x, y, z);
    ice.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    ice.renderOrder = 2;
    group.add(ice);
  });

  const straw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 1.9, 24, 1, true),
    new THREE.MeshPhysicalMaterial({ color: '#1c1c1c', roughness: 0.35, side: THREE.DoubleSide })
  );
  straw.position.set(0.16, 1.15, 0.05);
  straw.rotation.z = -0.24;
  straw.castShadow = true;
  group.add(straw);

  return group;
}

/** Sachet de café (pouch) avec étiquette. */
export function createBag(labelOptions = {}) {
  const W = 1.4;
  const Hh = 2.0;
  const D = 0.52;
  const g = new THREE.BoxGeometry(W, Hh, D, 40, 60, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const nx = x / (W / 2);
    const ny = (y + Hh / 2) / Hh; // 0 en bas, 1 en haut
    let k = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(nx), 8)));
    k *= 1 - smoothstep(0.8, 0.93, ny); // soudure plate en haut
    k *= 0.75 + 0.25 * smoothstep(0, 0.25, ny);
    let nz = (z / (D / 2)) * k * (D / 2);
    // plis du sachet
    nz += Math.sign(z) * 0.006 * Math.sin(x * 23 + y * 6) * Math.sin(y * 17) * k;
    const bulge = 1 + 0.03 * k;
    p.setXYZ(i, x * bulge, y, nz);
  }
  g.computeVertexNormals();
  const color = labelOptions.color || '#b4532a';
  const side = new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') });
  const front = new THREE.MeshPhysicalMaterial({
    map: createBagLabelTexture(labelOptions),
    roughness: 0.55,
    sheen: 0.4,
    sheenColor: new THREE.Color('#ffffff'),
  });
  const mats = [side, side, side, side, front, side];
  const mesh = new THREE.Mesh(g, mats);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = Hh / 2;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

/* ------------------------------------------------------------------ */
/* Éclairage studio commun                                             */
/* ------------------------------------------------------------------ */

/** Ajoute un éclairage chaud "studio café" à une scène. */
export function addStudioLights(scene, { shadows = true, shadowSize = 2048, intensity = 1 } = {}) {
  const key = new THREE.DirectionalLight('#fff1e2', 2.6 * intensity);
  key.position.set(-3.5, 6, 4);
  if (shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 25;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
  }
  scene.add(key);

  const rim = new THREE.DirectionalLight('#ffb070', 3.2 * intensity);
  rim.position.set(4, 3, -5);
  scene.add(rim);

  const fill = new THREE.DirectionalLight('#c9d6ff', 0.5 * intensity);
  fill.position.set(5, 1.5, 4);
  scene.add(fill);

  const amb = new THREE.HemisphereLight('#fff1e0', '#2a160c', 0.35 * intensity);
  scene.add(amb);
  return { key, rim, fill, amb };
}
