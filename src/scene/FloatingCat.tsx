import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// ─── silhouette painting ──────────────────────────────────────────────────────

const TEX_SIZE = 220 // square canvas → uniform sprite scale → clean rotation
const FRAME_COUNT = 8 // animation frames in the paddle cycle

/**
 * Paints the cat silhouette (side profile, facing right) into a square canvas.
 * `phase` (0..1) drives the limb paddle + tail sway so a sequence of phases
 * forms a looping animation. Coordinates are fractions of `s` (the canvas size).
 */
function paintCat(ctx: CanvasRenderingContext2D, s: number, phase: number): void {
  const cycle = phase * Math.PI * 2
  const tailWag = Math.sin(cycle) * 0.05

  ctx.fillStyle = '#000'
  ctx.strokeStyle = '#000'
  ctx.lineCap = 'round'

  // Tail — sways with the cycle
  ctx.lineWidth = s * 0.05
  ctx.beginPath()
  ctx.moveTo(s * 0.22, s * 0.56)
  ctx.bezierCurveTo(
    s * 0.04,
    s * (0.58 + tailWag),
    s * 0.05,
    s * (0.28 + tailWag),
    s * 0.18,
    s * (0.24 + tailWag),
  )
  ctx.stroke()

  // Legs — four paddling limbs (diagonal pairs offset by half a cycle)
  ctx.lineWidth = s * 0.045
  const legs: { hipX: number; offset: number }[] = [
    { hipX: 0.3, offset: 0 }, // back
    { hipX: 0.4, offset: 0.5 },
    { hipX: 0.56, offset: 0.5 }, // front
    { hipX: 0.66, offset: 0 },
  ]
  const hipY = 0.64
  const footY = 0.86
  for (const { hipX, offset } of legs) {
    const a = (phase + offset) * Math.PI * 2
    const footX = hipX + Math.sin(a) * 0.05
    const lift = Math.abs(Math.cos(a)) * 0.03
    ctx.beginPath()
    ctx.moveTo(s * hipX, s * hipY)
    ctx.lineTo(s * footX, s * (footY - lift))
    ctx.stroke()
  }

  // Body
  ctx.beginPath()
  ctx.ellipse(s * 0.42, s * 0.55, s * 0.26, s * 0.17, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.beginPath()
  ctx.arc(s * 0.7, s * 0.45, s * 0.17, 0, Math.PI * 2)
  ctx.fill()

  // Ears — wide bases (cuter) sitting inside the head dome so they connect
  ctx.beginPath()
  ctx.moveTo(s * 0.55, s * 0.34)
  ctx.lineTo(s * 0.53, s * 0.1)
  ctx.lineTo(s * 0.71, s * 0.34)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(s * 0.69, s * 0.34)
  ctx.lineTo(s * 0.9, s * 0.11)
  ctx.lineTo(s * 0.85, s * 0.36)
  ctx.closePath()
  ctx.fill()
}

/** Builds one animation frame: glow pass + crisp pass for visibility on dark bg. */
function makeCatFrame(phase: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_SIZE
  canvas.height = TEX_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Subtle cool rim-glow so the pure-black cat reads against the dark cosmos.
  ctx.shadowColor = 'rgba(150, 205, 255, 0.45)'
  ctx.shadowBlur = 8
  paintCat(ctx, TEX_SIZE, phase)

  // Crisp black core on top (no internal glow seams).
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  paintCat(ctx, TEX_SIZE, phase)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ─── float-through behaviour ───────────────────────────────────────────────────

const CAT_OPACITY = 0.9
const CAT_SCALE = 1.35 // uniform — square texture, so rotation never shears
const ANIM_CYCLE = 0.9 // seconds per limb paddle loop
const SPEED_MIN = 0.4
const SPEED_MAX = 0.9
const ROT_MIN = 0.12 // rad/s — gentle tumble
const ROT_MAX = 0.5
const LIFETIME_MIN = 9
const LIFETIME_MAX = 16
const WAIT_MIN = 5
const WAIT_MAX = 14
const FADE = 1.4 // seconds to fade in / out

const rand = (min: number, max: number) => min + Math.random() * (max - min)

interface CatRun {
  active: boolean
  t: number
  lifetime: number
  waitTimer: number
  pos: THREE.Vector3
  vel: THREE.Vector3
  rotSpeed: number
  animTime: number
  frame: number
}

function startRun(run: CatRun): void {
  // Enter from a random point, drift in a random in-plane direction.
  run.pos.set(rand(-6.5, 6.5), rand(-3.2, 3.2), rand(-1.5, 2.5))
  const angle = rand(0, Math.PI * 2)
  const speed = rand(SPEED_MIN, SPEED_MAX)
  run.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.6, 0)
  run.rotSpeed = rand(ROT_MIN, ROT_MAX) * (Math.random() < 0.5 ? -1 : 1)
  run.lifetime = rand(LIFETIME_MIN, LIFETIME_MAX)
  run.t = 0
  run.active = true
}

/**
 * The author's cat — a glowing black silhouette that floats into the cosmos at a
 * random spot, tumbles gently while paddling its legs, then drifts off and
 * reappears somewhere new after a pause.
 */
export function FloatingCat() {
  const frames = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, i) => makeCatFrame(i / FRAME_COUNT)),
    [],
  )
  const spriteRef = useRef<THREE.Sprite>(null)
  const matRef = useRef<THREE.SpriteMaterial>(null)

  const run = useRef<CatRun>({
    active: false,
    t: 0,
    lifetime: 0,
    waitTimer: rand(1, 4),
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    rotSpeed: 0,
    animTime: 0,
    frame: -1,
  })

  useFrame((_, dt) => {
    const sprite = spriteRef.current
    const mat = matRef.current
    if (!sprite || !mat) return
    const r = run.current

    if (!r.active) {
      mat.opacity = 0
      r.waitTimer -= dt
      if (r.waitTimer <= 0) startRun(r)
      return
    }

    r.t += dt
    r.animTime += dt

    // Drift + tumble
    sprite.position.copy(r.pos.addScaledVector(r.vel, dt))
    mat.rotation += r.rotSpeed * dt

    // Cycle limb-animation frames
    const frame = Math.floor((r.animTime / ANIM_CYCLE) * FRAME_COUNT) % FRAME_COUNT
    if (frame !== r.frame) {
      r.frame = frame
      mat.map = frames[frame] ?? null
      mat.needsUpdate = true
    }

    // Fade in at the start of the run, fade out at the end
    const fadeIn = Math.min(r.t / FADE, 1)
    const fadeOut = Math.min((r.lifetime - r.t) / FADE, 1)
    mat.opacity = Math.max(0, Math.min(fadeIn, fadeOut)) * CAT_OPACITY

    if (r.t >= r.lifetime) {
      r.active = false
      r.waitTimer = rand(WAIT_MIN, WAIT_MAX)
    }
  })

  return (
    <sprite ref={spriteRef} scale={[CAT_SCALE, CAT_SCALE, 1]}>
      <spriteMaterial
        ref={matRef}
        map={frames[0]}
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
      />
    </sprite>
  )
}
