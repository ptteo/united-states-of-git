'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — TronGlobe Component
//  A vivid Tron-style 3D globe with glowing continents,
//  animated grid, and atmospheric effects.
//  Created by Prabhat Teotia
// ═══════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GLOBE_RADIUS = 2.5;
const GRID_SEGMENTS = 72;

// ─── Helpers ─────────────────────────────────────────
function latLngToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─── Continent outlines (simplified polylines: [lat, lng][]) ────
const CONTINENT_OUTLINES: [number, number][][] = [
  // North America
  [[49,-125],[48,-123],[45,-124],[42,-124],[39,-123],[35,-121],[33,-117],
   [31,-116],[29,-114],[25,-110],[22,-106],[20,-105],[17,-101],[16,-96],
   [15,-93],[16,-89],[18,-88],[21,-87],[25,-90],[29,-89],[30,-84],
   [27,-82],[25,-80],[30,-81],[35,-75],[37,-76],[40,-74],[41,-72],
   [43,-70],[44,-67],[47,-68],[47,-65],[44,-59],[46,-60],[49,-64],
   [52,-56],[55,-58],[58,-60],[60,-64],[63,-69],[67,-63],[70,-55],
   [73,-56],[76,-68],[83,-72],[83,-64],[80,-67],[75,-65],[70,-55],
   [67,-63],[63,-69],[64,-76],[69,-82],[70,-87],[68,-96],[65,-96],
   [60,-95],[56,-96],[52,-95],[51,-94],[50,-90],[50,-85],[52,-82],
   [55,-85],[55,-82],[56,-76],[58,-70],[62,-67],[60,-64]],
  // Alaska
  [[54,-130],[58,-136],[60,-141],[64,-142],[66,-141],[69,-141],
   [71,-156],[71,-163],[65,-168],[60,-165],[57,-157],[56,-153],
   [59,-149],[60,-146],[58,-138],[56,-133],[54,-132],[54,-130]],
  // Central America
  [[20,-105],[19,-104],[17,-101],[16,-96],[15,-93],[14,-90],
   [14,-87],[13,-84],[10,-84],[9,-80],[8,-77],[7,-78],[9,-80],
   [10,-84],[13,-84],[14,-87],[14,-90],[15,-93]],
  // South America
  [[12,-72],[11,-75],[8,-77],[5,-77],[2,-80],[-1,-80],[-5,-81],
   [-6,-80],[-4,-78],[-2,-80],[0,-76],[-1,-75],[-4,-70],[-8,-73],
   [-10,-76],[-14,-76],[-16,-75],[-18,-71],[-22,-70],[-24,-70],
   [-27,-71],[-30,-72],[-33,-72],[-35,-73],[-41,-74],[-46,-75],
   [-50,-75],[-52,-71],[-55,-66],[-55,-64],[-52,-68],[-48,-66],
   [-44,-65],[-39,-62],[-36,-57],[-33,-53],[-29,-49],[-26,-48],
   [-23,-44],[-22,-41],[-18,-39],[-13,-38],[-10,-36],[-7,-35],
   [-5,-35],[-2,-42],[-1,-48],[0,-50],[2,-50],[5,-52],[6,-57],
   [8,-63],[10,-65],[10,-67],[12,-68],[12,-72]],
  // Europe
  [[36,-9],[37,-6],[36,-5],[36,-2],[38,0],[39,3],[43,5],[44,9],
   [46,10],[47,7],[49,2],[51,2],[52,5],[54,8],[56,8],[57,10],
   [59,11],[60,5],[63,5],[65,12],[68,16],[70,20],[71,28],
   [69,33],[67,41],[66,44],[68,44],[70,26],[71,28],[72,21],
   [71,16],[70,20],[68,16],[65,25],[64,26],[61,28],[60,28],
   [60,24],[58,24],[57,24],[56,21],[55,21],[54,18],[53,14],
   [52,14],[50,20],[49,18],[48,17],[47,15],[46,16],[44,12],
   [42,15],[41,17],[40,20],[39,20],[38,24],[36,28],[36,23],
   [38,24],[40,26],[42,27],[42,30],[42,36],[40,44]],
  // Iberian Peninsula
  [[36,-9],[37,-6],[36,-5],[38,-7],[39,-9],[42,-9],[43,-8],
   [43,-2],[41,0],[39,3],[38,0],[37,-2],[36,-6],[36,-9]],
  // Italy
  [[44,9],[44,12],[43,12],[42,12],[41,14],[40,16],[39,17],
   [38,16],[38,15],[39,18],[40,18],[41,16],[42,14],[43,14],
   [44,12],[46,13],[47,15],[46,10],[44,9]],
  // British Isles
  [[50,-5],[51,-3],[52,-1],[53,0],[54,0],[55,-2],[56,-3],
   [57,-5],[58,-3],[58,-5],[57,-6],[56,-5],[55,-3],[54,-1],
   [53,0],[52,-1],[51,-3],[50,-5]],
  // Scandinavia
  [[56,12],[57,12],[58,16],[59,18],[60,18],[61,17],[63,18],
   [65,15],[68,16],[70,20],[70,28],[69,27],[68,20],[65,15],
   [63,18],[61,17],[60,18],[59,18],[58,16],[57,12],[56,12]],
  // Africa
  [[37,10],[35,0],[34,-2],[32,-1],[31,-4],[30,-10],[28,-13],
   [25,-15],[24,-17],[21,-17],[18,-16],[15,-17],[12,-16],
   [10,-15],[8,-14],[5,-8],[4,-1],[4,2],[5,2],[4,7],
   [4,9],[2,10],[0,10],[-1,9],[-3,12],[-6,12],[-10,13],
   [-11,17],[-14,18],[-16,20],[-22,26],[-27,28],[-30,28],
   [-34,26],[-34,23],[-33,18],[-30,17],[-27,15],[-24,14],
   [-22,14],[-18,12],[-15,12],[-12,14],[-11,14],[-6,12],
   [-3,12],[-1,9],[0,10],[2,10],[4,9],[4,7],[5,2],[4,2],
   [4,-1],[5,-8],[8,-14],[10,-15],[12,-16],[15,-17],
   [18,-16],[21,-17],[24,-17],[25,-15],[28,-13],[30,-10],
   [32,-1],[33,5],[36,5],[37,10]],
  // Africa East coast
  [[37,10],[34,11],[33,13],[31,25],[32,32],[30,32],[27,34],
   [22,36],[18,42],[15,43],[12,44],[11,43],[10,45],[8,48],
   [5,42],[2,41],[-1,42],[-4,40],[-10,40],[-15,37],[-22,35],
   [-26,33],[-29,31],[-32,28],[-34,26]],
  // Middle East
  [[32,36],[33,36],[35,36],[37,36],[37,40],[37,45],[35,45],
   [33,44],[31,48],[29,48],[27,56],[25,58],[24,57],[22,59],
   [21,59],[16,52],[13,48],[13,44],[12,44],[15,43],[18,42],
   [22,36],[24,38],[27,34],[31,35],[32,36]],
  // India
  [[35,73],[33,74],[30,68],[28,70],[24,72],[22,69],[20,73],
   [16,74],[13,75],[10,77],[8,77],[8,78],[10,80],[13,80],
   [16,82],[19,85],[21,87],[23,89],[26,89],[28,87],[29,81],
   [30,76],[31,75],[33,74],[35,73]],
  // China + East Asia
  [[53,87],[50,87],[47,83],[42,76],[40,74],[37,71],[35,73],
   [37,79],[33,80],[29,81],[28,84],[27,88],[26,89],[23,89],
   [22,97],[23,99],[22,101],[20,100],[18,103],[22,106],
   [22,108],[19,111],[22,111],[25,110],[28,112],[30,121],
   [32,122],[34,120],[37,122],[39,122],[42,124],[43,131],
   [45,133],[48,135],[50,131],[54,130],[56,135],[60,131],
   [62,131],[62,120],[60,115],[55,97],[54,92],[53,87]],
  // Japan
  [[31,131],[33,131],[35,134],[36,137],[38,140],[40,140],
   [42,140],[44,145],[45,142],[43,141],[41,141],[39,140],
   [37,137],[35,135],[34,133],[33,131],[31,131]],
  // SE Asia
  [[20,100],[18,103],[15,101],[14,99],[10,99],[7,100],[5,103],
   [2,104],[1,103],[1,105],[3,106],[6,106],[8,101],[10,99],
   [14,99],[18,103],[20,100]],
  // Australia
  [[-12,132],[-14,136],[-16,138],[-17,141],[-16,146],[-19,147],
   [-22,150],[-27,153],[-30,153],[-35,151],[-38,147],[-39,147],
   [-38,141],[-36,137],[-34,136],[-33,134],[-32,128],[-34,116],
   [-35,117],[-33,120],[-31,116],[-27,114],[-24,114],[-20,119],
   [-18,122],[-15,130],[-14,130],[-12,132]],
  // New Zealand
  [[-34,173],[-36,174],[-38,176],[-41,175],[-43,173],[-45,170],
   [-47,167],[-46,167],[-44,169],[-42,172],[-40,176],[-38,178],
   [-37,176],[-36,174],[-34,173]],
  // Indonesia
  [[-6,106],[-7,107],[-8,110],[-8,114],[-7,116],[-8,118],
   [-9,119],[-8,121],[-7,118],[-6,116],[-6,114],[-7,112],
   [-7,110],[-6,107],[-6,106]],
  // Russia far east
  [[62,131],[64,135],[66,140],[68,160],[67,170],[65,170],
   [63,165],[60,163],[56,157],[52,141],[50,131],[48,135],
   [50,131],[54,130],[56,135],[60,131],[62,131]],
];

