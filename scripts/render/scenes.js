/**
 * Scènes de rendu "hors-ligne" (exécutées dans Chromium par Playwright).
 * Chaque "job" construit une scène Three.js et expose frame(i) -> dataURL.
 *
 * Jobs :
 *  - sequence        : 150 images pour l'animation pilotée par le scroll
 *  - beans-loop      : 180 images (6 s @ 30 fps) -> vidéo en boucle
 *  - product:<id>    : visuels des boissons (fond transparent)
 *  - bag:<id>        : visuels des sachets de grains (fond transparent)
 *  - og              : image de partage réseaux sociaux
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as M from '/lib/three/models.js';

const { clamp, lerp, smoothstep, easeInOut, mulberry32 } = M;

let renderer = null;
let job = null; // { scene, camera, update(i), frames, w, h, ss, mime, quality, composer, post }

function setupRenderer(w, h, { alpha = true, ss = 1 } = {}) {
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w * ss, h * ss, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = window.TONE === 'aces' ? THREE.ACESFilmicToneMapping : THREE.NeutralToneMapping;
  renderer.toneMappingExposure = window.TONE === 'aces' ? 1.05 : 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, alpha ? 0 : 1);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function addEnvironment(scene, intensity = 0.55) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = intensity;
}

function addShadowGround(scene, opacity = 0.42) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ color: '#0b0503', opacity })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

/** Place la caméra pour cadrer un objet. */
function frameObject(camera, object, { margin = 1.15, elevation = 0.35, azimuth = 0, yOffset = 0 } = {}) {
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const fitH = sphere.radius / Math.sin(fov / 2);
  const fitW = sphere.radius / Math.sin(Math.atan(Math.tan(fov / 2) * camera.aspect));
  const dist = Math.max(fitH, fitW) * margin;
  const target = sphere.center.clone();
  target.y += yOffset;
  camera.position.set(
    target.x + dist * Math.sin(azimuth) * Math.cos(elevation),
    target.y + dist * Math.sin(elevation),
    target.z + dist * Math.cos(azimuth) * Math.cos(elevation)
  );
  camera.lookAt(target);
}

const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

/** Pose un grain "couché" au sol. */
function restingBeanQuat(rnd) {
  const q = new THREE.Quaternion().setFromAxisAngle(Y, rnd() * Math.PI * 2);
  const flatDown = rnd() > 0.35;
  const flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), flatDown ? Math.PI / 2 : -Math.PI / 2);
  q.multiply(flat);
  // hauteur du centre au-dessus du sol (face plate en bas ~0.31, face bombée ~0.62)
  q.userHeight = flatDown ? 0.31 : 0.6;
  return q;
}

function scatterBeans(scene, { count = 6, seed = 4, rMin = 1.2, rMax = 2, arc = [0, Math.PI * 2], scale = 0.1 }) {
  const rnd = mulberry32(seed);
  const beans = M.createBeans(count, seed + 1, 1.2);
  for (let i = 0; i < count; i++) {
    const a = lerp(arc[0], arc[1], rnd());
    const r = lerp(rMin, rMax, rnd());
    const s = scale * (0.85 + rnd() * 0.3);
    const q = restingBeanQuat(rnd);
    // face plate vers le bas => hauteur ~ 0.31*s, face bombée vers le bas => 0.62*s
    _v.set(Math.cos(a) * r, q.userHeight * s, Math.sin(a) * r);
    _m.compose(_v, q, _s.set(s, s, s));
    beans.setMatrixAt(i, _m);
  }
  beans.instanceMatrix.needsUpdate = true;
  scene.add(beans);
  return beans;
}

