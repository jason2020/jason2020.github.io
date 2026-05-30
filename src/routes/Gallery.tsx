import { lazy, Suspense } from 'react'
import { ProjectGrid } from '@/components/ProjectGrid'
import { useReducedMotion } from '@/lib/useReducedMotion'

// The 3D scene (R3F + postprocessing) is heavy — keep it out of the main bundle.
const CosmosCanvas = lazy(() => import('@/scene/CosmosCanvas'))

interface GalleryProps {
  /** Force the static card index regardless of the OS reduced-motion setting (used by /lame). */
  forceStatic?: boolean
}

export function Gallery({ forceStatic = false }: GalleryProps) {
  const reduced = useReducedMotion()

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

  // Full experience: the 3D cosmos fills the whole page.
  return (
    <section className="cosmos-stage">
      <Suspense fallback={<div className="cosmos-loading">aligning the orbits…</div>}>
        <CosmosCanvas />
      </Suspense>
      <div className="cosmos-hero">
        <h1>Welcome!</h1>
        <p className="hint">a small cosmos of things I&apos;ve made — click a body to open it</p>
      </div>
    </section>
  )
}
