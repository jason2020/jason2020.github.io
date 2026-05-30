import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'

describe('<BackLink />', () => {
  it('renders an anchor with the correct href and text', () => {
    render(
      <MemoryRouter>
        <BackLink to="/projects">← back</BackLink>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /back/i })
    expect(link).toHaveAttribute('href', '/projects')
  })
})
