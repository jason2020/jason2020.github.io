import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { projects } from '@/content/projects/projects'
import { Gallery } from '@/routes/Gallery'

describe('<Gallery forceStatic /> (the /lame view)', () => {
  beforeEach(() => {
    // jsdom has no matchMedia; the static branch still calls useReducedMotion.
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  })

  it('renders the static card index instead of the 3D canvas', () => {
    render(
      <MemoryRouter>
        <Gallery forceStatic />
      </MemoryRouter>,
    )

    // One card link per project, and no <canvas> element.
    expect(screen.getAllByRole('link')).toHaveLength(projects.length)
    expect(document.querySelector('canvas')).toBeNull()
  })
})
