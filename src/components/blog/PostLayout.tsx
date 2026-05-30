import { MDXProvider } from '@mdx-js/react'
import type { ReactNode } from 'react'

interface ProseWrapperProps {
  children: ReactNode
}

/**
 * Wraps MDX content with the MDXProvider so component overrides propagate,
 * and applies the `.prose` typography class.
 *
 * Used when rendering MDX outside a PostSection context (e.g. standalone previews).
 */
export function ProseWrapper({ children }: ProseWrapperProps) {
  return (
    <MDXProvider>
      <div className="prose">{children}</div>
    </MDXProvider>
  )
}
