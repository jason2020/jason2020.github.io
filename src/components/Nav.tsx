import { NavLink } from 'react-router-dom'

/** Minimal two-item nav: wordmark home, journal link. */
export function Nav() {
  return (
    <header className="nav">
      <NavLink to="/" className="brand" viewTransition end>
        jtay<span> ✦</span>
      </NavLink>
      <NavLink to="/blog" className="nav-link" viewTransition>
        journal
      </NavLink>
    </header>
  )
}
