'use client';

import * as THREE from 'three';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Html,
  Loader,
  useProgress,
  SoftShadows,
} from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl, GLTF } from 'three-stdlib';
import HeroOverlay from '../HeroOverlay';
import HeroCTAs from '../HeroCTAs';

/** ===== Beam controls (pool size = angle + height; attenuation disabled) ===== */
const BEAM_ANGLE_DEG = 45; // you liked 45°
const BEAM_HEIGHT = 1.2; // light height above center in radii

/** --- MODEL PATHS --- */
const PATHS = {
  computer: '/assets/models/computer.glb',
  controller: '/assets/models/controller.glb',
  desk: '/assets/models/desk.glb',
  poster: '/assets/models/poster.glb',
  xbox: '/assets/models/xbox.glb',
  chair: '/assets/models/chair.glb',
} as const;
Object.values(PATHS).forEach((p) => useGLTF.preload(p));

function GLB({ url }: { url: string }) {
  // We only need the scene (THREE.Group). Drei's type is GLTF; narrow to scene.
  const { scene } = useGLTF(url) as unknown as GLTF;

  useEffect(() => {
    // Traverse with typed Object3D; narrow meshes safely
    scene.traverse((o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

/** --- Infinite floor with radial fade --- */
function makeRadialAlphaTexture(size = 1024, inner = 0.22, outer = 1.0) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    inner * size * 0.5,
    size / 2,
    size / 2,
    outer * size * 0.5,
  );
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.flipY = false;
  return tex;
}

function InfiniteFloorAtGroup({
  group,
  radius = 45,
}: {
  group: React.MutableRefObject<THREE.Group | null>;
  radius?: number;
}) {
  const alphaMap = useMemo(() => makeRadialAlphaTexture(1024, 0.22, 1.0), []);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!group.current || !meshRef.current) return;
    const box = new THREE.Box3().setFromObject(group.current);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const c = sphere.center;
    const y = box.min.y + 0.002;
    meshRef.current.position.set(c.x, y, c.z);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow={false}
    >
      <circleGeometry args={[radius, 128]} />
      <meshStandardMaterial
        color="#141414"
        roughness={1}
        metalness={0}
        transparent
        alphaMap={alphaMap}
        alphaTest={0.01}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/** --- Helper: shape spotlight tightly around a group (no attenuation) --- */
function shapeTightSpot(
  l: THREE.SpotLight,
  group: React.MutableRefObject<THREE.Group | null>,
  scene: THREE.Scene,
) {
  if (!group.current) return;
  if (l.target && !l.target.parent) scene.add(l.target);

  const box = new THREE.Box3().setFromObject(group.current);
  if (box.isEmpty()) return;
  const s = box.getBoundingSphere(new THREE.Sphere());
  const c = s.center;
  const r = Math.max(0.001, s.radius);

  l.position.set(c.x + r * 0.1, c.y + r * BEAM_HEIGHT, c.z + r * 0.4);
  l.target.position.copy(c);
  l.target.updateMatrixWorld(true);

  l.angle = THREE.MathUtils.degToRad(BEAM_ANGLE_DEG);
  l.decay = 2;
  l.distance = 0; // disable attenuation → pool = angle + height

  // Shadow stability
  const sh = l.shadow as THREE.LightShadow;
  const cam = sh.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
  cam.near = Math.max(0.05, r * 0.05);
  cam.far = r * 6.0;
  cam.updateProjectionMatrix();
  // radius exists on LightShadow in recent three versions
  (sh as THREE.LightShadow & { radius?: number }).radius = 3;
  l.shadow.bias = -0.0005;
  l.shadow.normalBias = 0.1;
}

/** --- FLICKER SPOTLIGHT --- */
function FlickerSpot({
  group,
  active,
  loops = 3,
  onEnd,
}: {
  group: React.MutableRefObject<THREE.Group | null>;
  active: boolean;
  loops?: number;
  onEnd?: () => void;
}) {
  const ref = useRef<THREE.SpotLight>(null);
  const t0 = useRef<number | null>(null);
  const done = useRef(false);
  const { clock, scene } = useThree();

  const keys: [number, number][] = [
    [0.0, 0],
    [0.1, 360],
    [0.16, 0],
    [0.35, 500],
    [0.42, 0],
    [0.75, 700],
    [0.95, 0],
  ];
  const loopDur = keys[keys.length - 1][0];

  useEffect(() => {
    if (ref.current && !ref.current.target.parent) scene.add(ref.current.target);
  }, [scene]);

  useFrame(() => {
    const l = ref.current;
    if (!l) return;

    shapeTightSpot(l, group, scene);

    if (!active) {
      l.intensity = 0;
      t0.current = null;
      done.current = false;
      return;
    }

    const now = clock.getElapsedTime();
    if (t0.current === null) t0.current = now;
    const t = now - t0.current;

    if (t >= loops * loopDur) {
      l.intensity = 0;
      if (!done.current) {
        done.current = true;
        onEnd?.();
      }
      return;
    }

    const lt = t % loopDur;
    let i = 0;
    while (i < keys.length - 1 && lt > keys[i + 1][0]) i++;
    const [t0k, v0] = keys[i];
    const [t1k, v1] = keys[i + 1];
    const u = THREE.MathUtils.clamp((lt - t0k) / (t1k - t0k), 0, 1);
    const base = THREE.MathUtils.lerp(v0, v1, u);
    l.intensity = Math.max(0, base + 0.8 * Math.sin(now * 60));
  });

  return (
    <spotLight
      ref={ref}
      color="#ffffff"
      penumbra={1}
      castShadow
      shadow-mapSize={[4096, 4096]}
      shadow-bias={-0.0005}
      shadow-normalBias={0.1}
      intensity={0}
    />
  );
}

/** --- STEADY LIGHT (tight beam, no attenuation) --- */
function SteadyLight({
  group,
  intensity = 700,
}: {
  group: React.MutableRefObject<THREE.Group | null>;
  intensity?: number;
}) {
  const spot = useRef<THREE.SpotLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (spot.current && !spot.current.target.parent) scene.add(spot.current.target);
  }, [scene]);

  useFrame(() => {
    if (!spot.current) return;
    shapeTightSpot(spot.current, group, scene);
    spot.current.intensity = intensity;
  });

  return (
    <spotLight
      ref={spot}
      color="#ffffff"
      penumbra={1}
      castShadow
      shadow-mapSize={[4096, 4096]}
      shadow-bias={-0.0005}
      shadow-normalBias={0.1}
    />
  );
}

/** --- Small non-shadowing fill (lifts crushed blacks lightly) --- */
function GentleFill({
  group,
  intensity = 28,
}: {
  group: React.MutableRefObject<THREE.Group | null>;
  intensity?: number;
}) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const l = ref.current;
    if (!l || !group.current) return;
    const box = new THREE.Box3().setFromObject(group.current);
    if (box.isEmpty()) return;
    const s = box.getBoundingSphere(new THREE.Sphere());
    const c = s.center;
    const r = s.radius;
    l.position.set(c.x + r * 0.4, c.y + r * 0.7, c.z + r * 1.4);
    l.intensity = intensity;
    l.distance = r * 1.6;
    l.decay = 2;
  });
  return <pointLight ref={ref} castShadow={false} />;
}