/* ------------------------------------------------------------------ */
/* 1) Séquence scroll : tasse en "vue éclatée" + tourbillon de grains   */
/* ------------------------------------------------------------------ */
function buildSequence() {
  const w = 1600;
  const h = 900;
  setupRenderer(w, h, { alpha: true });
  const scene = new THREE.Scene();
  addEnvironment(scene, 0.55);
  M.addStudioLights(scene, { shadowSize: 2048 });
  addShadowGround(scene, 0.38);
  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);

  const saucer = M.createSaucer();
  scene.add(saucer);
  const cup = M.createCup({ kind: 'espresso', seed: 12 });
  cup.group.rotation.order = 'YXZ';
  scene.add(cup.group);

  const N = 130;
  const beans = M.createBeans(N, 21, 1);
  scene.add(beans);
  const rnd = mulberry32(99);
  const data = [];
  for (let i = 0; i < N; i++) {
    const floor = i < 18;
    const s = 0.085 + rnd() * 0.03;
    let start;
    let q0;
    if (floor) {
      const a = rnd() * Math.PI * 2;
      const r = 1.3 + rnd() * 1.3;
      q0 = restingBeanQuat(rnd);
      start = new THREE.Vector3(Math.cos(a) * r, q0.userHeight * s, Math.sin(a) * r);
    } else {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 0.38;
      start = new THREE.Vector3(Math.cos(a) * r, 0.55 + rnd() * 0.2, Math.sin(a) * r);
      q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6));
    }
    const ea = rnd() * Math.PI * 2;
    const er = 1.45 + Math.pow(rnd(), 0.8) * 1.75;
    const eh = floor ? 0.15 + rnd() * 1.3 : 0.3 + rnd() * 2.55;
    data.push({
      floor,
      s,
      start,
      q0,
      end: new THREE.Vector3(Math.cos(ea) * er, eh, Math.sin(ea) * er),
      delay: rnd(),
      axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
      turns: 0.6 + rnd() * 1.6,
      swirl: (0.9 + rnd() * 0.5) * (2.2 / er),
    });
  }

  const frames = 150;
  function update(i) {
    const p = i / (frames - 1);
    const E = smoothstep(0.1, 0.55, p);
    const Ee = easeInOut(E);

    // soucoupe
    saucer.position.y = 0.18 * Ee;
    saucer.rotation.x = 0.16 * Ee;
    saucer.rotation.z = -0.08 * Ee;

    // tasse
    cup.group.position.y = M.SAUCER_TOP + 0.18 * Ee + 1.15 * Ee;
    cup.group.rotation.y = -0.75 + 2.1 * easeInOut(smoothstep(0.0, 1.0, p));
    cup.group.rotation.x = 0.2 * Ee;
    cup.group.rotation.z = -0.22 * Ee;

    // le café "sort" de la tasse puis s'incline vers la caméra
    const L = easeInOut(smoothstep(0.26, 0.68, p));
    cup.coffee.position.y = 1.3 * L;
    const az = lerp(-0.42, 0.55, easeInOut(p));
    const n = new THREE.Vector3(Math.sin(az) * Math.cos(0.95), Math.sin(0.95), Math.cos(az) * Math.cos(0.95));
    const qTarget = new THREE.Quaternion().setFromUnitVectors(Y, n);
    const qLocal = cup.group.quaternion.clone().invert().multiply(qTarget);
    cup.coffee.quaternion.slerpQuaternions(new THREE.Quaternion(), qLocal, L);

    // grains
    for (let k = 0; k < N; k++) {
      const d = data[k];
      const t = clamp((p - 0.14 - d.delay * 0.24) / 0.4);
      const te = easeInOut(t);
      if (d.floor) {
        _v.copy(d.start);
      } else {
        _v.copy(d.start).add(cup.group.position);
      }
      _v.lerp(d.end, te);
      _v.y += Math.sin(t * Math.PI) * (d.floor ? 0.5 : 0.7);
      const swirl = d.swirl * (te * 0.6 + 1.4 * smoothstep(0.35, 1.0, p));
      _v.applyAxisAngle(Y, swirl);
      _q2.setFromAxisAngle(d.axis, d.turns * Math.PI * 2 * te + p * 1.2 * (d.floor ? te : 1));
      _q.copy(d.q0).premultiply(_q2);
      const sc = d.floor ? d.s : d.s * smoothstep(0.0, 0.22, t);
      _m.compose(_v, _q, _s.set(sc, sc, sc));
      beans.setMatrixAt(k, _m);
    }
    beans.instanceMatrix.needsUpdate = true;

    // caméra
    const target = new THREE.Vector3(0, 0.42 + 1.25 * Ee, 0);
    const el = lerp(0.6, 0.2, easeInOut(smoothstep(0.0, 0.75, p)));
    const dist = lerp(4.9, 8.6, easeInOut(smoothstep(0.05, 0.6, p)));
    camera.position.set(
      target.x + dist * Math.sin(az) * Math.cos(el),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(az) * Math.cos(el)
    );
    camera.lookAt(target);
  }

  return { scene, camera, update, frames, w, h, ss: 1, mime: 'image/webp', quality: 0.8 };
}

