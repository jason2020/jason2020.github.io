// Turns the Vitest coverage summary into a shields.io "endpoint" badge JSON.
// The README points a shields endpoint badge at the committed file, so the
// badge updates whenever CI regenerates it. Run after `bun run test:coverage`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const SUMMARY_PATH = 'coverage/coverage-summary.json'
const OUT_PATH = '.github/badges/coverage.json'

const pct = Math.round(JSON.parse(readFileSync(SUMMARY_PATH, 'utf8')).total.lines.pct)

const color =
  pct >= 90
    ? 'brightgreen'
    : pct >= 80
      ? 'green'
      : pct >= 70
        ? 'yellowgreen'
        : pct >= 60
          ? 'yellow'
          : 'red'

const badge = { schemaVersion: 1, label: 'coverage', message: `${pct}%`, color }

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, `${JSON.stringify(badge, null, 2)}\n`)
console.log(`coverage badge → ${OUT_PATH}: ${badge.message} (${color})`)
