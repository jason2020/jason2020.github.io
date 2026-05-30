import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '@/content/projects/projects'

/** The readable card index of every project — also the reduced-motion fallback for the 3D garden. */
export function ProjectGrid() {
  return (
    <section className="grid">
      {projects.map((project) => (
        <Link
          key={project.id}
          to={`/projects/${project.id}`}
          viewTransition
          className="card"
          style={
            {
              '--accent': project.accent,
              viewTransitionName: `project-${project.id}`,
            } as CSSProperties
          }
        >
          <span className="card-glow" aria-hidden="true" />
          <h2>{project.title}</h2>
          <p className="tagline">{project.tagline}</p>
          <p className="summary">{project.summary}</p>
          <ul className="tech">
            {project.tech.slice(0, 5).map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </Link>
      ))}
    </section>
  )
}