/** --- Camera distance lock: recomputes when models become available --- */
function CameraDistanceLock({
  group,
  margin = 1.25,
  distK = 1.2,
}: {
  group: React.MutableRefObject<THREE.Group | null>;
  margin?: number;
  distK?: number;
}) {
  const camera = useThree((s) => s.camera as THREE.PerspectiveCamera);
  // Drei stores controls in the internal state; type it to OrbitControlsImpl | undefined
  const controls = useThree(
    (s) => (s as unknown as { controls?: OrbitControlsImpl }).controls,
  );
  const baseDist = useRef(0);
  const center = useRef(new THREE.Vector3());
  const ready = useRef(false);

  // Keep checking until the group actually has bounds (works with Suspense)
  useFrame(() => {
    if (ready.current || !group.current) return;

    const box = new THREE.Box3().setFromObject(group.current);
    if (box.isEmpty()) return; // not loaded yet

    const sphere = box.getBoundingSphere(new THREE.Sphere());
    center.current.copy(sphere.center);
    const r = Math.max(0.001, sphere.radius * margin);

    const fov = THREE.MathUtils.degToRad(camera.fov);
    baseDist.current = r / Math.sin(fov / 2);

    const desired = baseDist.current * distK;
    const tgt = controls?.target ?? center.current;
    if (controls?.target) controls.target.copy(center.current);

    const dir = camera.position.clone().sub(tgt).normalize();
    camera.position
      .copy(center.current)
      .addScaledVector(dir.length() ? dir : new THREE.Vector3(0, 0, 1), desired);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.enableZoom = false;
      controls.minDistance = desired;
      controls.maxDistance = desired;
      controls.update();
    }
    ready.current = true;
  });

  // If distK changes later, update distance
  useEffect(() => {
    if (!ready.current) return;
    const desired = baseDist.current * distK;
    const tgt = controls?.target ?? center.current;
    const dir = camera.position.clone().sub(tgt).normalize();
    camera.position.copy(tgt).addScaledVector(dir, desired);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.minDistance = desired;
      controls.maxDistance = desired;
      controls.enableZoom = false;
      controls.update();
    }
  }, [distK, camera, controls]);

  return null;
}

