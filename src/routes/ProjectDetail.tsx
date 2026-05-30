import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { projectById } from '@/content/projects/projects'

export function ProjectDetail() {
  const { id } = useParams()
  const project = projectById(id)

  if (!project) {
    return (
      <article className="page">
        <BackLink to="/">← back to the cosmos</BackLink>
        <h1>Lost in deep space</h1>
        <p>No body with the id “{id}” orbits here yet.</p>
      </article>
    )
  }

  return (
    <article
      className="page"
      style={
        { '--accent': project.accent, viewTransitionName: `project-${project.id}` } as CSSProperties
      }
    >
      <BackLink to="/">← back to the cosmos</BackLink>
      <h1>{project.title}</h1>
      <p className="tagline">{project.tagline}</p>

      <p>{project.summary}</p>
      <p>
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
