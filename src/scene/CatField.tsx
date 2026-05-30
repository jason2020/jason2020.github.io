import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// ─── silhouette texture ───────────────────────────────────────────────────────

/**
 * Draws a simple walking-cat silhouette (side profile, facing right).
 * The canvas is wider than tall to match a natural cat-walk aspect ratio.
 */
function makeCatTexture(): THREE.CanvasTexture {
  const W = 256
  const H = 160
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = '#0e0e16'

  // Body
  ctx.beginPath()
  ctx.ellipse(W * 0.44, H * 0.63, W * 0.3, H * 0.21, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.beginPath()
  ctx.arc(W * 0.76, H * 0.5, H * 0.21, 0, Math.PI * 2)
  ctx.fill()

  // Left ear
  ctx.beginPath()
  ctx.moveTo(W * 0.65, H * 0.32)
  ctx.lineTo(W * 0.62, H * 0.1)
  ctx.lineTo(W * 0.74, H * 0.3)
  ctx.closePath()
  ctx.fill()

  // Right ear
  ctx.beginPath()
  ctx.moveTo(W * 0.79, H * 0.3)
  ctx.lineTo(W * 0.84, H * 0.1)
  ctx.lineTo(W * 0.9, H * 0.3)
  ctx.closePath()
  ctx.fill()

  // Tail (curves up from back)
  ctx.strokeStyle = '#0e0e16'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(W * 0.17, H * 0.68)
  ctx.bezierCurveTo(W * 0.04, H * 0.62, W * 0.0, H * 0.3, W * 0.18, H * 0.22)
  ctx.stroke()

  // Legs — slightly staggered for a mid-stride feel
  ctx.lineWidth = 7
  const legPairs: [number, number, number, number][] = [
    [W * 0.62, H * 0.8, W * 0.56, H * 0.98], // front left
    [W * 0.69, H * 0.8, W * 0.76, H * 0.98], // front right
    [W * 0.3, H * 0.8, W * 0.26, H * 0.98], // back left
    [W * 0.38, H * 0.8, W * 0.44, H * 0.98], // back right
  ]
  for (const [x1, y1, x2, y2] of legPairs) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ─── component ────────────────────────────────────────────────────────────────

// Walking parameters
const WALK_Y = -2.1 // y position — near the bottom of the viewport
const WALK_Z = 2.8 // z position — in the foreground, "in front of" the scene
const ENTER_X = -5.8 // off-screen left
const EXIT_X = 5.8 // off-screen right
const WALK_SPEED = 1.7 // world units per second (cat saunter pace)
const WAIT_MIN = 6 // seconds before next appearance
const WAIT_MAX = 18

/**
 * The author's cat — a black silhouette that strolls across the bottom of the
 * cosmos as if walking in front of the monitor.
 */
export function CatField() {
  const texture = useMemo(makeCatTexture, [])
  const spriteRef = useRef<THREE.Sprite>(null)
  const matRef = useRef<THREE.SpriteMaterial>(null)

  // All state in a ref — no React re-renders needed.
  const state = useRef({
    walking: false,
    x: ENTER_X,
    waitTimer: WAIT_MIN + Math.random() * (WAIT_MAX - WAIT_MIN),
    bobPhase: 0,
  })

  useFrame((_, dt) => {
    const sprite = spriteRef.current
    const mat = matRef.current
    if (!sprite || !mat) return

    const s = state.current

    if (!s.walking) {
      mat.opacity = 0
      s.waitTimer -= dt
      if (s.waitTimer <= 0) {
        s.x = ENTER_X
        s.bobPhase = 0
        s.walking = true
        // Always faces right; sprite is mirrored left by default since the
        // texture is drawn facing right.
        sprite.scale.set(1.0, 0.625, 1) // 256:160 aspect
        sprite.position.set(s.x, WALK_Y, WALK_Z)
      }
      return
    }

    // Advance position
    s.x += WALK_SPEED * dt
    s.bobPhase += dt * 8

    // Gentle footstep bob (small Y oscillation)
    const bob = Math.abs(Math.sin(s.bobPhase)) * 0.04

    sprite.position.set(s.x, WALK_Y + bob, WALK_Z)
    mat.opacity = 0.85

    // Exit: hide, reset wait timer
    if (s.x > EXIT_X) {
      s.walking = false
      s.waitTimer = WAIT_MIN + Math.random() * (WAIT_MAX - WAIT_MIN)
      mat.opacity = 0
    }
  })

  return (
    <sprite ref={spriteRef} position={[ENTER_X, WALK_Y, WALK_Z]} scale={[1.0, 0.625, 1]}>
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
