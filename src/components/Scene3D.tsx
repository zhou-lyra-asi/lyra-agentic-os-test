import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { AGENTS } from '../core';
import type { HarnessId, OSState } from '../core/types';
import { useOS } from '../hooks';

interface ModelData {
  positions: Float32Array;
  colors: Float32Array;
  count: number;
  relief: number[];
  grid: [number, number];
  scale: number;
}

function useLyraModel(): ModelData | null {
  const [model, setModel] = useState<ModelData | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/models/lyra-pointcloud.bin').then((r) => r.arrayBuffer()),
      fetch('/models/lyra-relief.json').then((r) => r.json()),
    ])
      .then(([buf, relief]) => {
        const count = Math.floor(buf.byteLength / 15); // 3×f32 + 3×u8
        const positions = new Float32Array(buf.slice(0, count * 12));
        const rawColors = new Uint8Array(buf.slice(count * 12));
        const colors = Float32Array.from(rawColors, (c) => c / 255);
        if (alive) setModel({
          positions, colors, count,
          relief: relief.depth as number[],
          grid: [relief.width as number, relief.height as number],
          scale: relief.scale as number,
        });
      })
      .catch(() => { /* tetap tampilkan sigil bila aset belum ada */ });
    return () => { alive = false; };
  }, []);
  return model;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,235,185,0.95)');
  g.addColorStop(0.22, 'rgba(240,200,120,0.42)');
  g.addColorStop(0.6, 'rgba(160,110,60,0.10)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const VERT = /* glsl */ `
  attribute vec3 color;
  uniform float uTime;
  uniform float uSize;
  uniform float uPulse;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec3 p = position;
    p.x += sin(uTime * 0.7 + p.y * 2.6) * 0.008;
    p.z += cos(uTime * 0.55 + p.x * 3.1) * 0.010;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float twinkle = 0.86 + 0.14 * sin(uTime * 2.0 + p.x * 9.0 + p.y * 7.0);
    gl_PointSize = uSize * twinkle * (12.0 / max(1.0, -mv.z)) * (1.0 + uPulse * 0.25);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform float uPulse;
  uniform float uAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float a = smoothstep(0.50, 0.06, d);
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor * (0.82 + uPulse * 0.28), a * uAlpha);
  }
