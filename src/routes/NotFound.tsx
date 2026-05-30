import { BackLink } from '@/components/BackLink'

export function NotFound() {
  return (
    <article className="page" style={{ paddingBottom: '2rem' }}>
      <BackLink to="/">← back to the cosmos</BackLink>
      <p className="eyebrow" style={{ marginTop: '2rem' }}>
        404
      </p>
      <h1>Lost in deep space</h1>
      <p className="tagline" style={{ maxWidth: '38rem' }}>
        The page you’re looking for hasn’t landed yet. Return to the gallery and explore the
        projects that are already orbiting.
      </p>
      <p>
        If this path is meant to exist, it may still be under construction in the nebula. For now,
        the starship is headed back home.
      </p>
    </article>
  )
}
