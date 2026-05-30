import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

/** Canvas-rendered black cat sprite texture — created once. */
function makeCatTexture(): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.font = `${size * 0.72}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🐈‍⬛', size / 2, size / 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// A "waypoint" the cat travels toward before picking a new one.
function randomWaypoint(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 14,
    (Math.random() - 0.5) * 7,
    (Math.random() - 0.5) * 8 - 1,
  )
}

/**
 * A single black cat sprite that wanders through the cosmos — the author's cat,
 * popping in and out of the scene on its own mysterious agenda.
 *
 * Behaviour:
 *  - Slowly drifts toward a random waypoint at varying speed
 *  - Fades in on arrival, fades out before departing
 *  - Picks a new waypoint each time it gets close to the current one
 */
export function CatField() {
  const texture = useMemo(makeCatTexture, [])
  const spriteRef = useRef<THREE.Sprite>(null)
  const matRef = useRef<THREE.SpriteMaterial>(null)

  // Persistent mutable state that lives outside React to avoid re-renders.
  const state = useRef({
    target: randomWaypoint(),
    speed: 0.6 + Math.random() * 0.8,
    phase: 'in' as 'in' | 'visible' | 'out' | 'hidden',
    phaseTimer: 0,
    opacity: 0,
  })

  // Track whether the cat is currently "present" in the scene.
  const [visible, setVisible] = useState(true)

  useFrame((_, dt) => {
    const sprite = spriteRef.current
    const mat = matRef.current
    if (!sprite || !mat) return

    const s = state.current
    s.phaseTimer += dt

    if (s.phase === 'hidden') {
      // Wait off-screen, then reappear at a new location.
      if (s.phaseTimer > 4 + Math.random() * 6) {
        sprite.position.copy(randomWaypoint())
        s.target = randomWaypoint()
        s.speed = 0.5 + Math.random() * 0.9
        s.phaseTimer = 0
        s.phase = 'in'
        setVisible(true)
      }
      return
    }

    // Drift toward target.
    const dir = s.target.clone().sub(sprite.position)
    const dist = dir.length()
    if (dist > 0.05) {
      sprite.position.addScaledVector(dir.normalize(), s.speed * dt)
    }

    // Fade lifecycle.
    if (s.phase === 'in') {
      s.opacity = Math.min(s.opacity + dt * 1.2, 0.82)
      if (s.opacity >= 0.82) s.phase = 'visible'
    } else if (s.phase === 'visible') {
      // Pick a new waypoint when close; occasionally decide to leave.
      if (dist < 0.4) {
        const willLeave = Math.random() < 0.3
        if (willLeave) {
          s.phase = 'out'
        } else {
          s.target = randomWaypoint()
          s.speed = 0.5 + Math.random() * 0.9
        }
      }
    } else if (s.phase === 'out') {
      s.opacity = Math.max(s.opacity - dt * 0.8, 0)
      if (s.opacity <= 0) {
        s.phase = 'hidden'
        s.phaseTimer = 0
        setVisible(false)
      }
    }

    mat.opacity = s.opacity
  })

  if (!visible && state.current.phase === 'hidden') return null

  return (
    <sprite ref={spriteRef} scale={[0.55, 0.55, 0.55]}>
      <spriteMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
      />
    </sprite>
  )
}
