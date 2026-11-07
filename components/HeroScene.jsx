'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, ContactShadows } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  addStudioLights,
  createBeans,
  createCup,
  createSaucer,
  lerp,
  mulberry32,
  SAUCER_TOP,
  smoothstep,
} from '@/lib/three/models';
import { hero } from '@/lib/store';

/* Lissage de la souris (partagé par les composants de la scène) */
const mouse = { x: 0, y: 0 };

/* ---------------- Environnement + lumières ---------------- */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    const lights = addStudioLights(scene, { shadows: false });
    return () => {
      Object.values(lights).forEach((l) => scene.remove(l));
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ---------------- Caméra (s'adapte au format d'écran) ---------------- */
function CameraRig() {
  const { camera, size } = useThree();
  // calque 1 = objets visibles mais exclus des ContactShadows (vapeur, grains flottants)
  useEffect(() => {
    camera.layers.enable(1);
  }, [camera]);
  useFrame(() => {
    const aspect = size.width / size.height;
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    const fitWidth = 3.1 / (2 * Math.tan(hfov / 2)); // garder ~3.1 unités visibles en largeur
    const base = Math.max(6.4, fitWidth);
    const p = hero.progress;
    mouse.x += (hero.mouseX - mouse.x) * 0.05;
    mouse.y += (hero.mouseY - mouse.y) * 0.05;
    camera.position.set(mouse.x * 0.35, 3.3 + mouse.y * 0.2 - p * 0.9, base + p * 0.6);
    camera.lookAt(0, 0.62 + p * 0.55, 0);
  });
  return null;
}

/* ---------------- Vapeur (shader de bruit) ---------------- */
const steamVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.x += sin(uv.y * 4.0 + uTime * 1.2) * 0.07 * uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const steamFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float n = fbm(vec2(uv.x * 2.5 + uSeed, uv.y * 2.0 - uTime * 0.32));
    float n2 = fbm(vec2(uv.x * 5.0 - uSeed * 2.0, uv.y * 3.4 - uTime * 0.5));
    float center = 0.5 + (n - 0.5) * 0.55;
    float d = abs(uv.x - center) * 2.0;
    float wisp = smoothstep(0.6, 0.0, d);
    float shape = smoothstep(0.0, 0.22, uv.y) * smoothstep(1.0, 0.4, uv.y);
    float density = smoothstep(0.42, 0.78, n * 0.55 + n2 * 0.6);
    float a = wisp * shape * density * uOpacity * 0.55;
    gl_FragColor = vec4(vec3(1.0, 0.96, 0.9), a);
  }