/* ------------------------------------------------------------------ */
/* 2) Vidéo en boucle : pluie de grains avec profondeur de champ        */
/* ------------------------------------------------------------------ */
function buildBeansLoop() {
  const w = 1280;
  const h = 720;
  setupRenderer(w, h, { alpha: false });
  const scene = new THREE.Scene();
  const bg = new THREE.Color('#150c07');
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 7, 17);
  addEnvironment(scene, 0.35);
  const lights = M.addStudioLights(scene, { shadows: false, intensity: 1.1 });
  lights.rim.position.set(5, 2, -3);
  lights.rim.intensity = 5;

  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 60);
  camera.position.set(0, 0, 7);
  camera.lookAt(0, 0, 0);

  const N = 90;
  const beans = M.createBeans(N, 31, 1);
  scene.add(beans);
  const rnd = mulberry32(7);
  const data = [];
  for (let i = 0; i < N; i++) {
    const z = lerp(-8, 4.2, Math.pow(rnd(), 0.9));
    const depth = 7 - z; // distance caméra
    const halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * depth;
    const halfW = halfH * (w / h);
    const L = (halfH * 2 + 1.2) * (1 + rnd() * 0.5); // distance avant de boucler
    data.push({
      x: (rnd() * 2 - 1) * (halfW + 0.3),
      z,
      L,
      y0: rnd() * L,
      halfH: halfH + 0.6,
      s: 0.13 + rnd() * 0.05,
      axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
      q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)),
      spins: rnd() > 0.5 ? 1 : -1,
      sway: rnd() * Math.PI * 2,
    });
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new BokehPass(scene, camera, { focus: 7.0, aperture: 0.006, maxblur: 0.012 }));
  composer.addPass(new OutputPass());

  const frames = 180;
  function update(i) {
    const t = i / frames; // 0..1 (boucle parfaite : frame 180 == frame 0)
    for (let k = 0; k < N; k++) {
      const d = data[k];
      // descend de exactement L sur la durée de la boucle
      let y = d.y0 - t * d.L;
      y = ((y % d.L) + d.L) % d.L; // 0..L
      _v.set(d.x + 0.12 * Math.sin(t * Math.PI * 2 + d.sway), d.halfH - y, d.z);
      _q2.setFromAxisAngle(d.axis, d.spins * t * Math.PI * 2);
      _q.copy(d.q0).premultiply(_q2);
      _m.compose(_v, _q, _s.set(d.s, d.s, d.s));
      beans.setMatrixAt(k, _m);
    }
    beans.instanceMatrix.needsUpdate = true;
  }

  return { scene, camera, update, frames, w, h, ss: 1, mime: 'image/jpeg', quality: 0.95, composer };
}

/* ------------------------------------------------------------------ */
/* 3) Produits                                                         */
/* ------------------------------------------------------------------ */
function buildProduct(id) {
  const w = 1000;
  const h = 1200;
  setupRenderer(w, h, { alpha: true, ss: 2 });
  const scene = new THREE.Scene();
  addEnvironment(scene, 0.6);
  M.addStudioLights(scene, { shadowSize: 4096 });
  addShadowGround(scene, 0.45);
  const camera = new THREE.PerspectiveCamera(24, w / h, 0.1, 100);
  const group = new THREE.Group();
  scene.add(group);

  let elevation = 0.42;
  let azimuth = 0.0;
  let margin = 1.0;
  if (id === 'coldbrew') {
    group.add(M.createColdBrew());
    group.add(scatterBeans(scene, { count: 5, seed: 9, rMin: 0.8, rMax: 1.05, arc: [1.2, 2.6], scale: 0.1 }));
    elevation = 0.2;
    margin = 0.95;
  } else {
    const cfg = {
      espresso: { kind: 'espresso', cup: [0.64, 0.7, 0.64], saucer: [0.7, 0.85, 0.7], el: 0.5, ry: -0.6 },
      cappuccino: { kind: 'cappuccino', cup: [1.04, 0.92, 1.04], saucer: [1, 1, 1], el: 0.55, ry: -0.5 },
      latte: { kind: 'latte', cup: [1, 1.04, 1], saucer: [1, 1, 1], el: 0.72, ry: -0.35 },
    }[id];
    const saucer = M.createSaucer();
    saucer.scale.set(...cfg.saucer);
    group.add(saucer);
    const cup = M.createCup({ kind: cfg.kind, seed: id.length * 7 });
    cup.group.scale.set(...cfg.cup);
    cup.group.position.y = M.SAUCER_TOP * cfg.saucer[1];
    cup.group.rotation.y = cfg.ry;
    group.add(cup.group);
    const R = 1.06 * cfg.saucer[0];
    group.add(scatterBeans(scene, { count: 5, seed: id.length * 3, rMin: R + 0.12, rMax: R + 0.4, arc: [1.25, 2.5], scale: 0.1 }));
    elevation = cfg.el;
  }

  frameObject(camera, group, { margin: margin * 0.86, elevation, azimuth, yOffset: -0.05 });
  return { scene, camera, update() {}, frames: 1, w, h, ss: 2, mime: 'image/webp', quality: 0.9 };
}

/* ------------------------------------------------------------------ */
/* 4) Sachets                                                          */
/* ------------------------------------------------------------------ */
export const BAGS = {
  ethiopia: { origin: 'Éthiopie', region: 'Yirgacheffe', notes: 'Jasmin · Bergamote · Pêche', roast: 'Torréfaction claire', color: '#b4532a', seed: 3 },
  colombia: { origin: 'Colombie', region: 'Huila', notes: 'Caramel · Pomme rouge · Cacao', roast: 'Torréfaction medium', color: '#2f4a3a', seed: 5 },
  brazil: { origin: 'Brésil', region: 'Cerrado Mineiro', notes: 'Noisette · Chocolat noir · Miel', roast: 'Torréfaction foncée', color: '#1f2a44', seed: 8 },
};

