import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { starFragment, starVertex } from './shaders'

const STAR_COUNT = 900

// Cool-leaning palette: mostly blue-white, with a scatter of teal, violet and
// the occasional warm star so the field reads as having real depth and variety.
const STAR_PALETTE = ['#dfeaff', '#bcd4ff', '#9fffe6', '#cdb4ff', '#ffd9b3'] as const
const PALETTE_WEIGHTS = [0.58, 0.18, 0.12, 0.08, 0.04] // sums to 1

function pickColor(): THREE.Color {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < STAR_PALETTE.length; i++) {
    acc += PALETTE_WEIGHTS[i] ?? 0
    if (r <= acc) return new THREE.Color(STAR_PALETTE[i])
  }
  return new THREE.Color(STAR_PALETTE[0])
}

/**
 * A drifting starfield rendered as a single GPU point cloud. Each star carries
 * its own size, colour and twinkle phase via vertex attributes, so the field
 * shimmers entirely on the GPU — the only per-frame CPU work is advancing a
 * clock uniform and a slow whole-field rotation for parallax.
 */
export function StarField() {
  const { positions, sizes, phases, colors } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    const phases = new Float32Array(STAR_COUNT)
    const colors = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24
      // Spread deep-to-near (z up to +6, just shy of the z=8 camera) so a layer
      // of close stars sweeps past with strong parallax — sells the 3D depth.
      positions[i * 3 + 2] = -9 + Math.random() * 15
      // Mostly small distant stars, a few bright close ones.
      sizes[i] = Math.random() < 0.85 ? 0.04 + Math.random() * 0.04 : 0.09 + Math.random() * 0.06
      phases[i] = Math.random()
      const c = pickColor()
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, sizes, phases, colors }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 400 },
    }),
    [],
  )

  const pointsRef = useRef<THREE.Points>(null)
  const { size, gl } = useThree()

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    // Match three's perspective point-size attenuation: drawingBufferHeight * 0.5.
    uniforms.uScale.value = size.height * gl.getPixelRatio() * 0.5

    if (!pointsRef.current) return
    const t = clock.elapsedTime
    // Slow rotation gives a sense of depth without being distracting.
    pointsRef.current.rotation.y = t * 0.018
    pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.04
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starVertex}
        fragmentShader={starFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
