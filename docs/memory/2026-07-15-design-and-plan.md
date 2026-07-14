# 2026-07-15 — Design & Plan

## Done
- Brainstormed requirements with the owner (7 clarifying rounds).
- Wrote spec: `docs/superpowers/specs/2026-07-15-glocal-summit-selection-platform-design.md`.
- Wrote plan: `docs/superpowers/plans/2026-07-15-glocal-summit-platform.md`.

## Key decisions
- **Units:** the 20 individual labs are selectable, grouped under the 7 verbatim
  Topic strings (never mutate that text). 2 blank-topic people = keynotes.
- **Stack:** React 19 + Vite + Supabase, matching the sibling rtd2026-agenda project.
- **Identity:** email match against the 37; admin = client-side `admin`/`123`.
- **Live view:** 4 switchable styles. Public shows name + email + logo.
- **Editing:** locked when admin closes voting.
- **Deploy:** private repo + Vercel (GitHub Pages can't serve private repos free).
- **Logos:** fetched best-effort from the web; fixable in CMS.

## Data source
Google Sheet (public CSV export) → `scripts/participants.csv`.
