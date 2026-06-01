import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/Footer'

describe('<Footer />', () => {
  it('shows the current year and the wordmark', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(new Date().getFullYear().toString())
    expect(footer).toHaveTextContent(/jtay/i)
  })
})
