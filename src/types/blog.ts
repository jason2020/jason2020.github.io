export type PostType = 'journal' | 'deep-dive'

export interface PostFrontmatter {
  title: string
  /** ISO-8601 date string, e.g. "2026-05-30" */
  date: string
  type: PostType
  /** Links this post to a project in the registry */
  projectId?: string
  excerpt: string
  tags: string[]
}

export interface BlogPostMeta {
  slug: string
  frontmatter: PostFrontmatter
}
