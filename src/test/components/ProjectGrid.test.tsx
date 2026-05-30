import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectGrid } from '@/components/ProjectGrid'
import { projects } from '@/content/projects/projects'

describe('<ProjectGrid />', () => {
  it('renders a link to every project that points at its detail page', () => {
    render(
      <MemoryRouter>
        <ProjectGrid />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(projects.length)

    const siteLink = screen.getByRole('link', { name: /This Site/i })
    expect(siteLink).toBeInTheDocument()
    expect(siteLink).toHaveAttribute('href', '/projects/this-site')
  })
})
