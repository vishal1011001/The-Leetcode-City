"use client";

import { useRef, useMemo, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CityBuilding } from "@/lib/github";

// ─── Constants ───────────────────────────────────────────────────────────────

const FLAKE_COUNT = 900;
const WEATHER_AREA = 2200;
const WEATHER_HALF_AREA = WEATHER_AREA / 2;
const WEATHER_TOP = 420;
const WEATHER_BOTTOM = 10;

const BREATH_COUNT = 80;
const BREATH_MAX_Y = 38;

const MAX_ICICLE_BUILDINGS = 180;
const ICICLES_PER_BUILDING = 3;
const TOTAL_ICICLE_INSTANCES = MAX_ICICLE_BUILDINGS * ICICLES_PER_BUILDING;

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
};

const wrap = (value: number, center: number) => {
  const w = ((value - center + WEATHER_HALF_AREA) % WEATHER_AREA + WEATHER_AREA) % WEATHER_AREA;
  return center + w - WEATHER_HALF_AREA;
};

// ─── Snowflake Shader ────────────────────────────────────────────────────────
//
// Per-particle aSize (world-space units) drives perspective-correct point size.
// Per-particle aAngle rotates the 6-arm star pattern, giving each flake a
// unique orientation that persists as it falls.

const snowflakeVertex = `
  attribute float aSize;
  attribute float aAngle;
  varying float vAngle;

  void main() {
    vAngle = aAngle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (280.0 / max(-mvPosition.z, 1.0));
    gl_PointSize = clamp(gl_PointSize, 1.5, 22.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const snowflakeFragment = `
  uniform float uOpacity;
  varying float vAngle;

  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;

    float c = cos(vAngle);
    float s = sin(vAngle);
    vec2 r = vec2(c * coord.x - s * coord.y, s * coord.x + c * coord.y);

    // 3 lines at 0°/60°/120° produce a 6-arm snowflake
    float arm1 = abs(r.x);
    float arm2 = abs(r.x * 0.5 + r.y * 0.866);
    float arm3 = abs(r.x * 0.5 - r.y * 0.866);
    float armAlpha   = 1.0 - smoothstep(0.0, 0.13, min(arm1, min(arm2, arm3)));
    float centerAlpha = 1.0 - smoothstep(0.08, 0.17, dist);
    float shape    = max(armAlpha, centerAlpha);
    float edgeFade = 1.0 - smoothstep(0.35, 0.5, dist);

    gl_FragColor = vec4(0.95, 0.97, 1.0, shape * edgeFade * uOpacity);
  }
