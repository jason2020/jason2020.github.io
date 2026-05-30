import { ProjectCard } from '@/components/ProjectCard'
import { projects } from '@/content/projects/projects'

/** The readable card index of every project — also the reduced-motion fallback for the 3D canvas. */
export function ProjectGrid() {
  return (
    <section className="grid">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  )
}