/** --- MAIN --- */
export default function HomeSection() {
  const models = useRef<THREE.Group>(null);
  const { active } = useProgress();
  const [phase, setPhase] = useState<'loading' | 'flicker' | 'steady'>('loading');
  const [dbg, setDbg] = useState(false); // emergency light toggle (optional)

  useEffect(() => {
    if (!active && phase === 'loading') setPhase('flicker');
  }, [active, phase]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const id = window.setTimeout(() => {
      setPhase((p) => (p === 'loading' ? 'flicker' : p));
    }, 4000);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key?.toLowerCase?.();
      if (k === 'r') setPhase('flicker');
      if (k === 'd') setDbg((v) => !v);
    };
    const opts: AddEventListenerOptions = { capture: true };
    window.addEventListener('keydown', onKey, opts);
    return () => window.removeEventListener('keydown', onKey, opts);
  }, []);

  return (
    // Section-sized hero so it aligns with your left rail layout
    <section
      id="hero"
      className="relative min-h-[80vh] md:min-h-[90vh] w-full overflow-hidden bg-black"
    >
      <div className="absolute inset-0 z-0">
        <Canvas
          className="absolute inset-0 w-full h-full"
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true }}
          camera={{ fov: 35, near: 0.1, far: 5000 }}
          onCreated={({ gl, scene }) => {
            // WebGLRenderer types include these
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.85;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            // avoid setting non-existent scene props (environmentIntensity)
            scene.environment = null;
            scene.background = new THREE.Color(0x000000);
            gl.setClearColor(0x000000, 1);
          }}
        >
          {/* Soft shadow filter */}
          <SoftShadows size={12} samples={32} focus={0.5} />

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            enableZoom={false} // lock user zoom
            minPolarAngle={THREE.MathUtils.degToRad(0)}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Robust: frames once models actually exist, then locks to 1.20× */}
          <CameraDistanceLock group={models} margin={1.25} distK={1.2} />

          <Suspense fallback={<Html center>loading 3D…</Html>}>
            <group ref={models}>
              <GLB url={PATHS.desk} />
              <GLB url={PATHS.computer} />
              <GLB url={PATHS.controller} />
              <GLB url={PATHS.poster} />
              <GLB url={PATHS.xbox} />
              <GLB url={PATHS.chair} />
            </group>

            <InfiniteFloorAtGroup group={models} radius={45} />
          </Suspense>

          {phase === 'flicker' && (
            <FlickerSpot
              group={models}
              active
              loops={3}
              onEnd={() => setPhase('steady')}
            />
          )}
          {phase === 'steady' && (
            <>
              <SteadyLight group={models} intensity={700} />
              <GentleFill group={models} intensity={28} />
            </>
          )}

          {/* Optional: emergency debug light */}
          {dbg && (
            <>
              <directionalLight
                position={[8, 12, 8]}
                intensity={3.0}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              <ambientLight intensity={0.15} />
            </>
          )}
        </Canvas>

        {/* Loader covers only the hero area */}
        <Loader
          containerStyles={{
            background: '#000',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
          innerStyles={{ borderRadius: 8 }}
          barStyles={{ background: '#fff' }}
          dataStyles={{ color: '#fff', fontSize: 12 }}
        />

        <HeroOverlay />
        <HeroCTAs />
        <div data-rail-anchor data-rail-offset="40vh" className="pointer-events-none select-none sr-only" />
      </div>
    </section>
  );
}
