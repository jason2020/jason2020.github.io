import type { CSSProperties } from 'react'
import { type ComponentType, lazy, Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { projectById } from '@/content/projects/projects'
import { getPostLoader, getPostMeta } from '@/lib/blog'
import type { PostType } from '@/types/blog'

// ─── inline post section ──────────────────────────────────────────────────────

type LazyLoader = () => Promise<{ default: ComponentType }>

const SECTION_LABEL: Record<PostType, string> = {
  journal: 'The story',
  'deep-dive': 'How it works',
}

/**
 * Lazily loads and renders one MDX post as an inline section on the project page.
 * The section header (type badge + title) is shown synchronously from eagerly-loaded
 * frontmatter so layout doesn't shift when the prose content arrives.
 */
function PostSection({ slug }: { slug: string }) {
  const meta = getPostMeta(slug)
  const loader = getPostLoader(slug)
  const Content = useMemo(() => (loader ? lazy(loader as LazyLoader) : null), [loader])

  if (!meta || !Content) return null

  return (
    <section className="project-post-section">
      <div className="section-divider" aria-hidden="true" />
      <header className="section-header">
        <span className="post-type-badge" data-type={meta.frontmatter.type}>
          {SECTION_LABEL[meta.frontmatter.type]}
        </span>
        <h2>{meta.frontmatter.title}</h2>
      </header>
      <div className="prose">
        <Suspense fallback={<div className="route-loading" style={{ minHeight: '8rem' }} />}>
          <Content />
        </Suspense>
      </div>
    </section>
  )
}

// ─── project detail page ──────────────────────────────────────────────────────

export function ProjectDetail() {
  const { id } = useParams()
  const project = projectById(id)

  if (!project) {
    return (
      <article className="page">
        <BackLink to="/">← back to the cosmos</BackLink>
        <h1>Lost in deep space</h1>
        <p>No body with the id &ldquo;{id}&rdquo; orbits here yet.</p>
      </article>
    )
  }

  const { posts } = project

  return (
    <article
      className="page"
      style={
        { '--accent': project.accent, viewTransitionName: `project-${project.id}` } as CSSProperties
      }
    >
      <BackLink to="/">← back to the cosmos</BackLink>

      <header className="project-header">
        <h1>{project.title}</h1>
        <p className="tagline">{project.tagline}</p>
        <p className="project-summary">{project.summary}</p>

        <div className="links">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="back">
              source ↗
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="back">
              live ↗
            </a>
          )}
        </div>
      </header>

      {posts?.journal && <PostSection slug={posts.journal} />}
      {posts?.deepDive && <PostSection slug={posts.deepDive} />}
    </article>
  )
}
