import { getAllPosts, getPostLoader, getPostMeta } from '@/lib/blog'

describe('blog loader', () => {
  it('returns all posts sorted newest-first', () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1]!.frontmatter.date >= posts[i]!.frontmatter.date).toBe(true)
    }
  })

  it('returns well-formed frontmatter for every post', () => {
    for (const { slug, frontmatter: fm } of getAllPosts()) {
      expect(slug).toBeTruthy()
      expect(fm.title).toBeTruthy()
      expect(fm.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(['journal', 'deep-dive']).toContain(fm.type)
      expect(fm.excerpt).toBeTruthy()
      expect(Array.isArray(fm.tags)).toBe(true)
    }
  })

  it('getPostMeta returns metadata for a known slug', () => {
    const meta = getPostMeta('this-site-journal')
    expect(meta).not.toBeNull()
    expect(meta?.frontmatter.type).toBe('journal')
    expect(meta?.frontmatter.projectId).toBe('this-site')
  })

  it('getPostMeta returns null for an unknown slug', () => {
    expect(getPostMeta('does-not-exist')).toBeNull()
  })

  it('getPostLoader returns a loader function for a known slug', () => {
    const loader = getPostLoader('this-site-deep-dive')
    expect(typeof loader).toBe('function')
  })

  it('getPostLoader returns null for an unknown slug', () => {
    expect(getPostLoader('does-not-exist')).toBeNull()
  })
})
