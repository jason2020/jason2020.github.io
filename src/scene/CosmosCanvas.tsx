import { Float, Html, MeshDistortMaterial } from '@react-three/drei'
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { projects } from '@/content/projects/projects'
import type { Project } from '@/types/project'
import { CatField } from './CatField'
import { nebulaFragment, nebulaVertex } from './shaders'

const DWELL_MS = 1500
const RING_RADIUS = 50
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

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

// ─── project node with hover-dwell ring ──────────────────────────────────────

function ProjectNode({ project }: { project: Project }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const color = useMemo(() => new THREE.Color(project.accent), [project.accent])

  // Refs for frame-loop mutations — avoids React state at 60 fps.
  const dwellStartRef = useRef<number | null>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (!meshRef.current) return

    // Smooth scale spring toward target.
    const targetScale = hovered ? 1.22 : 1
    const current = meshRef.current.scale.x
    const next = current + (targetScale - current) * Math.min(1, dt * 8)
    meshRef.current.scale.setScalar(next)

    if (!hovered || dwellStartRef.current === null || !ringRef.current) return

    const progress = Math.min((performance.now() - dwellStartRef.current) / DWELL_MS, 1)
    ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress))

    if (progress >= 1) navigate(`/projects/${project.id}`, { viewTransition: true })
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    dwellStartRef.current = performance.now()
    document.body.style.cursor = 'none'
  }
  const onOut = () => {
    setHovered(false)
    dwellStartRef.current = null
    document.body.style.cursor = 'auto'
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE)
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    navigate(`/projects/${project.id}`, { viewTransition: true })
  }

  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1} position={project.position}>
      <mesh ref={meshRef} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <sphereGeometry args={[0.85, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2.4 : 1.3}
          roughness={0.15}
          metalness={0.1}
          distort={0.34}
          speed={2.2}
        />
      </mesh>

      {/* Dwell progress ring — rendered as an SVG in 3D-tracked HTML space.
          The ring's strokeDashoffset is mutated directly from useFrame to avoid
          60-fps React state updates. */}
      <Html center position={[0, 0, 0.92]} style={{ pointerEvents: 'none' }}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ display: hovered ? 'block' : 'none', overflow: 'visible' }}
          aria-hidden="true"
        >
          {/* faint track */}
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            stroke={project.accent}
            strokeWidth="2"
            opacity="0.18"
          />
          {/* filling arc */}
          <circle
            ref={ringRef}
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            stroke={project.accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE}
            transform="rotate(-90 60 60)"
            style={{ filter: `drop-shadow(0 0 4px ${project.accent})` }}
          />
        </svg>
      </Html>

      {/* Node label */}
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
    // Snappier than before (dt * 5 vs dt * 2.5)
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
      <CatField />

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
