import type { ComponentType } from 'react'
import type { BlogPostMeta, PostFrontmatter } from '@/types/blog'

// Eagerly load only frontmatter for the index (cheap — no MDX content compiled).
const frontmatterModules = import.meta.glob<PostFrontmatter>('../content/blog/*.mdx', {
  eager: true,
  import: 'frontmatter',
})

// Lazy loaders for full MDX content + frontmatter (used by the post page).
const contentModules = import.meta.glob<{ default: ComponentType; frontmatter: PostFrontmatter }>(
  '../content/blog/*.mdx',
)

function pathToSlug(path: string): string {
  return path.replace('../content/blog/', '').replace('.mdx', '')
}

/**
 * Returns all posts sorted newest-first.
 * Runs synchronously — frontmatter is eagerly loaded at build time.
 */
export function getAllPosts(): BlogPostMeta[] {
  return Object.entries(frontmatterModules)
    .map(([path, frontmatter]) => ({ slug: pathToSlug(path), frontmatter }))
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
}

/**
 * Returns metadata for a single post synchronously (frontmatter is eagerly loaded).
 * Returns null if the slug does not correspond to an existing post.
 */
export function getPostMeta(slug: string): BlogPostMeta | null {
  const key = `../content/blog/${slug}.mdx`
  const frontmatter = frontmatterModules[key]
  if (!frontmatter) return null
  return { slug, frontmatter }
}

/**
 * Returns the lazy module loader for a single post's MDX content.
 * Returns null if no post exists for the given slug.
 */
export function getPostLoader(
  slug: string,
): (() => Promise<{ default: ComponentType; frontmatter: PostFrontmatter }>) | null {
  const key = `../content/blog/${slug}.mdx`
  return contentModules[key] ?? null
}
