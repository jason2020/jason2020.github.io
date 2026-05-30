import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotFound } from '@/routes/NotFound'

describe('<NotFound />', () => {
  it('renders the themed 404 page for an unknown path', () => {
    render(
      <MemoryRouter initialEntries={['/some/unknown/path']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /back to the cosmos/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /lost in deep space/i })).toBeInTheDocument()
    expect(screen.getByText(/the page you’re looking for hasn’t landed yet/i)).toBeInTheDocument()
  })
})
