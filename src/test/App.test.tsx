import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('<App /> routing', () => {
  it('always renders the wordmark and footer chrome', () => {
    renderAt('/blog')
    expect(screen.getByRole('banner')).toHaveTextContent(/jtay/i)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/jtay/i)
  })

  it('routes /blog to the journal index', () => {
    renderAt('/blog')
    expect(screen.getByRole('heading', { level: 1, name: /journal/i })).toBeInTheDocument()
  })

  it('routes /projects/:id to the project detail page', () => {
    renderAt('/projects/this-site')
    expect(screen.getByRole('heading', { level: 1, name: /this site/i })).toBeInTheDocument()
  })

  it('routes /lame to the static card index', () => {
    renderAt('/lame')
    expect(screen.getByRole('link', { name: /this site/i })).toHaveAttribute(
      'href',
      '/projects/this-site',
    )
  })

  it('falls back to the 404 page for an unknown path', () => {
    renderAt('/no-such-place')
    expect(screen.getByRole('heading', { name: /lost in deep space/i })).toBeInTheDocument()
  })
})