// ─── Land region definitions for dot fill ────────────
const LAND_REGIONS = [
  { latMin: 25, latMax: 70, lngMin: -130, lngMax: -55, density: 2.0 },
  { latMin: 10, latMax: 25, lngMin: -120, lngMax: -80, density: 2.5 },
  { latMin: -55, latMax: 12, lngMin: -82, lngMax: -35, density: 2.0 },
  { latMin: 36, latMax: 72, lngMin: -10, lngMax: 42, density: 1.8 },
  { latMin: -35, latMax: 37, lngMin: -18, lngMax: 52, density: 2.0 },
  { latMin: 10, latMax: 55, lngMin: 42, lngMax: 80, density: 2.5 },
  { latMin: 8, latMax: 35, lngMin: 68, lngMax: 90, density: 1.8 },
  { latMin: 18, latMax: 55, lngMin: 80, lngMax: 145, density: 2.0 },
  { latMin: -10, latMax: 20, lngMin: 95, lngMax: 140, density: 2.5 },
  { latMin: -40, latMax: -11, lngMin: 113, lngMax: 154, density: 2.0 },
  { latMin: 50, latMax: 75, lngMin: 42, lngMax: 180, density: 3.5 },
  { latMin: 60, latMax: 80, lngMin: -170, lngMax: -140, density: 4 },
];

