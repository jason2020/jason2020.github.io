import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { getAllPosts } from '@/lib/blog'
import type { PostType } from '@/types/blog'

const TYPE_LABEL: Record<PostType, string> = {
  journal: 'Journal',
  'deep-dive': 'Deep Dive',
}

type Filter = PostType | 'all'

export function Blog() {
  const posts = getAllPosts()
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'all' ? posts : posts.filter((p) => p.frontmatter.type === filter)

  return (
    <div className="page">
      <BackLink to="/">← back to the cosmos</BackLink>

      <h1>Journal</h1>
      <p className="page-intro">
        Two kinds of writing: personal thoughts on what I&apos;ve been building, and technical deep
        dives into how things actually work under the hood.
      </p>

      <div className="blog-filters">
        {(['all', 'journal', 'deep-dive'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className="blog-filter-btn"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="blog-empty">Nothing here yet.</p>}

      <ol className="post-list">
        {visible.map(({ slug, frontmatter: fm }) => {
          // Posts link to their project page (all content lives there).
          // Fall back to a standalone slug URL for future project-unlinked posts.
          const href = fm.projectId ? `/projects/${fm.projectId}` : `/blog/${slug}`

          return (
            <li key={slug} className="post-list-item">
              <span className="post-type-badge" data-type={fm.type}>
                {TYPE_LABEL[fm.type]}
              </span>
              <Link to={href} className="post-list-title" viewTransition>
                {fm.title}
              </Link>
              <p className="post-list-excerpt">{fm.excerpt}</p>
              <p className="post-list-meta">
                <time dateTime={fm.date}>
                  {new Date(fm.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {fm.tags.map((t) => (
                  <span key={t} className="post-tag">
                    {t}
                  </span>
                ))}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
