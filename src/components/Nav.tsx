import { Link } from 'react-router-dom'

/** Minimal wordmark — no tabs. The cosmos is the whole site. */
export function Nav() {
  return (
    <header className="nav">
      <Link to="/" className="brand" viewTransition>
        jtay<span> ✦</span>
      </Link>
    </header>
  )
}
