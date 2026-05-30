import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectById } from '@/content/projects/projects'

export function ProjectDetail() {
  const { id } = useParams()
  const project = projectById(id)

  if (!project) {
    return (
      <article className="page">
        <Link to="/" className="back" viewTransition>
          ← back to the cosmos
        </Link>
        <h1>Lost in deep space</h1>
        <p>No body with the id “{id}” orbits here yet.</p>
      </article>
    )
  }

  return (
    <article
      className="page"
      style={{ viewTransitionName: `project-${project.id}` } as CSSProperties}
    >
      <Link to="/" className="back" viewTransition>
        ← back to the cosmos
      </Link>
      <h1 style={{ color: project.accent }}>{project.title}</h1>
      <p className="tagline" style={{ color: project.accent }}>
        {project.tagline}
      </p>

      <p>{project.summary}</p>
      <p style={{ color: 'var(--color-ink-dim)' }}>
        The full writeup for this project lands here next — the story of how it was built, rendered
        straight from a simple markdown file with syntax-highlighted code.
      </p>

      <div className="links">
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="back">
            source ↗
          </a>
        )}
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noreferrer" className="back">
            live ↗
          </a>
        )}
      </div>
    </article>
  )
}
