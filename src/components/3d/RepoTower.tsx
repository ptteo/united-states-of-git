'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — RepoTower Component
//  Glowing neon tower representing a GitHub repository
// ═══════════════════════════════════════════════════════

import { useRef, useState, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RepoData, getLanguageColor } from '@/lib/types';
import { latLngToVector3, getOrientationOnGlobe, formatNumber, activityToPulseSpeed } from '@/lib/three-utils';
import { GLOBE_RADIUS } from './TronGlobe';

interface RepoTowerProps {
  repo: RepoData;
  onClick: (repo: RepoData) => void;
  onHover: (repo: RepoData | null) => void;
  isSelected: boolean;
  isHovered: boolean;
}

function RepoTowerInner({ repo, onClick, onHover, isSelected, isHovered }: RepoTowerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [localHover, setLocalHover] = useState(false);

  // Generate a deterministic random location for repos without one
  const { lat, lng } = useMemo(() => {
    if (repo.location) return repo.location;
    // Deterministic hash from repo id → scatter on globe
    let hash = 0;
    for (let i = 0; i < repo.id.length; i++) {
      hash = ((hash << 5) - hash) + repo.id.charCodeAt(i);
      hash |= 0;
    }
    const hash2 = Math.abs((hash * 16807) % 2147483647);
    const hash3 = Math.abs((hash2 * 16807) % 2147483647);
    return {
      lat: -60 + (hash2 % 12000) / 100,
      lng: -180 + (hash3 % 36000) / 100,
    };
  }, [repo.id, repo.location]);

  const color = getLanguageColor(repo.language);

  // Tower height normalized (min 0.08, max 0.8)
  const height = useMemo(() => {
    const normalized = Math.min(1, repo.towerHeight / 15);
    return 0.08 + normalized * 0.72;
  }, [repo.towerHeight]);

  // Position on globe surface
  const position = useMemo(() => latLngToVector3(lat, lng, GLOBE_RADIUS), [lat, lng]);
  const orientation = useMemo(() => getOrientationOnGlobe(lat, lng), [lat, lng]);
  const pulseSpeed = useMemo(() => activityToPulseSpeed(repo.recentActivity), [repo.recentActivity]);

  // Tower base width based on contributors
  const baseWidth = useMemo(() => {
    const w = 0.01 + Math.log10(Math.max(repo.contributors, 1)) * 0.008;
    return Math.min(0.05, w);
  }, [repo.contributors]);

  // Glow material
  const towerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9,
      }),
    [color]
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) },
          time: { value: 0 },
          pulseSpeed: { value: pulseSpeed },
          intensity: { value: repo.glowIntensity },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float pulseSpeed;
          uniform float intensity;
          varying vec2 vUv;
          void main() {
            float pulse = 0.6 + 0.4 * sin(time * pulseSpeed + vUv.y * 6.28);
            float edgeGlow = 1.0 - abs(vUv.x - 0.5) * 2.0;
            float topGlow = smoothstep(0.0, 1.0, vUv.y);
            float alpha = edgeGlow * pulse * intensity * 0.4 * (0.5 + topGlow * 0.5);
            gl_FragColor = vec4(color * pulse * intensity, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [color, pulseSpeed, repo.glowIntensity]
  );

  // Animate
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowRef.current) {
      (glowRef.current.material as THREE.ShaderMaterial).uniforms.time.value = t;
    }

    // Hover/select scale animation
    if (meshRef.current) {
      const targetScale = isSelected ? 1.5 : localHover || isHovered ? 1.25 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  const handlePointerOver = (e: THREE.Event) => {
    (e as any).stopPropagation(); // eslint-disable-line @typescript-eslint/no-explicit-any
    setLocalHover(true);
    onHover(repo);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setLocalHover(false);
    onHover(null);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e: THREE.Event) => {
    (e as any).stopPropagation(); // eslint-disable-line @typescript-eslint/no-explicit-any
    onClick(repo);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      quaternion={orientation}
    >
      {/* Tower body */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[baseWidth, height, baseWidth]} />
        <primitive object={towerMaterial} attach="material" />
      </mesh>

      {/* Tower glow shell */}
      <mesh ref={glowRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[baseWidth * 2.5, height * 1.1, baseWidth * 2.5]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Base glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[baseWidth * 3, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15 + (localHover || isHovered ? 0.2 : 0)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Floating label - shows on hover */}
      {(localHover || isHovered || isSelected) && (
        <Html
          position={[0, height + 0.12, 0]}
          center
          distanceFactor={5}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
            <div
              className="px-2.5 py-1 text-xs font-bold rounded glow-text-cyan"
              style={{
                background: 'rgba(3, 8, 20, 0.9)',
                border: `1px solid ${color}40`,
                color,
                textShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
                fontFamily: 'monospace',
              }}
            >
              {repo.fullName}
            </div>
            <div
              className="flex gap-2 text-[10px] font-mono"
              style={{
                color: '#c8daf0',
                textShadow: '0 0 4px rgba(0,240,255,0.5)',
              }}
            >
              <span>★ {formatNumber(repo.stars)}</span>
              <span>◆ {formatNumber(repo.contributors)}</span>
              {repo.language && <span style={{ color }}>● {repo.language}</span>}
            </div>
          </div>
        </Html>
      )}

      {/* Top beacon light for selected */}
      {isSelected && (
        <pointLight
          position={[0, height + 0.1, 0]}
          color={color}
          intensity={2}
          distance={1}
        />
      )}
    </group>
  );
}

// Memoize to prevent re-renders when parent (TowerLayer) re-renders
// but this tower's data hasn't changed
const RepoTower = memo(RepoTowerInner, (prev, next) => {
  return (
    prev.repo.id === next.repo.id &&
    prev.repo.stars === next.repo.stars &&
    prev.repo.forks === next.repo.forks &&
    prev.repo.towerHeight === next.repo.towerHeight &&
    prev.repo.recentActivity === next.repo.recentActivity &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered
  );
});

export default RepoTower;
