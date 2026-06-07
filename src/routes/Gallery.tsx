import { useState } from 'react'
import { useEffect } from 'react'
import { ProjectGrid } from '@/components/ProjectGrid'
import { useReducedMotion } from '@/lib/useReducedMotion'

// The 3D scene (R3F + postprocessing) is heavy — keep it out of the main bundle.
// Defer creating the lazy import until user interaction so it is not preloaded.

interface GalleryProps {
  /** Force the static card index regardless of the OS reduced-motion setting (used by /lame). */
  forceStatic?: boolean
}

export function Gallery({ forceStatic = false }: GalleryProps) {
  const reduced = useReducedMotion()
  const [Scene, setScene] = useState<null | React.ComponentType<any>>(null)
  const [loadScene, setLoadScene] = useState(false)

  // Static view: reduced motion OR the explicit /lame route — a calm, readable card index.
  if (reduced || forceStatic) {
    return (
      <div className="gallery">
        <section className="hero">
          <h1>Welcome!</h1>
          <p className="lede">A small cosmos of the things I&apos;ve made. Pick one.</p>
        </section>
        <ProjectGrid />
      </div>
    )
  }

  // Full experience: the 3D cosmos fills the whole page — but only load it
  // after an explicit user action to avoid preloading the heavy vendor chunk.
  async function handleLoadScene() {
    if (loadScene) return
    setLoadScene(true)
    try {
      if (!Scene) {
        const mod = await import('@/scene/CosmosCanvas')
        setScene(() => mod.default)
      }
    } catch (err) {
      // Keep the UI responsive on failure.
      console.error('Failed to load 3D scene', err)
      setLoadScene(false)
    }
  }

  // Auto-start loading the scene shortly after mount (non-blocking), unless
  // reduced motion or forceStatic is enabled.
  useEffect(() => {
    if (reduced || forceStatic) return
    const id = setTimeout(() => {
      void handleLoadScene()
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, forceStatic])

  return (
    <section className="cosmos-stage">
      {loadScene && Scene ? (
        <Scene />
      ) : (
        <div className="cosmos-placeholder">
          <div className="cosmos-loading" aria-live="polite">aligning the orbits…</div>
        </div>
      )}
      <div className="cosmos-hero">
        <h1>Welcome!</h1>
        <p className="hint">a small cosmos of things I&apos;ve made — click a body to open it</p>
      </div>
    </section>
  )
}
