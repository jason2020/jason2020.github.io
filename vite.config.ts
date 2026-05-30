/// <reference types="vitest/config" />
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
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
        remarkPlugins: [remarkGfm],
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
  },
})
