import { Link } from 'react-router-dom'

/** Minimal centered wordmark — the cosmos is the whole site. */
export function Nav() {
  return (
    <header className="nav">
      <Link to="/" className="brand" viewTransition>
        jtay<span> ✦</span>
      </Link>
    </header>
  )
}
