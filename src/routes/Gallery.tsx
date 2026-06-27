import { useEffect, useState } from 'react'
import { ProjectGrid } from '@/components/ProjectGrid'
import { useReducedMotion } from '@/lib/useReducedMotion'

// The 3D scene (R3F + postprocessing) is heavy — keep it out of the main bundle
// and only import it after mount, so it is never preloaded.

interface GalleryProps {
  /** Force the static card index regardless of the OS reduced-motion setting (used by /lame). */
  forceStatic?: boolean
}

export function Gallery({ forceStatic = false }: GalleryProps) {
  const reduced = useReducedMotion()
  const [Scene, setScene] = useState<React.ComponentType | null>(null)
  const isStatic = reduced || forceStatic

  // Load the heavy 3D chunk shortly after mount (non-blocking), but never while the
  // static fallback is showing. Declared before any early return so the hook order
  // stays stable if the reduced-motion preference flips at runtime.
  useEffect(() => {
    if (isStatic || Scene) return
    let cancelled = false
    const id = setTimeout(() => {
      void import('@/scene/CosmosCanvas')
        .then((mod) => {
          if (!cancelled) setScene(() => mod.default)
        })
        .catch((err) => {
          // Keep the UI responsive on failure.
          console.error('Failed to load 3D scene', err)
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [isStatic, Scene])

  // Static view: reduced motion OR the explicit /lame route — a calm, readable card index.
  if (isStatic) {
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

  // Full experience: the 3D cosmos fills the whole page once its chunk has loaded.
  return (
    <section className="cosmos-stage">
      {Scene ? (
        <Scene />
      ) : (
        <div className="cosmos-placeholder">
          <div className="cosmos-loading" aria-live="polite">
            aligning the orbits…
          </div>
        </div>
      )}
      <div className="cosmos-hero">
        <h1>Welcome!</h1>
        <p className="hint">a small cosmos of things I&apos;ve made — click a body to open it</p>
      </div>
    </section>
  )
}