export default function TronGlobe() {
  const globeRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const oceanRef = useRef<THREE.Mesh>(null);

  // ─── Ocean surface shader (animated deep-blue with grid lines) ───
  const oceanMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color('#0a1a42') },
          gridColor: { value: new THREE.Color('#00f0ff') },
          cameraPosition: { value: new THREE.Vector3(0, 1.5, 8) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          varying vec2 vUv;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 baseColor;
          uniform vec3 gridColor;
          uniform vec3 cameraPosition;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vWorldPosition;
          varying vec2 vUv;

          void main() {
            // Camera-relative view direction for correct Fresnel from any angle
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);

            // Base deep-ocean blue — visible, not black
            vec3 col = baseColor;

            // Fresnel rim glow — follows camera so it's always visible at edges
            float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
            float rim = pow(fresnel, 2.0) * 0.8;
            col += gridColor * rim;

            // Center fill — subtle radial glow so face-on parts aren't black
            float centerFill = pow(max(dot(vNormal, viewDir), 0.0), 1.5) * 0.12;
            col += gridColor * centerFill;

            // Subtle animated latitude/longitude grid on the sphere
            float lat = asin(clamp(vPosition.y / length(vPosition), -1.0, 1.0));
            float lng = atan(vPosition.z, vPosition.x);

            float latLine = smoothstep(0.02, 0.0, abs(mod(lat * 12.0, 1.0) - 0.5) - 0.47);
            float lngLine = smoothstep(0.02, 0.0, abs(mod(lng * 12.0 / 3.14159, 1.0) - 0.5) - 0.47);
            float gridIntensity = max(latLine, lngLine) * 0.18;
            col += gridColor * gridIntensity;

            // Animated pulse wave across the surface
            float wave = sin(lat * 6.0 - time * 0.3) * 0.5 + 0.5;
            col += gridColor * wave * 0.04;

            // Subtle inner glow that brightens the whole surface
            float viewGlow = pow(fresnel, 4.0) * 0.2;
            col += gridColor * viewGlow;

            gl_FragColor = vec4(col, 1.0);
          }
        `,
        side: THREE.FrontSide,
      }),
    []
  );

  // ─── Outer atmosphere glow (always visible rim) ───
  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color('#00f0ff') },
          color2: { value: new THREE.Color('#ff00e5') },
          cameraPosition: { value: new THREE.Vector3(0, 1.5, 8) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 cameraPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            // Camera-relative glow — follows camera orbit
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float facing = dot(vNormal, viewDir);
            float intensity = pow(0.72 - facing, 2.5);
            float wave = sin(vWorldPosition.y * 4.0 + time * 0.5) * 0.5 + 0.5;
            vec3 col = mix(color1, color2, wave);
            gl_FragColor = vec4(col * intensity * 1.5, intensity * 0.5);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  // ─── Continent outline THREE.Line objects ───
  const continentLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#00f0ff'),
      transparent: true,
      opacity: 0.9,
      linewidth: 1,
    });
    return CONTINENT_OUTLINES.map((outline) => {
      const points = outline.map(([lat, lng]) =>
        latLngToSphere(lat, lng, GLOBE_RADIUS + 0.012)
      );
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geo, mat);
    });
  }, []);

  // ─── Land continent fill glow (second pass, brighter) ───
  const continentFillLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#0080ff'),
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
    });
    return CONTINENT_OUTLINES.map((outline) => {
      const points = outline.map(([lat, lng]) =>
        latLngToSphere(lat, lng, GLOBE_RADIUS + 0.006)
      );
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geo, mat);
    });
  }, []);

  // ─── Land mass dot-field ───
  const landDotGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const r = GLOBE_RADIUS + 0.006;
    const landColor = new THREE.Color('#1a6fff');
    const highlightColor = new THREE.Color('#00f0ff');

    let seed = 42;
    const seededRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (const region of LAND_REGIONS) {
      for (let lat = region.latMin; lat < region.latMax; lat += region.density) {
        for (let lng = region.lngMin; lng < region.lngMax; lng += region.density) {
          const jLat = lat + (seededRandom() - 0.5) * region.density * 0.6;
          const jLng = lng + (seededRandom() - 0.5) * region.density * 0.6;
          const pos = latLngToSphere(jLat, jLng, r);
          positions.push(pos.x, pos.y, pos.z);

          // Mix in some highlight dots
          const isHighlight = seededRandom() > 0.85;
          const c = isHighlight ? highlightColor : landColor;
          colors.push(c.r, c.g, c.b);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, []);

  // ─── Lat/Lng grid (subtle) ───
  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const r = GLOBE_RADIUS + 0.003;

    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lng = 0; lng <= 360; lng += 2) {
        const phi1 = (90 - lat) * (Math.PI / 180);
        const theta1 = lng * (Math.PI / 180);
        const phi2 = (90 - lat) * (Math.PI / 180);
        const theta2 = (lng + 2) * (Math.PI / 180);
        points.push(
          new THREE.Vector3(-r*Math.sin(phi1)*Math.cos(theta1), r*Math.cos(phi1), r*Math.sin(phi1)*Math.sin(theta1)),
          new THREE.Vector3(-r*Math.sin(phi2)*Math.cos(theta2), r*Math.cos(phi2), r*Math.sin(phi2)*Math.sin(theta2))
        );
      }
    }
    for (let lng = 0; lng < 360; lng += 15) {
      for (let lat = -90; lat < 90; lat += 2) {
        const phi1 = (90 - lat) * (Math.PI / 180);
        const theta1 = lng * (Math.PI / 180);
        const phi2 = (90 - (lat + 2)) * (Math.PI / 180);
        const theta2 = lng * (Math.PI / 180);
        points.push(
          new THREE.Vector3(-r*Math.sin(phi1)*Math.cos(theta1), r*Math.cos(phi1), r*Math.sin(phi1)*Math.sin(theta1)),
          new THREE.Vector3(-r*Math.sin(phi2)*Math.cos(theta2), r*Math.cos(phi2), r*Math.sin(phi2)*Math.sin(theta2))
        );
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#00f0ff'),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    []
  );

  // ─── Animation loop ───
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const camPos = state.camera.position;

    // Update ocean shader time + camera position for correct Fresnel
    if (oceanRef.current) {
      const mat = oceanRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.time.value = t;
      mat.uniforms.cameraPosition.value.copy(camPos);
    }
    // Update glow shader time + camera position
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.time.value = t;
      mat.uniforms.cameraPosition.value.copy(camPos);
    }
  });

  return (
    <group ref={globeRef}>
      {/* Ocean surface with built-in grid and rim glow */}
      <mesh ref={oceanRef}>
        <sphereGeometry args={[GLOBE_RADIUS, GRID_SEGMENTS, GRID_SEGMENTS]} />
        <primitive object={oceanMaterial} attach="material" />
      </mesh>

      {/* Land mass dots — colored per-vertex */}
      <points geometry={landDotGeometry}>
        <pointsMaterial
          vertexColors
          size={0.035}
          transparent
          opacity={0.9}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Continent outlines — bright cyan */}
      {continentLines.map((lineObj, i) => (
        <primitive key={`coast-${i}`} object={lineObj} />
      ))}

      {/* Continent outlines — second pass, inner glow */}
      {continentFillLines.map((lineObj, i) => (
        <primitive key={`fill-${i}`} object={lineObj} />
      ))}

      {/* Lat/Lng grid lines */}
      <lineSegments geometry={gridGeometry} material={gridMaterial} />

      {/* Outer atmospheric glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.15, 48, 48]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Equator ring — bright */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS + 0.01, 0.006, 8, 128]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Tropic lines */}
      {[23.5, -23.5].map((lat) => {
        const r2 = GLOBE_RADIUS * Math.cos(lat * Math.PI / 180);
        const y2 = GLOBE_RADIUS * Math.sin(lat * Math.PI / 180);
        return (
          <mesh key={`tropic-${lat}`} rotation={[Math.PI / 2, 0, 0]} position={[0, y2, 0]}>
            <torusGeometry args={[r2 + 0.005, 0.003, 6, 64]} />
            <meshBasicMaterial color="#ffe600" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}

      {/* Arctic/Antarctic circles */}
      {[66.5, -66.5].map((lat) => {
        const r2 = GLOBE_RADIUS * Math.cos(lat * Math.PI / 180);
        const y2 = GLOBE_RADIUS * Math.sin(lat * Math.PI / 180);
        return (
          <mesh key={`arctic-${lat}`} rotation={[Math.PI / 2, 0, 0]} position={[0, y2, 0]}>
            <torusGeometry args={[r2 + 0.004, 0.002, 6, 64]} />
            <meshBasicMaterial color="#ff00e5" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
    </group>
  );
}

export { GLOBE_RADIUS };
