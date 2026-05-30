import { projectById, projects } from './projects'

describe('project registry', () => {
  it('exposes the This Site meta entry', () => {
    const site = projectById('this-site')
    expect(site).toBeDefined()
    expect(site?.title).toBe('This Site')
  })

  it('returns undefined for an unknown id', () => {
    expect(projectById('does-not-exist')).toBeUndefined()
  })

  it('keeps every project id unique', () => {
    const ids = projects.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every project the fields the scene and pages rely on', () => {
    for (const project of projects) {
      expect(project.id).toBeTruthy()
      expect(project.title).toBeTruthy()
      expect(project.tagline).toBeTruthy()
      expect(project.summary).toBeTruthy()
      expect(project.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(project.position).toHaveLength(3)
      expect(project.tech.length).toBeGreaterThan(0)
    }
  })
})
