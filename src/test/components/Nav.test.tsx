import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Nav } from '@/components/Nav'

describe('<Nav />', () => {
  it('renders the jtay wordmark as a home link', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveTextContent('jtay')
  })
})
