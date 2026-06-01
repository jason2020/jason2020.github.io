import { Float, Html, MeshDistortMaterial } from '@react-three/drei'
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { projects } from '@/content/projects/projects'
import type { Project } from '@/types/project'
import { FloatingCat } from './FloatingCat'
import { StarField } from './StarField'
import { nebulaFragment, nebulaVertex } from './shaders'

/** How long the user must hold hover before the orb bursts and navigates (ms). */
const DWELL_MS = 1400
/** How long the burst flash plays out before navigate fires (ms). */
const BURST_MS = 180

// ─── nebula background ────────────────────────────────────────────────────────

function NebulaBackground() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorDeep: { value: new THREE.Color('#04060c') },
      uColorTeal: { value: new THREE.Color('#0c3b3f') },
      uColorViolet: { value: new THREE.Color('#2a1d52') },
    }),
    [],
  )
  useFrame((_, dt) => {
    uniforms.uTime.value += dt
  })
  return (
    <mesh position={[0, 0, -6]} scale={[34, 20, 1]}>
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

      // Emissive: 1.3 → 3.2 as dwell fills
      const targetEmissive = 1.3 + progress * 1.9
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * Math.min(1, dt * 5)
      mat.emissive.lerp(color, 1 - progress * 0.15)

      if (progress >= 1) triggerBurst()
    } else {
      // Idle: spring back to resting scale and emissive
      const restScale = hovered ? 1.15 : 1
      mesh.scale.setScalar(mesh.scale.x + (restScale - mesh.scale.x) * Math.min(1, dt * 8))
      mat.emissiveIntensity += (1.3 - mat.emissiveIntensity) * Math.min(1, dt * 4)
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
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1} position={project.position}>
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
          emissiveIntensity={1.3}
          roughness={0.15}
          metalness={0.1}
          distort={0.34}
          speed={2.2}
        />
      </mesh>

      <Html center position={[0, -1.45, 0]} distanceFactor={9} className="node-label">
        <span style={{ color: project.accent, opacity: hovered ? 1 : 0.72 }}>{project.title}</span>
      </Html>
    </Float>
  )
}

// ─── camera parallax ─────────────────────────────────────────────────────────

function CameraRig() {
  useFrame((state, dt) => {
    const targetX = state.pointer.x * 1.6
    const targetY = state.pointer.y * 1.0
    const k = Math.min(1, dt * 5)
    state.camera.position.x += (targetX - state.camera.position.x) * k
    state.camera.position.y += (targetY - state.camera.position.y) * k
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── canvas ───────────────────────────────────────────────────────────────────

export default function CosmosCanvas() {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ position: [0, 0, 8], fov: 50 }}
    >
      <color attach="background" args={['#04060c']} />
      <fog attach="fog" args={['#04060c', 7, 20]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={60} color="#9be8ff" />

      <NebulaBackground />
      <StarField />
      <FloatingCat />

      {projects.map((project) => (
        <ProjectNode key={project.id} project={project} />
      ))}

      <CameraRig />

      <EffectComposer>
        <Bloom mipmapBlur intensity={1.2} luminanceThreshold={0.25} luminanceSmoothing={0.3} />
      </EffectComposer>
    </Canvas>
  )
}