`;

function LyraHologram({ model, phase, compact }: { model: ModelData; phase: OSState['phase']; compact: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const glow = useMemo(glowTexture, []);
  const prime = useMemo(() => {
    const t = new THREE.TextureLoader().load('/lyra/lyra-prime.jpg');
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const alphaMask = useMemo(() => new THREE.TextureLoader().load('/lyra/lyra-relief-alpha.png'), []);

  const pointGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(model.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(model.colors, 3));
    g.computeBoundingSphere();
    return g;
  }, [model]);

  const reliefGeometry = useMemo(() => {
    const [gw, gh] = model.grid;
    const g = new THREE.PlaneGeometry(3.05, 4.05, gw - 1, gh - 1);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const d = model.relief[i] ?? 0;
      pos.setZ(i, (d - 0.42) * model.scale);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [model]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSize: { value: compact ? 1.9 : 3.3 },
    uPulse: { value: 0 },
    uAlpha: { value: compact ? 0.36 : 0.62 },
  }), [compact]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (mat.current) {
      mat.current.uniforms.uTime.value = t;
      const target = phase === 'execute' || phase === 'debate' ? 0.85 : phase === 'complete' ? 0.4 : 0.12;
      mat.current.uniforms.uPulse.value += (target - mat.current.uniforms.uPulse.value) * Math.min(1, delta * 2.2);
    }
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.24) * 0.17;
      group.current.rotation.z = Math.sin(t * 0.17) * 0.018;
      group.current.position.y = Math.sin(t * 0.46) * 0.055;
    }
  });

  return (
    <group ref={group}>
      <sprite position={[0, 0.15, -1.35]} scale={[4.7, 4.7, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      {/* Bas-relief 3D: displacement dari depth grid hasil rekonstruksi.
          Sengaja sangat tipis agar point-cloud tetap menjadi subjek utama. */}
      <mesh geometry={reliefGeometry} position={[0, 0, -0.16]}>
        <meshStandardMaterial
          map={prime} alphaMap={alphaMask} color="#8a744f" transparent opacity={compact ? 0.07 : 0.16} roughness={0.7} metalness={0.18}
          emissive="#5b4520" emissiveIntensity={0.08} side={THREE.DoubleSide} depthWrite={false}
        />
      </mesh>
      <mesh geometry={reliefGeometry} position={[0, 0, -0.15]}>
        <meshBasicMaterial color="#f0d08a" alphaMap={alphaMask} wireframe transparent opacity={0.03} depthWrite={false} />
      </mesh>

      {/* Point cloud 3D Lyra — 28.200 titik berwarna */}
      <points geometry={pointGeometry}>
        <shaderMaterial
          ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms}
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Sigil({ phase }: { phase: OSState['phase'] }) {
  const g = useRef<THREE.Group>(null);
  const color = phase === 'blocked' ? '#ff9e9e' : phase === 'complete' ? '#f6dfa8' : '#d9b26a';
  useFrame((s, d) => {
    if (g.current) g.current.rotation.z += d * 0.045;
  });
  return (
    <group ref={g} position={[0, 0, -1.55]}>
      <mesh><torusGeometry args={[2.42, 0.007, 6, 180]} /><meshBasicMaterial color={color} transparent opacity={0.36} /></mesh>
      <mesh rotation={[0.32, 0.24, 0]}><torusGeometry args={[2.68, 0.004, 6, 180]} /><meshBasicMaterial color={color} transparent opacity={0.2} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[2.18, 0.003, 6, 4]} /><meshBasicMaterial color={color} transparent opacity={0.16} /></mesh>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[i % 6 === 0 ? 0.13 : 0.055, 0.008, 0.008]} />
            <meshBasicMaterial color={color} transparent opacity={i % 6 === 0 ? 0.55 : 0.28} />
          </mesh>
        );
      })}
    </group>
  );
}

type Activity = Record<string, number>;

function AgentOrb({
  index, position, activity, onSelect, confidence, running, compact,
}: {
  index: number;
  position: [number, number, number];
  activity: MutableRefObject<Activity>;
  onSelect: (id: HarnessId) => void;
  confidence?: number;
  running: boolean;
  compact: boolean;
}) {
  const agent = AGENTS[index];
  const core = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const glow = useMemo(glowTexture, []);

  useFrame((s, d) => {
    const t = s.clock.elapsedTime;
    const last = activity.current[agent.id] ?? 0;
    const pulse = Math.max(0, 1 - (performance.now() - last) / 1500);
    if (material.current) {
      const target = 0.55 + pulse * 2.1 + (running ? 0.4 : 0) + (hovered ? 0.7 : 0);
      material.current.emissiveIntensity += (target - material.current.emissiveIntensity) * Math.min(1, d * 5);
    }
    if (core.current) {
      const sc = 1 + pulse * 0.14 + (hovered ? 0.12 : 0);
      core.current.scale.setScalar(sc);
      core.current.rotation.y += d * 0.35;
      core.current.rotation.x += d * 0.12;
      core.current.position.y = Math.sin(t * 0.8 + index) * 0.06;
    }
    if (ring.current) ring.current.rotation.z += d * (0.24 + pulse * 0.8);
  });

  return (
    <group position={position}>
      <sprite scale={[1.9, 1.9, 1]}>
        <spriteMaterial map={glow} color={agent.color} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <mesh
        ref={core}
        onClick={(e) => { e.stopPropagation(); onSelect(agent.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <icosahedronGeometry args={[0.27, 2]} />
        <meshStandardMaterial
          ref={material} color={agent.color} emissive={agent.color} emissiveIntensity={0.6}
          roughness={0.3} metalness={0.65} transparent opacity={0.94}
        />
      </mesh>
      <mesh ref={ring} rotation={[0.35, 0.2, 0]}>
        <torusGeometry args={[0.48, 0.008, 5, 72]} />
        <meshBasicMaterial color={agent.color} transparent opacity={hovered ? 0.8 : 0.42} />
      </mesh>
      <mesh rotation={[1.1, 0.4, 0]}>
        <torusGeometry args={[0.37, 0.005, 5, 64]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.22} />
      </mesh>
      <Html center distanceFactor={compact ? 8 : 10} position={[0, index >= 2 ? 0.86 : -0.78, 0]} zIndexRange={[18, 0]}>
        <button
          className={`orb-label ${hovered ? 'is-hover' : ''}`}
          style={{ '--orb': agent.color } as CSSProperties}
          onClick={() => onSelect(agent.id)}
        >
          <span className="orb-label__top">
            <b>{agent.glyph}</b> {agent.name}
            <i>{running ? '● live' : '○ ready'}</i>
          </span>
          <span className="orb-label__sub">{agent.codename}{confidence ? ` · ${(confidence * 100).toFixed(0)}%` : ''}</span>
        </button>
      </Html>
    </group>
  );
}

interface LinkProps {
  index: number;
  target: [number, number, number];
  flow: MutableRefObject<Record<string, number>>;
}

function EnergyLink({ index, target, flow }: LinkProps) {
  const agent = AGENTS[index];
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const curve = useMemo(() => {
    const from = new THREE.Vector3(0, 0, -0.25);
    const to = new THREE.Vector3(...target);
    const mid = new THREE.Vector3((from.x + to.x) / 2, (from.y + to.y) / 2 + (index % 2 ? 0.55 : -0.55), 0.75);
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [target, index]);
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
    const m = new THREE.LineBasicMaterial({ color: agent.color, transparent: true, opacity: 0.26, depthWrite: false });
    return new THREE.Line(g, m);
  }, [curve, agent.color]);

  useFrame((_, d) => {
    const p = flow.current[agent.id];
    if (beam.current && beamMat.current) {
      if (p === undefined || p >= 1) {
        beam.current.visible = false;
      } else {
        beam.current.visible = true;
        flow.current[agent.id] = Math.min(1, p + d * 1.05);
        const v = curve.getPoint(flow.current[agent.id]);
        beam.current.position.copy(v);
        beamMat.current.opacity = Math.sin(flow.current[agent.id] * Math.PI) * 0.95;
      }
    }
  });

  return (
    <group>
      <primitive object={line} />
      <mesh ref={beam} visible={false}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshBasicMaterial ref={beamMat} color={agent.color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SceneContent({
  model, state, activity, flow, onSelectAgent, compact,
}: {
  model: ModelData | null;
  state: OSState;
  activity: MutableRefObject<Activity>;
  flow: MutableRefObject<Record<string, number>>;
  onSelectAgent: (id: HarnessId) => void;
  compact: boolean;
}) {
  const spread = compact ? 1.14 : 1;
  const positions: [number, number, number][] = [
    [-2.1 * spread, 1.5 * spread, 0.45],
    [2.1 * spread, 1.5 * spread, 0.2],
    [-2.1 * spread, -1.42 * spread, 0.15],
    [2.1 * spread, -1.42 * spread, 0.5],
  ];
  const confidenceFor = (id: HarnessId) => state.findings.find((f) => f.agent === id)?.confidence;

  return (
    <>
      <color attach="background" args={['#070b18']} />
      <fog attach="fog" args={['#070b18', 11, 26]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[3.5, 3, 5]} intensity={22} color="#ffd89a" distance={18} />
      <pointLight position={[-4, -1, 4]} intensity={12} color="#7fb8ff" distance={16} />
      <pointLight position={[0, 2, -4]} intensity={14} color="#b69cff" distance={16} />

      <Stars radius={70} depth={42} count={1500} factor={3} saturation={0} fade speed={0.35} />
      <Sparkles count={90} scale={[11, 7, 4]} size={2.4} speed={0.22} opacity={0.45} color="#e8c77b" />

      <Sigil phase={state.phase} />
      {model && <LyraHologram model={model} phase={state.phase} compact={compact} />}

      {AGENTS.map((a, i) => (
        <EnergyLink key={`link-${a.id}`} index={i} target={positions[i]} flow={flow} />
      ))}
      {AGENTS.map((a, i) => (
        <AgentOrb
          key={a.id} index={i} position={positions[i]} activity={activity}
          onSelect={onSelectAgent} confidence={confidenceFor(a.id)}
          running={state.running} compact={compact}
        />
      ))}

      <OrbitControls
        makeDefault enablePan={false} enableDamping dampingFactor={0.06}
        rotateSpeed={0.45} zoomSpeed={0.6}
        minDistance={6.5} maxDistance={14}
        minPolarAngle={Math.PI / 2 - 0.5} maxPolarAngle={Math.PI / 2 + 0.5}
        minAzimuthAngle={-0.65} maxAzimuthAngle={0.65}
      />
    </>
  );
}

export function Scene3D({
  onSelectAgent, compact = false,
}: {
  onSelectAgent?: (id: HarnessId) => void;
  compact?: boolean;
}) {
  const state = useOS();
  const model = useLyraModel();
  const activity = useRef<Activity>({});
  const flow = useRef<Record<string, number>>({});
  const lastPulseId = state.pulses[state.pulses.length - 1]?.id;

  useEffect(() => {
    const p = state.pulses[state.pulses.length - 1];
    if (!p) return;
    const now = performance.now();
    activity.current[p.from] = now;
    if (p.to !== 'broadcast') activity.current[p.to] = now;
    flow.current[p.from] = 0;
    if (p.to !== 'broadcast') flow.current[p.to] = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPulseId]);

  return (
    <Canvas
      className="nexus-canvas"
      camera={{ position: [0, 0.15, compact ? 10.5 : 8.8], fov: 43, near: 0.1, far: 120 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          model={model} state={state} activity={activity} flow={flow}
          compact={compact}
          onSelectAgent={(id) => onSelectAgent?.(id)}
        />
      </Suspense>
    </Canvas>
  );
}
