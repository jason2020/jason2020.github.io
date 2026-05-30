import type { ComponentType } from 'react'

export type ProjectDemo = () => Promise<{ default: ComponentType }>

export interface Project {
  id: string
  title: string
  tagline: string
  summary: string
  tech: string[]
  repoUrl?: string
  liveUrl?: string
  /** accent color (hex) — drives the card's bioluminescent glow */
  accent: string
  /** resting position in the 3D garden [x, y, z] */
  position: [number, number, number]
  /** slug of the companion "how I built this" blog post, if any */
  blogSlug?: string
  /** lazy-loaded live demo, rendered on the project's detail page */
  demo?: ProjectDemo
}

/**
 * The single source of truth for the gallery. Both the 3D garden scene and the
 * project detail pages read from this list.
 */
export const projects: Project[] = [
  {
    id: 'this-site',
    title: 'This Site',
    tagline: 'the cosmos that charts itself',
    summary:
      'The space you are drifting through. An immersive star-chart where every project is its own glowing body. Built with React Three Fiber, GLSL, View Transitions, Bun + Vite, and shipped on GitHub Pages.',
    tech: ['React 19', 'TypeScript', 'R3F', 'GLSL', 'Vite', 'Bun'],
    repoUrl: 'https://github.com/jason2020/jason2020.github.io',
    liveUrl: 'https://jason2020.github.io',
    accent: '#2ff3c4',
    position: [0, 0, 0],
    blogSlug: 'how-i-built-this',
  },
]

export const projectById = (id: string | undefined): Project | undefined =>
  projects.find((p) => p.id === id)
