import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { projects } from '@/content/projects/projects'
import { ProjectDetail } from '@/routes/ProjectDetail'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<ProjectDetail />', () => {
  it('renders the project title for a known project', () => {
    const project = projects[0]
    if (!project) throw new Error('Registry must have at least one project')
    renderAt(`/projects/${project.id}`)
    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
  })

  it('shows the lost-in-deep-space 404 for an unknown project id', () => {
    renderAt('/projects/this-does-not-exist')
    expect(screen.getByRole('heading', { name: /lost in deep space/i })).toBeInTheDocument()
  })

  it('renders source and live links when the project has them', () => {
    const project = projects.find((p) => p.repoUrl)
    if (!project) throw new Error('Expected at least one project with a repoUrl')
    renderAt(`/projects/${project.id}`)
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute('href', project.repoUrl)
  })

  it('renders a section header for each blog post linked to the project', () => {
    const project = projects.find((p) => p.posts?.journal)
    if (!project) throw new Error('Expected at least one project with a journal post')
    renderAt(`/projects/${project.id}`)
    // PostSection renders the type-badge synchronously from eagerly-loaded frontmatter.
    expect(screen.getByText('The story')).toBeInTheDocument()
  })
})
