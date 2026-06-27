import { Float, Html, MeshDistortMaterial, PerformanceMonitor } from '@react-three/drei'
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { projects } from '@/content/projects/projects'
import type { Project } from '@/types/project'
import { ShootingStars } from './ShootingStars'
import { StarField } from './StarField'
import { nebulaFragment, nebulaVertex } from './shaders'

/** How long the user must hold hover before the orb bursts and navigates (ms). */
const DWELL_MS = 1400
/** How long the burst flash plays out before navigate fires (ms). */
const BURST_MS = 180

// ─── nebula background ────────────────────────────────────────────────────────

// Nebula plane geometry. NEBULA_PX/PY must match the p-space mapping in
// shaders.ts: `p = (uv - 0.5) * vec2(NEBULA_PX, NEBULA_PY)`.
const NEBULA_Z = -6
const NEBULA_W = 34
const NEBULA_H = 20
const NEBULA_PX = 2.4
const NEBULA_PY = 1.5

function NebulaBackground({ qualityRef }: { qualityRef: React.RefObject<number> }) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorDeep: { value: new THREE.Color('#02040a') },
      uColorTeal: { value: new THREE.Color('#0c3b3f') },
      uColorViolet: { value: new THREE.Color('#2a1d52') },
      uOctaves: { value: 5 },
    }),
    [],
  )
  const cursorTarget = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, dt) => {
    uniforms.uTime.value += dt

    // Trade fullscreen noise detail for frame rate when the GPU is struggling.
    // qualityRef is the live PerformanceMonitor factor (0 = struggling, 1 = fine).
    const q = qualityRef.current
    uniforms.uOctaves.value = q < 0.5 ? 3 : q < 0.8 ? 4 : 5

    // Project the cursor onto the nebula plane so the warp/glow sits exactly
    // under the pointer at any aspect ratio and camera distance.
    const cam = state.camera as THREE.PerspectiveCamera
    const dist = cam.position.z - NEBULA_Z
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * dist
    const halfW = halfH * (state.size.width / state.size.height)
    const centerK = NEBULA_Z / cam.position.z // parallax shifts the view centre
    const wx = centerK * cam.position.x + state.pointer.x * halfW
    const wy = centerK * cam.position.y + state.pointer.y * halfH
    cursorTarget.set((wx / NEBULA_W) * NEBULA_PX, (wy / NEBULA_H) * NEBULA_PY)
    uniforms.uPointer.value.lerp(cursorTarget, Math.min(1, dt * 14))
  })

  return (
    <mesh position={[0, 0, NEBULA_Z]} scale={[NEBULA_W, NEBULA_H, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── project node ─────────────────────────────────────────────────────────────

function ProjectNode({ project }: { project: Project }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const color = useMemo(() => new THREE.Color(project.accent), [project.accent])

  // All animation state lives in refs — no React state at 60 fps.
  const meshRef = useRef<THREE.Mesh>(null)
  // Typed as MeshPhysicalMaterial (the base class DistortMaterialImpl extends).
  // Cast on the JSX ref prop because drei's DistortMaterialImpl is not a public export.
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const dwellStartRef = useRef<number | null>(null)
  const burstStartRef = useRef<number | null>(null)
  const navigatedRef = useRef(false)

  useFrame((_, dt) => {
    const mesh = meshRef.current
    const mat = matRef.current
    if (!mesh || !mat) return

    const now = performance.now()

    // ── burst phase: rapid scale explosion + flash to white ──
    if (burstStartRef.current !== null) {
      const burstElapsed = now - burstStartRef.current
      const burstT = Math.min(burstElapsed / BURST_MS, 1)
      // Scale exponentially outward
      mesh.scale.setScalar(1 + burstT * 3.5)
      // Emissive floods toward white
      mat.emissiveIntensity = 2.5 + burstT * 6
      mat.emissive.lerpColors(color, new THREE.Color('#ffffff'), burstT * 0.7)

      if (burstT >= 1 && !navigatedRef.current) {
        navigatedRef.current = true
        navigate(`/projects/${project.id}`, { viewTransition: true })
      }
      return
    }

    // ── hover / dwell: orb swells and brightens as you hold ──
    if (hovered && dwellStartRef.current !== null) {
      const dwellElapsed = now - dwellStartRef.current
      const progress = Math.min(dwellElapsed / DWELL_MS, 1)

      // Scale: 1 → 1.55 as dwell fills
      const targetScale = 1 + progress * 0.55
      mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * Math.min(1, dt * 6))

      // Emissive: 0.8 → 2.7 as dwell fills
      const targetEmissive = 0.8 + progress * 1.9
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * Math.min(1, dt * 5)
      mat.emissive.lerp(color, 1 - progress * 0.15)

      if (progress >= 1) triggerBurst()
    } else {
      // Idle: spring back to resting scale and emissive
      const restScale = hovered ? 1.15 : 1
      mesh.scale.setScalar(mesh.scale.x + (restScale - mesh.scale.x) * Math.min(1, dt * 8))
      mat.emissiveIntensity += (0.8 - mat.emissiveIntensity) * Math.min(1, dt * 4)
      mat.emissive.lerp(color, Math.min(1, dt * 4))
    }
  })

  function triggerBurst() {
    if (burstStartRef.current !== null) return
    burstStartRef.current = performance.now()
    document.body.style.cursor = 'auto'
  }

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    dwellStartRef.current = performance.now()
    document.body.style.cursor = 'pointer'
  }

  const onOut = () => {
    setHovered(false)
    dwellStartRef.current = null
    document.body.style.cursor = 'auto'
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    dwellStartRef.current = null
    triggerBurst()
  }

  return (
    <Float
      speed={1.6}
      rotationIntensity={0.6}
      floatIntensity={0.25}
      floatingRange={[-0.06, 0.06]}
      position={project.position}
    >
      <mesh ref={meshRef} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <sphereGeometry args={[0.85, 64, 64]} />
        <MeshDistortMaterial
          // drei's DistortMaterialImpl is not a public export, so we can't satisfy
          // its ref type directly. The ref itself is typed as MeshPhysicalMaterial
          // (the base class) so all downstream access in useFrame is still typed.
          // biome-ignore lint/suspicious/noExplicitAny: internal drei type not exported
          ref={matRef as React.Ref<any>}
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={0.1}
          distort={0.5}
          speed={2.6}
        />
      </mesh>

      <Html center position={[0, -1.45, 0]} distanceFactor={9} className="node-label">
        <span style={{ color: project.accent, opacity: hovered ? 1 : 0.72 }}>{project.title}</span>
      </Html>
    </Float>
  )
}

// ─── camera: intro reveal + parallax ──────────────────────────────────────────

const INTRO_DUR = 1.5 // seconds of the zoom-out reveal
const INTRO_START_Z = 4.2 // camera starts pulled in close…
const BASE_Z = 8 // …and eases back out to here
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

function CameraRig() {
  // Intro progresses 0 → 1 once per mount, so this plays on first load *and*
  // every time the cosmos remounts (e.g. clicking the wordmark to come home).
  const introRef = useRef(0)

  useFrame((state, dt) => {
    if (introRef.current < 1) {
      introRef.current = Math.min(1, introRef.current + dt / INTRO_DUR)
      state.camera.position.z =
        INTRO_START_Z + (BASE_Z - INTRO_START_Z) * easeOutCubic(introRef.current)
    }

    // Pointer parallax, ramped in by intro progress so it doesn't fight the reveal.
    const p = introRef.current
    const targetX = state.pointer.x * 1.6 * p
    const targetY = state.pointer.y * 1.0 * p
    const k = Math.min(1, dt * 5)
    state.camera.position.x += (targetX - state.camera.position.x) * k
    state.camera.position.y += (targetY - state.camera.position.y) * k
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── canvas ───────────────────────────────────────────────────────────────────

// Adaptive resolution bounds. A fullscreen procedural nebula + a 5-pass bloom
// chain make pixel count the dominant cost, so we scale render resolution to the
// machine: capable GPUs sharpen toward MAX_DPR, struggling ones drop to MIN_DPR
// (driven live by drei's PerformanceMonitor) until frames are smooth again.
const MIN_DPR = 0.75
const MAX_DPR = 2
const START_DPR = 1.25 // conservative cold start; PerformanceMonitor adjusts within ~1s

export default function CosmosCanvas() {
  // A barely-there chromatic split at the edges — cinematic, not glitchy.
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), [])
  // Live render resolution, steered by measured frame rate (see PerformanceMonitor).
  const [dpr, setDpr] = useState(START_DPR)
  // The latest performance factor (0 = struggling, 1 = comfortable). A ref so the
  // nebula can read it every frame to scale noise detail without re-rendering React.
  const qualityRef = useRef(1)

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0 }}
      dpr={dpr}
      // The EffectComposer resolves antialiasing in its own multisampled target,
      // so canvas-level MSAA would just be a second, redundant buffer.
      gl={{ antialias: false }}
      camera={{ position: [0, 0, INTRO_START_Z], fov: 50 }}
    >
      {/* Watch the real frame rate and trade resolution + nebula detail for
          smoothness when the GPU can't keep up — then climb back when it can. */}
      <PerformanceMonitor
        flipflops={3}
        onChange={({ factor }) => {
          qualityRef.current = factor
          setDpr(Number((MIN_DPR + (MAX_DPR - MIN_DPR) * factor).toFixed(2)))
        }}
        onFallback={() => {
          qualityRef.current = 0
          setDpr(MIN_DPR)
        }}
      />

      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 7, 20]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={60} color="#9be8ff" />

      <NebulaBackground qualityRef={qualityRef} />
      <StarField />
      <ShootingStars />

      {projects.map((project) => (
        <ProjectNode key={project.id} project={project} />
      ))}

      <CameraRig />

      {/* multisampling 4 (down from drei's default 8): with bloom softening edges,
          the extra MSAA samples cost fullscreen bandwidth for no visible gain. */}
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.2} luminanceThreshold={0.25} luminanceSmoothing={0.3} />
        {/* ACES filmic tone mapping: map the HDR scene to display range with a
            cinematic highlight roll-off. The composer otherwise renders with no
            tone mapping, so bright bloom would simply clip to white. */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.35} darkness={0.6} eskil={false} />
        <ChromaticAberration offset={caOffset} />
        <Noise premultiply opacity={0.04} />
      </EffectComposer>
    </Canvas>
  )
}
