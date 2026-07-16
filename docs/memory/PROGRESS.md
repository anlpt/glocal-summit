# Build Progress — Glocal Summit Selection Platform

This folder is the project's memory. Each finished task has its own dated file
capturing what was done, key decisions, and where to pick up next.

## Index

| Date | Task | File |
|------|------|------|
| 2026-07-15 | Design + plan | [2026-07-15-design-and-plan.md](2026-07-15-design-and-plan.md) |
| 2026-07-15 | Phase 0–1: scaffold + data pipeline | [2026-07-15-scaffold-and-data.md](2026-07-15-scaffold-and-data.md) |
| 2026-07-15 | Phase 2: data layer | [2026-07-15-data-layer.md](2026-07-15-data-layer.md) |
| 2026-07-15 | Phase 3: participant flow | [2026-07-15-participant-flow.md](2026-07-15-participant-flow.md) |
| 2026-07-15 | Phase 4: live view | [2026-07-15-live-view.md](2026-07-15-live-view.md) |
| 2026-07-15 | Phase 5: admin CMS + Excel | [2026-07-15-admin-cms.md](2026-07-15-admin-cms.md) |
| 2026-07-15 | Phase 6: docs + deploy | [2026-07-15-docs-and-deploy.md](2026-07-15-docs-and-deploy.md) |
| 2026-07-15 | Scheduled sheet→Supabase sync (every 5h) | [2026-07-15-sheet-sync-agent.md](2026-07-15-sheet-sync-agent.md) |
| 2026-07-16 | Open-ended question + sheet re-sync | [2026-07-16-open-ended-question-and-resync.md](2026-07-16-open-ended-question-and-resync.md) |

## Current status

All six phases implemented and verified locally (offline mode). Remaining
manual steps are owner-only: create the Supabase project, paste keys, and link
Vercel — all covered in [../GUIDE.md](../GUIDE.md).

## How to resume

1. `npm install`
2. `npm run dev` → http://localhost:5173 (runs on offline seed data)
3. To go live: follow [../GUIDE.md](../GUIDE.md) → Supabase + Vercel sections.
4. Regenerate data from the sheet anytime: `npm run seed` then `npm run logos`.
