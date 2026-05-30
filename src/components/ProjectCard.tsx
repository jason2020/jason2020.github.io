import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '@/types/project'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
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
  )
}
