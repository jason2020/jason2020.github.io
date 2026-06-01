import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

// A small pool of meteors that fly through the 3D field at random intervals.
// Each is a single additive sprite — a thin tinted streak with a small crisp
// head — moving along a 3D path (with a toward-camera component, so perspective
// and size-attenuation sell the depth) and faded with a smooth envelope.

const METEOR_KEYS = ['meteor-a', 'meteor-b'] as const
const STREAK_LEN = 2.0 // world length of the streak quad
const STREAK_THICK = 0.34 // world height of the streak quad
const SPEED_MIN = 9
const SPEED_MAX = 15
const LIFE_MIN = 1.0
const LIFE_MAX = 1.8
const WAIT_MIN = 3 // min gap before a meteor flies again
const WAIT_MAX = 11
const BASE_OPACITY = 0.55 // dim — they sit deep in the field and blend with it
const Z_START_MIN = -7.5 // start deep in the field…
const Z_START_MAX = -4.5

const rand = (min: number, max: number) => min + Math.random() * (max - min)

// Scratch objects reused each frame to keep the meteors allocation-free.
const _dir = new THREE.Vector3()
const _camVel = new THREE.Vector3()
const _invQuat = new THREE.Quaternion()

/** A thin tinted streak texture: transparent tail → small crisp head. */
function makeStreakTexture(): THREE.CanvasTexture {
  const w = 256
  const h = 48
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Tail → head brightness gradient along x, tinted cool blue.
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, 'rgba(120, 180, 255, 0)')
  g.addColorStop(0.6, 'rgba(165, 205, 255, 0.18)')
  g.addColorStop(0.9, 'rgba(210, 232, 255, 0.8)')
  g.addColorStop(1, 'rgba(245, 250, 255, 1)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Small crisp head glow at the leading (right) end.
  ctx.globalCompositeOperation = 'lighter'
  const head = ctx.createRadialGradient(w - 8, h / 2, 0, w - 8, h / 2, 11)
  head.addColorStop(0, 'rgba(255, 255, 255, 1)')
  head.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = head
  ctx.fillRect(w - 24, 0, 24, h)

  // Mask to a thin central band (tight vertical falloff → a fine line).
  ctx.globalCompositeOperation = 'destination-in'
  const v = ctx.createLinearGradient(0, 0, 0, h)
  v.addColorStop(0, 'rgba(0, 0, 0, 0)')
  v.addColorStop(0.4, 'rgba(0, 0, 0, 0)')
  v.addColorStop(0.5, 'rgba(0, 0, 0, 1)')
  v.addColorStop(0.6, 'rgba(0, 0, 0, 0)')
  v.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

interface MeteorState {
  active: boolean
  t: number
  life: number
  wait: number
  pos: THREE.Vector3
  vel: THREE.Vector3
}

function Meteor({ texture }: { texture: THREE.CanvasTexture }) {
  const spriteRef = useRef<THREE.Sprite>(null)
  const matRef = useRef<THREE.SpriteMaterial>(null)
  const state = useRef<MeteorState>({
    active: false,
    t: 0,
    life: 0,
    wait: rand(1, WAIT_MAX),
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
  })

  useFrame(({ viewport, camera }, dt) => {
    const sprite = spriteRef.current
    const mat = matRef.current
    if (!sprite || !mat) return
    const m = state.current

    if (!m.active) {
      mat.opacity = 0
      m.wait -= dt
      if (m.wait <= 0) {
        const halfW = viewport.width / 2
        const halfH = viewport.height / 2
        // 3D direction: lateral diagonal + a drift toward the camera (+z).
        const rightward = Math.random() < 0.5
        const ax = (0.5 + Math.random() * 0.5) * (rightward ? 1 : -1)
        const ay = -(0.3 + Math.random() * 0.5)
        const az = 0.3 + Math.random() * 0.6
        _dir.set(ax, ay, az).normalize()
        m.vel.copy(_dir).multiplyScalar(rand(SPEED_MIN, SPEED_MAX))
        // Emerge from deep in the central field and sweep outward/forward.
        m.pos.set(
          rand(-halfW * 0.6, halfW * 0.6),
          rand(halfH * 0.4, halfH * 1.0),
          rand(Z_START_MIN, Z_START_MAX),
        )
        m.life = rand(LIFE_MIN, LIFE_MAX)
        m.t = 0
        m.active = true
      }
      return
    }

    m.t += dt
    sprite.position.copy(m.pos.addScaledVector(m.vel, dt))

    // Align the streak to its motion as the camera sees it (accounts for 3D).
    _camVel.copy(m.vel).applyQuaternion(_invQuat.copy(camera.quaternion).invert())
    mat.rotation = Math.atan2(_camVel.y, _camVel.x)

    // Smooth fade in and out across the streak's life.
    mat.opacity = Math.sin(Math.PI * Math.min(m.t / m.life, 1)) * BASE_OPACITY

    if (m.t >= m.life) {
      m.active = false
      m.wait = rand(WAIT_MIN, WAIT_MAX)
    }
  })

  return (
    <sprite ref={spriteRef} scale={[STREAK_LEN, STREAK_THICK, 1]}>
      <spriteMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </sprite>
  )
}

/** Occasional meteors flying through the cosmos. */
export function ShootingStars() {
  const texture = useMemo(() => makeStreakTexture(), [])
  return (
    <>
      {METEOR_KEYS.map((key) => (
        <Meteor key={key} texture={texture} />
      ))}
    </>
  )
}
