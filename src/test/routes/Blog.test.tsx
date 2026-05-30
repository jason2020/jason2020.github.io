import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { getAllPosts } from '@/lib/blog'
import { Blog } from '@/routes/Blog'

describe('<Blog />', () => {
  function renderBlog() {
    return render(
      <MemoryRouter>
        <Blog />
      </MemoryRouter>,
    )
  }

  it('renders a list item for every post', () => {
    renderBlog()
    const posts = getAllPosts()
    // Each post renders as an <li>; at least one post should be present.
    expect(posts.length).toBeGreaterThan(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(posts.length)
  })

  it('links each post to its project page when projectId is set', () => {
    renderBlog()
    const journalPost = getAllPosts().find((p) => p.frontmatter.projectId === 'this-site')
    expect(journalPost).toBeDefined()
    const link = screen.getByRole('link', { name: journalPost?.frontmatter.title })
    expect(link).toHaveAttribute('href', `/projects/${journalPost?.frontmatter.projectId}`)
  })

  it('filters to only journal posts when Journal is pressed', async () => {
    renderBlog()
    const journalBtn = screen.getByRole('button', { name: /journal/i })
    await userEvent.click(journalBtn)

    const journalPosts = getAllPosts().filter((p) => p.frontmatter.type === 'journal')
    expect(screen.getAllByRole('listitem')).toHaveLength(journalPosts.length)
  })

  it('filters to only deep-dive posts when Deep Dive is pressed', async () => {
    renderBlog()
    const deepDiveBtn = screen.getByRole('button', { name: /deep dive/i })
    await userEvent.click(deepDiveBtn)

    const deepDivePosts = getAllPosts().filter((p) => p.frontmatter.type === 'deep-dive')
    expect(screen.getAllByRole('listitem')).toHaveLength(deepDivePosts.length)
  })

  it('shows all posts again after clicking All', async () => {
    renderBlog()
    await userEvent.click(screen.getByRole('button', { name: /journal/i }))
    await userEvent.click(screen.getByRole('button', { name: /^all$/i }))

    expect(screen.getAllByRole('listitem')).toHaveLength(getAllPosts().length)
  })
})
