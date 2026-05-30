import type { Project } from '@/types/project'

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
