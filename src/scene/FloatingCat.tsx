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

  // Body — rounder, plumper little torso
  ctx.beginPath()
  ctx.ellipse(s * 0.43, s * 0.55, s * 0.23, s * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // Head — a touch bigger and rounder so it reads as a cute round kitty
  ctx.beginPath()
  ctx.arc(s * 0.69, s * 0.44, s * 0.18, 0, Math.PI * 2)
  ctx.fill()

  // Ears — wide bases, shorter tips: rounder, kitten-cute proportions
  ctx.beginPath()
  ctx.moveTo(s * 0.54, s * 0.33)
  ctx.lineTo(s * 0.55, s * 0.18)
  ctx.lineTo(s * 0.71, s * 0.34)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(s * 0.68, s * 0.34)
  ctx.lineTo(s * 0.86, s * 0.19)
  ctx.lineTo(s * 0.85, s * 0.35)
  ctx.closePath()
  ctx.fill()
}

/**
 * Builds one animation frame: glow pass + crisp pass for visibility on dark bg.
 * `faceLeft` mirrors the silhouette so the head leads to the left — we keep both
 * facings as separate textures so the cat can always face into the screen
 * without relying on negative sprite scale (which mirrors unreliably).
 */
function makeCatFrame(phase: number, faceLeft: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_SIZE
  canvas.height = TEX_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  if (faceLeft) {
    ctx.translate(TEX_SIZE, 0)
    ctx.scale(-1, 1)
  }

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

// ─── peek behaviour ─────────────────────────────────────────────────────────
// The cat slinks in from any screen edge, peeks for a short beat, then slips
// back out — and bolts if you click it. Edge geometry is derived from the live
// viewport so the peek lines up with the real screen edge at any aspect ratio.

const CAT_OPACITY = 0.92
const CAT_SCALE = 1.0
const ANIM_CYCLE = 1.3 // seconds per paddle loop — unhurried while peeking
const PEEK_OUT = 0.05 // how far past the edge the cat's centre sits (head leads in)
const HIDDEN_MARGIN = 1.0 // how far off-screen the fully-hidden position sits
const ENTER_DUR = 0.55
const EXIT_DUR = 0.6
const PEEK_MIN = 0.8 // a brief peek
const PEEK_MAX = 2.2
const WAIT_MIN = 2.5
const WAIT_MAX = 7
const FADE = 0.4 // seconds to fade in / out
const BOB_AMP = 0.06 // gentle in/out bob while peeking
const TILT_AMP = 0.05 // gentle curious head-tilt while peeking

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t * t

type Edge = 'left' | 'right' | 'top' | 'bottom'

/**
 * Per-edge geometry. `sign` is the direction along the slide axis, `rotation`
 * spins the side-profile sprite so its head points toward screen centre, and
 * `faceLeft` selects the mirrored frame set where needed (so the cat is never
 * upside-down). The art faces +x by default, so:
 *   left  → head +x (no change)   right → head -x (mirror)
 *   top   → head -y (rotate -90°)  bottom → head +y (rotate +90°)
 */
const EDGES: Record<
  Edge,
  { vertical: boolean; sign: number; rotation: number; faceLeft: boolean }
> = {
  left: { vertical: false, sign: -1, rotation: 0, faceLeft: false },
  right: { vertical: false, sign: 1, rotation: 0, faceLeft: true },
  top: { vertical: true, sign: 1, rotation: -Math.PI / 2, faceLeft: false },
  bottom: { vertical: true, sign: -1, rotation: Math.PI / 2, faceLeft: false },
}
const EDGE_LIST = Object.keys(EDGES) as Edge[]

type CatPhase = 'enter' | 'peek' | 'exit'

interface CatRun {
  active: boolean
  phase: CatPhase
  t: number // seconds elapsed in the current phase
  peekDuration: number
  waitTimer: number
  edge: Edge
  cross: number // position along the edge, as a fraction of the cross half-extent
  animTime: number
  frame: number
}

function startRun(run: CatRun): void {
  run.edge = EDGE_LIST[Math.floor(Math.random() * EDGE_LIST.length)] ?? 'left'
  run.cross = rand(-0.55, 0.55)
  run.peekDuration = rand(PEEK_MIN, PEEK_MAX)
  run.phase = 'enter'
  run.t = 0
  run.frame = -1 // force a texture refresh for the new edge's facing
  run.active = true
}

/**
 * The author's cat — a pure-black silhouette that peeks in from a screen edge,
 * watches for a brief moment, then slinks back out. Click it and it bolts.
 */
export function FloatingCat() {
  // Two facings baked as separate textures so the cat can always face inward.
  const framesRight = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, i) => makeCatFrame(i / FRAME_COUNT, false)),
    [],
  )
  const framesLeft = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, i) => makeCatFrame(i / FRAME_COUNT, true)),
    [],
  )
  const spriteRef = useRef<THREE.Sprite>(null)
  const matRef = useRef<THREE.SpriteMaterial>(null)

  const run = useRef<CatRun>({
    active: false,
    phase: 'enter',
    t: 0,
    peekDuration: 0,
    waitTimer: rand(0.5, 2.5),
    edge: 'left',
    cross: 0,
    animTime: 0,
    frame: -1,
  })

  const endRun = (r: CatRun) => {
    r.active = false
    r.waitTimer = rand(WAIT_MIN, WAIT_MAX)
  }

  useFrame((state, dt) => {
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

    const cfg = EDGES[r.edge]
    const half = cfg.vertical ? state.viewport.height / 2 : state.viewport.width / 2
    const crossHalf = cfg.vertical ? state.viewport.width / 2 : state.viewport.height / 2
    const hiddenMain = cfg.sign * (half + HIDDEN_MARGIN)
    const peekMain = cfg.sign * (half + PEEK_OUT)
    const crossPos = r.cross * crossHalf

    let main = peekMain
    let opacity = CAT_OPACITY
    let tilt = 0

    switch (r.phase) {
      case 'enter': {
        const p = Math.min(r.t / ENTER_DUR, 1)
        main = hiddenMain + (peekMain - hiddenMain) * easeOut(p)
        opacity = Math.min(r.t / FADE, 1) * CAT_OPACITY
        if (p >= 1) {
          r.phase = 'peek'
          r.t = 0
        }
        break
      }
      case 'peek': {
        main = peekMain + Math.sin(r.animTime * 1.6) * BOB_AMP
        tilt = Math.sin(r.animTime * 1.1) * TILT_AMP
        if (r.t >= r.peekDuration) {
          r.phase = 'exit'
          r.t = 0
        }
        break
      }
      case 'exit': {
        const p = Math.min(r.t / EXIT_DUR, 1)
        main = peekMain + (hiddenMain - peekMain) * easeIn(p)
        opacity = (1 - p) * CAT_OPACITY
        if (p >= 1) endRun(r)
        break
      }
    }

    if (cfg.vertical) sprite.position.set(crossPos, main, 0)
    else sprite.position.set(main, crossPos, 0)
    mat.rotation = cfg.rotation + tilt
    mat.opacity = Math.max(0, opacity)

    // Cycle the paddle frames (using this edge's facing) for subtle life.
    const frameSet = cfg.faceLeft ? framesLeft : framesRight
    const frame = Math.floor((r.animTime / ANIM_CYCLE) * FRAME_COUNT) % FRAME_COUNT
    if (frame !== r.frame) {
      r.frame = frame
      mat.map = frameSet[frame] ?? null
      mat.needsUpdate = true
    }
  })

  return (
    <sprite ref={spriteRef} scale={[CAT_SCALE, CAT_SCALE, 1]}>
      <spriteMaterial
        ref={matRef}
        map={framesRight[0]}
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
      />
    </sprite>
  )
}