function buildBag(id) {
  const w = 900;
  const h = 1200;
  setupRenderer(w, h, { alpha: true, ss: 2 });
  const scene = new THREE.Scene();
  addEnvironment(scene, 0.6);
  M.addStudioLights(scene, { shadowSize: 4096 });
  addShadowGround(scene, 0.45);
  const camera = new THREE.PerspectiveCamera(24, w / h, 0.1, 100);
  const bag = M.createBag(BAGS[id]);
  bag.rotation.y = -0.32;
  scene.add(bag);
  const spill = scatterBeans(scene, { count: 9, seed: BAGS[id].seed * 13, rMin: 0.55, rMax: 0.95, arc: [0.5, 2.3], scale: 0.1 });
  const all = new THREE.Group();
  scene.remove(bag);
  scene.remove(spill);
  all.add(bag, spill);
  scene.add(all);
  frameObject(camera, all, { margin: 0.98, elevation: 0.16, azimuth: 0.0, yOffset: -0.1 });
  return { scene, camera, update() {}, frames: 1, w, h, ss: 2, mime: 'image/webp', quality: 0.9 };
}

/* ------------------------------------------------------------------ */
/* 5) Image OG (partage)                                               */
/* ------------------------------------------------------------------ */
function buildOg() {
  const w = 1200;
  const h = 630;
  setupRenderer(w, h, { alpha: true, ss: 2 });
  const scene = new THREE.Scene();
  addEnvironment(scene, 0.6);
  M.addStudioLights(scene, { shadowSize: 4096 });
  addShadowGround(scene, 0.5);
  const camera = new THREE.PerspectiveCamera(26, w / h, 0.1, 100);
  const group = new THREE.Group();
  const saucer = M.createSaucer();
  group.add(saucer);
  const cup = M.createCup({ kind: 'latte', seed: 3 });
  cup.group.position.y = M.SAUCER_TOP;
  cup.group.rotation.y = -0.4;
  group.add(cup.group);
  group.position.x = 1.85;
  scene.add(group);
  scatterBeans(scene, { count: 7, seed: 77, rMin: 1.35, rMax: 1.9, arc: [0.3, 2.9], scale: 0.1 }).position.x = 1.85;
  camera.position.set(0, 3.2, 6.4);
  camera.lookAt(0.2, 0.35, 0);

  const post = (src) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(w * 0.7, h * 0.45, 0, w * 0.7, h * 0.45, w * 0.75);
    g.addColorStop(0, '#3a2214');
    g.addColorStop(1, '#100805');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0, w, h);
    ctx.fillStyle = '#f3e7d3';
    ctx.font = '600 128px Fraunces';
    ctx.fillText('KAHWA', 70, 300);
    ctx.font = 'italic 400 34px Fraunces';
    ctx.fillStyle = '#d8a46c';
    ctx.fillText('torréfié lentement, servi avec soin', 74, 370);
    ctx.font = '500 20px Manrope';
    ctx.fillStyle = 'rgba(243,231,211,0.6)';
    ctx.letterSpacing = '6px';
    ctx.fillText('SPECIALTY COFFEE ROASTERS', 76, 540);
    return c;
  };
  return { scene, camera, update() {}, frames: 1, w, h, ss: 2, mime: 'image/jpeg', quality: 0.9, post };
}

/* ------------------------------------------------------------------ */
/* API appelée par Playwright                                          */
/* ------------------------------------------------------------------ */
window.KAHWA = {
  async setup(name) {
    await document.fonts.load('600 40px Fraunces');
    await document.fonts.load('italic 400 40px Fraunces');
    await document.fonts.load('500 20px Manrope');
    if (name === 'sequence') job = buildSequence();
    else if (name === 'beans-loop') job = buildBeansLoop();
    else if (name.startsWith('product:')) job = buildProduct(name.split(':')[1]);
    else if (name.startsWith('bag:')) job = buildBag(name.split(':')[1]);
    else if (name === 'og') job = buildOg();
    else throw new Error('job inconnu: ' + name);
    return { frames: job.frames };
  },
  frame(i) {
    job.update(i);
    if (job.composer) job.composer.render();
    else renderer.render(job.scene, job.camera);
    let src = renderer.domElement;
    if (job.ss !== 1 || job.post) {
      const c = document.createElement('canvas');
      c.width = job.w;
      c.height = job.h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, job.w, job.h);
      src = job.post ? job.post(c) : c;
    }
    return src.toDataURL(job.mime, job.quality);
  },
};
window.KAHWA_READY = true;
