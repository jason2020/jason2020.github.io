import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 420

/**
 * A drifting starfield for depth and the impression of moving through space.
 * Stars vary in size and opacity to feel naturally distributed across distance.
 */
export function StarField() {
  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3
      // Mix of tiny distant stars and brighter closer ones
      sizes[i] = Math.random() < 0.85 ? 0.025 + Math.random() * 0.03 : 0.06 + Math.random() * 0.04
    }
    return { positions, sizes }
  }, [])

  const pointsRef = useRef<THREE.Points>(null)

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.elapsedTime
    // Slow rotation gives a sense of depth without being distracting
    pointsRef.current.rotation.y = t * 0.018
    pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.04
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#dfeaff"
        transparent
        opacity={0.82}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={false}
      />
    </points>
  )
}