`;

function useSteamMaterial(seed) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: steamVertex,
        fragmentShader: steamFragment,
        uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    [seed]
  );
}

function Steam() {
  const root = useRef(null);
  useEffect(() => {
    root.current.traverse((o) => o.isMesh && o.layers.set(1));
  }, []);
  const m1 = useSteamMaterial(1.3);
  const m2 = useSteamMaterial(7.1);
  const m3 = useSteamMaterial(13.7);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const o = smoothstep(0.4, 1, hero.intro) * (1 - smoothstep(0.0, 0.3, hero.progress));
    [m1, m2, m3].forEach((m, i) => {
      m.uniforms.uTime.value = t + i * 3.1;
      m.uniforms.uOpacity.value = o;
    });
  });
  const y = SAUCER_TOP + 0.85;
  return (
    <group position={[0, y, 0]} ref={root}>
      <Billboard position={[-0.12, 0.85, 0]}>
        <mesh material={m1}>
          <planeGeometry args={[0.9, 1.7, 1, 24]} />
        </mesh>
      </Billboard>
      <Billboard position={[0.15, 0.95, 0.05]}>
        <mesh material={m2}>
          <planeGeometry args={[0.8, 1.9, 1, 24]} />
        </mesh>
      </Billboard>
      <Billboard position={[0.02, 0.7, -0.08]}>
        <mesh material={m3}>
          <planeGeometry args={[0.7, 1.4, 1, 24]} />
        </mesh>
      </Billboard>
    </group>
  );
}

/* ---------------- Tasse + soucoupe ---------------- */
function CupRig() {
  const rig = useRef(null);
  const shadow = useRef(null);
  const { saucer, cup } = useMemo(() => {
    const saucer = createSaucer({ segments: 96 });
    const cup = createCup({ kind: 'latte', seed: 3, segments: 96 });
    cup.group.position.y = SAUCER_TOP;
    cup.group.rotation.y = -0.45;
    return { saucer, cup };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = hero.progress;
    const intro = hero.intro;
    const g = rig.current;
    // au scroll : la tasse monte puis s'envole hors de l'écran (relais vers la séquence)
    g.position.y = lerp(3.4, 0, intro) + Math.sin(t * 1.1) * 0.035 * intro + p * 0.6 + smoothstep(0.55, 1, p) * 3.2;
    g.rotation.y = lerp(-2.6, 0, intro) + p * Math.PI * 1.15 + mouse.x * 0.3;
    g.rotation.x = p * 0.75 + mouse.y * 0.1;
    g.rotation.z = Math.sin(t * 0.7) * 0.025 * intro - p * 0.15;
    g.scale.setScalar(1 - p * 0.1);
    if (shadow.current) shadow.current.scale.setScalar(Math.max(0.001, intro * (1 - p * 0.7)));
  });

  return (
    <>
      <group ref={rig}>
        <primitive object={saucer} />
        <primitive object={cup.group} />
        <Steam />
      </group>
      <group ref={shadow}>
        <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={6} blur={2.6} far={2.5} resolution={512} color="#000000" />
      </group>
    </>
  );
}

/* ---------------- Grains flottants ---------------- */
function FloatingBeans({ count = 34 }) {
  const group = useRef(null);
  const mesh = useMemo(() => {
    const m = createBeans(count, 5, 0.8);
    m.layers.set(1);
    m.frustumCulled = false;
    return m;
  }, [count]);
  const data = useMemo(() => {
    const rnd = mulberry32(42);
    return Array.from({ length: count }, () => {
      const a = rnd() * Math.PI * 2;
      const r = 1.9 + rnd() * 2.4;
      let x = Math.cos(a) * r * 1.4;
      const z = Math.min(Math.sin(a) * r - 0.8, 1.8);
      // les grains proches de la caméra restent en haut (pour ne pas cacher le texte)
      const y = z > 0.4 ? 1.5 + rnd() * 1.6 : -0.2 + rnd() * 3.0;
      if (Math.abs(x) < 1.55 && z > -1.2) x = Math.sign(x || 1) * (1.55 + rnd() * 0.9);
      const base = new THREE.Vector3(x, y, z);
      return {
        base,
        out: new THREE.Vector3(x, (y - 0.8) * 0.6, z + 2.5).normalize(),
        s: 0.1 + rnd() * 0.06,
        axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        speed: 0.25 + rnd() * 0.5,
        phase: rnd() * Math.PI * 2,
        delay: rnd(),
        q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)),
      };
    });
  }, [count]);

  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), s: new THREE.Vector3() }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = hero.progress;
    const intro = hero.intro;
    for (let i = 0; i < count; i++) {
      const d = data[i];
      const appear = smoothstep(0.15 + d.delay * 0.5, 1, intro);
      tmp.v.copy(d.base);
      tmp.v.y += Math.sin(t * d.speed + d.phase) * 0.14 + (1 - appear) * -1.5;
      tmp.v.addScaledVector(d.out, p * 4.5);
      tmp.q2.setFromAxisAngle(d.axis, t * d.speed * 0.7 + p * 4);
      tmp.q.copy(d.q0).premultiply(tmp.q2);
      const sc = d.s * appear;
      tmp.m.compose(tmp.v, tmp.q, tmp.s.set(sc, sc, sc));
      mesh.setMatrixAt(i, tmp.m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (group.current) group.current.rotation.y = mouse.x * 0.12 + t * 0.02;
  });

  return (
    <group ref={group}>
      <primitive object={mesh} />
    </group>
  );
}

/* ---------------- Canvas ---------------- */
export default function HeroScene({ active = true }) {
  return (
    <Canvas
      className="hero-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 3.3, 6.4], fov: 30, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.9;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Studio />
      <CameraRig />
      <CupRig />
      <FloatingBeans count={34} />
    </Canvas>
  );
}
