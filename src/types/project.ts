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
  accent: string
  position: [number, number, number]
  blogSlug?: string
  demo?: ProjectDemo
}
