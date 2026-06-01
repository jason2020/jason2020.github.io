import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/types/project'

const project: Project = {
  id: 'demo',
  title: 'Demo',
  tagline: 'a demo tagline',
  summary: 'a demo summary',
  tech: ['one', 'two', 'three', 'four', 'five', 'six'],
  accent: '#abcdef',
  position: [0, 0, 0],
}

describe('<ProjectCard />', () => {
  it('links to the project page and caps the tech list at five', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={project} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/demo')
    expect(screen.getByRole('heading', { name: 'Demo' })).toBeInTheDocument()
    // tech has six entries but only the first five are shown.
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.queryByText('six')).toBeNull()
  })
})
