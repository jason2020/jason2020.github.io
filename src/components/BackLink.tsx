import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface BackLinkProps {
  to: string
  children: ReactNode
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className="back" viewTransition>
      {children}
    </Link>
  )
}