`;

// ─── SnowflakeParticles ───────────────────────────────────────────────────────
//
// Mirrors the snow branch of WeatherSystem (CityScene.tsx) for movement physics
// but replaces the basic pointsMaterial with a custom shader: per-particle size
// variation (sizes 3.5–9 world units) and per-particle rotation angle.

function SnowflakeParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const [state] = useState(() => {
    const cx = camera.position.x;
    const cz = camera.position.z;

    const positions = new Float32Array(FLAKE_COUNT * 3);
    const sizes     = new Float32Array(FLAKE_COUNT);
    const angles    = new Float32Array(FLAKE_COUNT);
    const speeds    = new Float32Array(FLAKE_COUNT);
    const anchorX   = new Float32Array(FLAKE_COUNT);
    const anchorZ   = new Float32Array(FLAKE_COUNT);

    for (let i = 0; i < FLAKE_COUNT; i++) {
      const base = i * 3;
      anchorX[i] = cx + (pseudoRandom(i * 3 + 1) - 0.5) * WEATHER_AREA;
      anchorZ[i] = cz + (pseudoRandom(i * 3 + 3) - 0.5) * WEATHER_AREA;
      positions[base]     = anchorX[i];
      positions[base + 1] = WEATHER_BOTTOM + pseudoRandom(i * 3 + 2) * (WEATHER_TOP - WEATHER_BOTTOM);
      positions[base + 2] = anchorZ[i];
      sizes[i]  = 3.5 + pseudoRandom(i * 5 + 7) * 5.5;
      angles[i] = pseudoRandom(i * 7 + 11) * Math.PI * 2;
      speeds[i] = 120 + pseudoRandom(i * 3 + 4) * 150;
    }

    return { positions, sizes, angles, speeds, anchorX, anchorZ, respawnCycles: new Uint32Array(FLAKE_COUNT) };
  });

  const axRef      = useRef(state.anchorX);
  const azRef      = useRef(state.anchorZ);
  const respawnRef = useRef(state.respawnCycles);

  const uniforms = useMemo(() => ({ uOpacity: { value: 0.88 } }), []);

  useFrame(({ clock, camera: cam }, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;

    const pos = pts.geometry.attributes.position.array as Float32Array;
    const cx  = cam.position.x;
    const cz  = cam.position.z;
    const t   = clock.elapsedTime;
    const ax  = axRef.current;
    const az  = azRef.current;
    const rc  = respawnRef.current;

    for (let i = 0; i < FLAKE_COUNT; i++) {
      const base = i * 3;

      ax[i] += 35.0 * delta;
      az[i] += 12.0 * delta;

      pos[base]     = wrap(ax[i], cx) + Math.sin(t * 1.8 + i) * 3.5;
      pos[base + 2] = wrap(az[i], cz) + Math.cos(t * 1.4 + i) * 3.5;
      pos[base + 1] -= state.speeds[i] * 0.18 * delta;

      if (pos[base + 1] < WEATHER_BOTTOM) {
        rc[i] += 1;
        ax[i] = cx + (pseudoRandom(i * 17 + rc[i] * 31) - 0.5) * WEATHER_AREA;
        az[i] = cz + (pseudoRandom(i * 19 + rc[i] * 62) - 0.5) * WEATHER_AREA;
        pos[base]     = wrap(ax[i], cx);
        pos[base + 1] = WEATHER_TOP;
        pos[base + 2] = wrap(az[i], cz);
      }
    }

    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
        <bufferAttribute attach="attributes-aSize"    args={[state.sizes, 1]} />
        <bufferAttribute attach="attributes-aAngle"   args={[state.angles, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={snowflakeVertex}
        fragmentShader={snowflakeFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

// ─── BreathFogParticles ───────────────────────────────────────────────────────
//
// 80 large, near-ground, slow-rising particles that simulate the misty fog
// patches that form at street level in cold winter air. Confined to y < 38
// units, they drift gently and respawn at ground level when they reach the top.

function BreathFogParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const [state] = useState(() => {
    const cx = camera.position.x;
    const cz = camera.position.z;

    const positions = new Float32Array(BREATH_COUNT * 3);
    const speeds    = new Float32Array(BREATH_COUNT);
    const anchorX   = new Float32Array(BREATH_COUNT);
    const anchorZ   = new Float32Array(BREATH_COUNT);

    for (let i = 0; i < BREATH_COUNT; i++) {
      const base = i * 3;
      anchorX[i] = cx + (pseudoRandom(i * 11 + 1) - 0.5) * WEATHER_AREA;
      anchorZ[i] = cz + (pseudoRandom(i * 11 + 3) - 0.5) * WEATHER_AREA;
      positions[base]     = anchorX[i];
      positions[base + 1] = 5 + pseudoRandom(i * 11 + 2) * BREATH_MAX_Y;
      positions[base + 2] = anchorZ[i];
      speeds[i] = 4 + pseudoRandom(i * 11 + 5) * 8;
    }

    return { positions, speeds, anchorX, anchorZ };
  });

  const axRef = useRef(state.anchorX);
  const azRef = useRef(state.anchorZ);

  useFrame(({ clock, camera: cam }, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;

    const pos = pts.geometry.attributes.position.array as Float32Array;
    const cx  = cam.position.x;
    const cz  = cam.position.z;
    const t   = clock.elapsedTime;
    const ax  = axRef.current;
    const az  = azRef.current;

    for (let i = 0; i < BREATH_COUNT; i++) {
      const base = i * 3;

      ax[i] += 8.0 * delta;
      az[i] += 3.0 * delta;

      pos[base]     = wrap(ax[i], cx) + Math.sin(t * 0.4 + i) * 5.0;
      pos[base + 2] = wrap(az[i], cz) + Math.cos(t * 0.3 + i) * 5.0;
      pos[base + 1] += state.speeds[i] * 0.15 * delta;

      if (pos[base + 1] > BREATH_MAX_Y) {
        pos[base + 1] = 2 + pseudoRandom(i * 13 + Math.floor(t)) * 8;
        ax[i] = cx + (pseudoRandom(i * 23 + Math.floor(t * 0.5)) - 0.5) * WEATHER_AREA;
        az[i] = cz + (pseudoRandom(i * 29 + Math.floor(t * 0.5)) - 0.5) * WEATHER_AREA;
      }
    }

    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#dce8f8"
        size={55}
        sizeAttenuation={false}
        transparent
        opacity={0.055}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Icicles ──────────────────────────────────────────────────────────────────
//
// Renders flat 2D triangle icicles along building roof edges. Each icicle
// is oriented to face outward from the edge it sits on. When a building is
// focused, only that building's icicles are shown.

// Y-axis rotation per edge so the flat triangle faces outward: [left, right, front, back]
const EDGE_Y_ROTATIONS = [-Math.PI / 2, Math.PI / 2, Math.PI, 0];

function Icicles({ buildings, focusedLogin }: { buildings: CityBuilding[]; focusedLogin?: string | null }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Flat downward-pointing triangle in XY-plane: top edge at y=0, tip at y=-1
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts = new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    return g;
  }, []);

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#d0ecf8", side: THREE.DoubleSide }),
    []
  );

  const hiddenMatrix = useMemo(() => new THREE.Matrix4().makeTranslation(0, -99999, 0), []);

  const { matrices, buildingLoginMap } = useMemo(() => {
    const subset = buildings.filter((b) => b.height > 5).slice(0, MAX_ICICLE_BUILDINGS);
    const result: THREE.Matrix4[] = [];
    const loginMap = new Map<string, number[]>();
    const dummy = new THREE.Object3D();

    for (let bi = 0; bi < subset.length; bi++) {
      const b = subset[bi];
      const [bx, by, bz] = b.position;
      const hw    = b.width / 2;
      const hd    = b.depth / 2;
      const roofY = by + b.height;
      const login = b.login.toLowerCase();
      const indices: number[] = [];

      for (let k = 0; k < ICICLES_PER_BUILDING; k++) {
        const r1 = pseudoRandom(bi * 7 + k * 3 + 1);
        const r2 = pseudoRandom(bi * 7 + k * 3 + 2);
        const r3 = pseudoRandom(bi * 7 + k * 3 + 3);
        const r4 = pseudoRandom(bi * 7 + k * 3 + 4);

        const icicleH = 2.0 + r2 * 8.0;
        const icicleR = 1.0 + r3 * 1.5;

        let ix = bx;
        let iz = bz;
        const edge = Math.floor(r4 * 4);
        if (edge === 0)      { ix = bx - hw; iz = bz + (r1 - 0.5) * b.depth; }
        else if (edge === 1) { ix = bx + hw; iz = bz + (r1 - 0.5) * b.depth; }
        else if (edge === 2) { ix = bx + (r1 - 0.5) * b.width; iz = bz - hd; }
        else                 { ix = bx + (r1 - 0.5) * b.width; iz = bz + hd; }

        // Top of triangle at roofY, rotate to face outward from edge
        dummy.position.set(ix, roofY, iz);
        dummy.rotation.set(0, EDGE_Y_ROTATIONS[edge], 0);
        dummy.scale.set(icicleR * 2, icicleH, 1);
        dummy.updateMatrix();
        result.push(dummy.matrix.clone());
        indices.push(result.length - 1);
      }

      loginMap.set(login, indices);
    }

    return { matrices: result, buildingLoginMap: loginMap };
  }, [buildings]);

  const needsStamp = useRef(true);
  useEffect(() => { needsStamp.current = true; }, [matrices, focusedLogin]);

  const stamp = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < TOTAL_ICICLE_INSTANCES; i++) mesh.setMatrixAt(i, hiddenMatrix);

    if (focusedLogin) {
      const indices = buildingLoginMap.get(focusedLogin.toLowerCase());
      if (indices) indices.forEach((i) => { if (i < matrices.length) mesh.setMatrixAt(i, matrices[i]); });
    } else {
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    }

    mesh.instanceMatrix.needsUpdate = true;
    needsStamp.current = false;
  }, [matrices, buildingLoginMap, focusedLogin, hiddenMatrix]);

  useLayoutEffect(() => { stamp(); }, [stamp]);

  useFrame(() => {
    if (!needsStamp.current) return;
    stamp();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, TOTAL_ICICLE_INSTANCES]}
      frustumCulled={false}
    />
  );
}

// ─── SnowWeather ─────────────────────────────────────────────────────────────
//
// Top-level component composed of three sub-systems:
//   1. SnowflakeParticles  – 900 particles with shader-driven size variation
//                            and per-particle snowflake rotation
//   2. BreathFogParticles  – 80 large near-ground fog wisps
//   3. Icicles             – instanced cone geometry along roof edges
//
// Integration in CityScene.tsx:
//   import SnowWeather from "./SnowWeather";
//   // Inside WeatherSystem, before the particle JSX:
//   if (weatherMode === "snowy") return <SnowWeather buildings={buildings} />;
//   // Pass buildings down: WeatherSystem({ weatherMode, buildings })

export interface SnowWeatherProps {
  buildings?: CityBuilding[];
  focusedBuilding?: string | null;
}

export function SnowWeather({ buildings = [], focusedBuilding }: SnowWeatherProps) {
  return (
    <group name="subsystem-snow-weather">
      <SnowflakeParticles />
      <BreathFogParticles />
      {buildings.length > 0 && <Icicles buildings={buildings} focusedLogin={focusedBuilding} />}
    </group>
  );
}

export default SnowWeather;
