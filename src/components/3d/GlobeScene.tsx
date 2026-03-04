'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — GlobeScene
//  Main 3D scene with globe, towers, camera, and effects
// ═══════════════════════════════════════════════════════

import { Suspense, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import TronGlobe from './TronGlobe';
import RepoTower from './RepoTower';
import { useUSGStore } from '@/lib/store';
import { latLngToVector3 } from '@/lib/three-utils';
import { GLOBE_RADIUS } from './TronGlobe';

// ─── Camera Controller ──────────────────────────────────
function CameraController() {
  const { camera } = useThree();
  const selectedRepo = useUSGStore((s) => s.selectedRepo);
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));
  const isAnimating = useRef(false);

  useEffect(() => {
    if (selectedRepo?.location) {
      const { lat, lng } = selectedRepo.location;
      const surfacePoint = latLngToVector3(lat, lng, GLOBE_RADIUS);
      const direction = surfacePoint.clone().normalize();
      targetPos.current = direction.multiplyScalar(5.5);
      isAnimating.current = true;
    } else {
      targetPos.current = new THREE.Vector3(0, 1.5, 8);
      isAnimating.current = true;
    }
  }, [selectedRepo]);

  useFrame(() => {
    if (isAnimating.current) {
      camera.position.lerp(targetPos.current, 0.02);
      camera.lookAt(0, 0, 0);
      if (camera.position.distanceTo(targetPos.current) < 0.05) {
        isAnimating.current = false;
      }
    }
  });

  return null;
}

// ─── Particle field ──────────────────────────────────────
const ParticleField = memo(function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const arr = new Float32Array(3000);
    for (let i = 0; i < 3000; i += 3) {
      arr[i] = (Math.random() - 0.5) * 30;
      arr[i + 1] = (Math.random() - 0.5) * 30;
      arr[i + 2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00f0ff"
        size={0.015}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
});

// ─── Tower Layer (isolated re-renders) ───────────────────
// This component subscribes to store data and re-renders
// only the towers, without triggering Canvas or globe re-renders.
function TowerLayer() {
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const selectedRepo = useUSGStore((s) => s.selectedRepo);
  const hoveredRepo = useUSGStore((s) => s.hoveredRepo);
  const selectRepo = useUSGStore((s) => s.selectRepo);
  const hoverRepo = useUSGStore((s) => s.hoverRepo);

  const handleTowerClick = useCallback(
    (repo: typeof selectedRepo) => {
      selectRepo(selectedRepo?.id === repo?.id ? null : repo);
    },
    [selectedRepo, selectRepo]
  );

  const handleTowerHover = useCallback(
    (repo: typeof hoveredRepo) => {
      hoverRepo(repo);
    },
    [hoverRepo]
  );

  return (
    <>
      {filteredRepos.map((repo) => (
        <RepoTower
          key={repo.id}
          repo={repo}
          onClick={handleTowerClick}
          onHover={handleTowerHover}
          isSelected={selectedRepo?.id === repo.id}
          isHovered={hoveredRepo?.id === repo.id}
        />
      ))}
    </>
  );
}

// ─── Main Globe Scene ────────────────────────────────────
export default function GlobeScene() {
  const globeAutoRotate = useUSGStore((s) => s.globeAutoRotate);

  // Stable offset object — never recreated
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.0003, 0.0003), []);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.5, 8], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#030814'), 1);
        }}
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-sm font-mono text-tron-cyan mb-2">WebGL Not Available</p>
              <p className="text-xs font-mono text-tron-text-dim">
                Your browser doesn&apos;t support 3D rendering. Try switching to Map or List view.
              </p>
            </div>
          </div>
        }
      >
        <Suspense fallback={null}>
          {/* Lighting — brighter for vivid Tron look */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} color="#88bbff" />
          <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#ff00e5" />
          <pointLight position={[0, 8, 0]} intensity={0.5} color="#00f0ff" />
          <pointLight position={[0, -8, 0]} intensity={0.15} color="#0055ff" />

          {/* Camera */}
          <CameraController />
          <OrbitControls
            autoRotate={globeAutoRotate}
            autoRotateSpeed={0.3}
            enableZoom
            enablePan={false}
            minDistance={3.5}
            maxDistance={15}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />

          {/* Globe */}
          <TronGlobe />

          {/* Repository Towers — isolated re-render boundary */}
          <TowerLayer />

          {/* Background elements */}
          <Stars radius={50} depth={50} count={2000} factor={2} fade speed={0.5} />
          <ParticleField />
          <Environment preset="night" />

          {/* Post-processing — vivid bloom */}
          <EffectComposer>
            <Bloom
              intensity={1.2}
              luminanceThreshold={0.08}
              luminanceSmoothing={0.85}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={chromaticOffset}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
