import type { ComponentType } from 'react'

export type ProjectDemo = () => Promise<{ default: ComponentType }>

export interface Project {
  id: string
  title: string
  tagline: string
  summary: string
  tech: string[]
  /**
   * Thematic tags used for grouping and future constellation relationships.
   * e.g. ['web', 'generative-art', 'tools']
   */
  tags?: string[]
  repoUrl?: string
  liveUrl?: string
  /** Hex accent colour — drives the card glow and detail page heading */
  accent: string
  /** Resting position in the 3D cosmos [x, y, z] */
  position: [number, number, number]
  /** Slugs of companion blog posts rendered inline on the project page */
  posts?: {
    /** Personal story — written in the author's voice */
    journal?: string
    /** Technical explainer — how it was built and why */
    deepDive?: string
  }
  /** Lazy-loaded live demo rendered on the project detail page */
  demo?: ProjectDemo
}
