import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { projects } from '@/content/projects/projects'
import { Gallery } from '@/routes/Gallery'

// The 3D canvas pulls in three.js/WebGL, which jsdom can't run — stub it so we
// can exercise the immersive branch's surrounding markup.
vi.mock('@/scene/CosmosCanvas', () => ({ default: () => null }))

describe('<Gallery forceStatic /> (the /lame view)', () => {
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

describe('<Gallery /> (immersive view)', () => {
  it('renders the cosmos stage hero instead of the card grid', () => {
    render(
      <MemoryRouter>
        <Gallery />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument()
    expect(screen.getByText(/click a body to open it/i)).toBeInTheDocument()
    // The immersive view has no static card links.
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})
