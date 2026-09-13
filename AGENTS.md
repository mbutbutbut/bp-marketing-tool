<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design Context

Boulder Parc Template Studio is an internal **Operate**-mode tool for a
climbing gym, not a consumer or marketing product. Two personas:
**Owner** (in-house designer, low-frequency/high-complexity setup:
Figma import, field mapping, canvas editing) and **Editor** (social
media manager / event planner, high-frequency/low-complexity task: fill
2-4 fields, export). Team size: ~3 people. Visual restraint (plain
palette, system font, no imagery) is a deliberate, confirmed choice —
don't score it down without checking whether a specific instance costs
either persona something real.

Full combined design-review rubric (Impeccable's generic critique plus
5 dimensions specific to this app's architecture): `docs/design-review.md`.
When asked to run a design critique on this app, fold those 5
dimensions into the review — they don't get picked up automatically.

