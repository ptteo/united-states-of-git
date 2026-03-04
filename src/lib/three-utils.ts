// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — 3D Utility Functions
// ═══════════════════════════════════════════════════════

import * as THREE from 'three';

/** Convert lat/lng to a point on a sphere of given radius */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/** Get the normal (outward direction) at a point on the sphere */
export function getGlobeNormal(lat: number, lng: number): THREE.Vector3 {
  return latLngToVector3(lat, lng, 1).normalize();
}

/** Create a quaternion that orients an object to stand perpendicular to the globe surface */
export function getOrientationOnGlobe(lat: number, lng: number): THREE.Quaternion {
  const normal = getGlobeNormal(lat, lng);
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(up, normal);
  return quaternion;
}

/** Create a Tron-themed glow material */
export function createGlowMaterial(color: string, intensity: number = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      intensity: { value: intensity },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        float glow = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        float pulse = 0.8 + 0.2 * sin(time * 2.0 + vPosition.y * 3.0);
        gl_FragColor = vec4(glowColor * glow * intensity * pulse, glow * 0.6);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    depthWrite: false,
  });
}

/** Map activity level to pulse speed */
export function activityToPulseSpeed(activity: string): number {
  switch (activity) {
    case 'blazing': return 3.0;
    case 'active': return 2.0;
    case 'moderate': return 1.2;
    case 'slow': return 0.5;
    case 'dormant': return 0.1;
    default: return 1.0;
  }
}

/** Format large numbers nicely */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Easing function for camera transitions */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
