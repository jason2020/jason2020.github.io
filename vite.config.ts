/// <reference types="vitest/config" />
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  // Vite 8 resolves tsconfig `paths` (our `@/*` alias) natively.
  resolve: { tsconfigPaths: true },
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark-default' } }],
        ],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    glsl(),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Keep the heavy 3D libraries out of the main bundle.
        manualChunks(id) {
          if (id.includes('node_modules') && /(three|@react-three|postprocessing)/.test(id)) {
            return 'vendor-3d'
          }
        },
      },
    },
  },
  test: {
    include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx', // app entry/bootstrap
        'src/scene/**', // WebGL + GLSL — not unit-testable under jsdom
        'src/types/**', // type-only declarations
        'src/test/**', // the tests themselves
        'src/**/*.d.ts',
      ],
    },
  },
})
