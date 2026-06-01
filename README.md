# jtay's personal website

![coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjason2020%2Fjason2020.github.io%2Fmain%2F.github%2Fbadges%2Fcoverage.json)

An immersive 3D personal site — a small **cosmos** where each project is a glowing body you
can click into. Built as a self-referential gallery: the site is its own first exhibit.

Live: **https://jason2020.github.io**

## Stack

- **React 19** + **TypeScript** (strict) · **Vite 8** bundler · **Bun** package manager / runner
- **React Three Fiber** + **drei** + **postprocessing** (bloom) for the 3D scene
- Custom **GLSL** nebula shader · **Tailwind CSS v4** for UI chrome
- **React Router v7** with the **View Transitions API** for shared-element page morphs
- **Biome** (lint + format) · **Vitest** + Testing Library (unit/component tests)
- Deployed to **GitHub Pages** via GitHub Actions

## Develop

```bash
bun install
bun run dev        # http://localhost:5173
```

## Scripts

| Script | Does |
|---|---|
| `bun run dev` | Start the Vite dev server (HMR) |
| `bun run build` | Type-check (`tsc -b`) and build to `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run lint` | Biome check (lint + format verify) |
| `bun run format` | Biome auto-fix |
| `bun run test` | Run the Vitest suite |
| `bun run test:coverage` | Run tests and write a coverage report to `coverage/` |

## Testing

Unit and component tests live under `src/test/`, with test setup in `src/test/setup.ts`.
This keeps source files clean while keeping tests easy to run and maintain in a single dedicated directory.

Run `bun run test:coverage` for a coverage report (text summary in the console, browsable
HTML in `coverage/`). The badge at the top is regenerated on every push to `main` by
[`.github/workflows/coverage.yml`](.github/workflows/coverage.yml), which writes a
[shields.io endpoint](https://shields.io/badges/endpoint-badge) to `.github/badges/coverage.json`.

The 3D scene (`src/scene/**`) is WebGL/GLSL that jsdom can't execute, so it's excluded from
coverage; everything else — components, routes, `lib`, and the project registry — is covered.

## Project registry

Projects live in [`src/content/projects/projects.ts`](src/content/projects/projects.ts) — the single
source of truth that drives both the 3D scene and each project's page. Add a project there and it
appears as a new body in the cosmos.

## Deploy

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
builds with Bun and publishes `dist/` to GitHub Pages.
