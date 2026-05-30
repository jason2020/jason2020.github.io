import { Float, Html, MeshDistortMaterial } from '@react-three/drei'
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { projects } from '@/content/projects/projects'
import type { Project } from '@/types/project'
import { nebulaFragment, nebulaVertex } from './shaders'

/** Full-screen animated nebula behind everything. */
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

/** Drifting field of glowing stars for depth and life. */
function ParticleField({ count = 520 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 22
      arr[i * 3 + 1] = (Math.random() - 0.5) * 13
      arr[i * 3 + 2] = (Math.random() - 0.5) * 9 - 2
    }
    return arr
  }, [count])

  const ref = useRef<THREE.Points>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = t * 0.02
    ref.current.position.y = Math.sin(t * 0.2) * 0.25
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#dfeaff"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** One project, rendered as a floating, glowing, organically-distorting body. */
function ProjectNode({ project }: { project: Project }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const color = useMemo(() => new THREE.Color(project.accent), [project.accent])

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }
  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    navigate(`/projects/${project.id}`, { viewTransition: true })
  }

  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1} position={project.position}>
      <mesh scale={hovered ? 1.22 : 1} onPointerOver={onOver} onPointerOut={onOut} onClick={open}>
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
      <Html center position={[0, -1.4, 0]} distanceFactor={9} className="node-label">
        <span style={{ color: project.accent, opacity: hovered ? 1 : 0.72 }}>{project.title}</span>
      </Html>
    </Float>
  )
}

/** Eases the camera toward the cursor for a parallax / "look around" feel. */
function CameraRig() {
  useFrame((state, dt) => {
    const targetX = state.pointer.x * 1.6
    const targetY = state.pointer.y * 1.0
    const k = Math.min(1, dt * 2.5)
    state.camera.position.x += (targetX - state.camera.position.x) * k
    state.camera.position.y += (targetY - state.camera.position.y) * k
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

export default function CosmosCanvas() {
  return (
    <Canvas
      className="cosmos-canvas"
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
      <ParticleField />
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
