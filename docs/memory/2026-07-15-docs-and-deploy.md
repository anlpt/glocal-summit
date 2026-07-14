# 2026-07-15 — Phase 6: Docs + Deploy

## Done
- `docs/GUIDE.md`: full illustrated guide (offline vs live, Supabase setup with
  step diagrams, Vercel deploy, usage per role, Excel export, refresh-from-sheet,
  troubleshooting, security note).
- `docs/memory/*`: this progress folder (per-phase files + PROGRESS index).
- `README.md`: quickstart + layout + scripts.
- `vercel.json`: build config + SPA rewrite.
- Pushed to private GitHub repo.

## Owner-only remaining steps (cannot be automated — need owner signup)
1. Create the Supabase project; run `schema.sql` + `seed.sql`; paste keys into
   `.env.local` (and Vercel env vars).
2. Import the repo into Vercel and deploy.
Both are in GUIDE.md §2 and §3.

## If resuming
Everything builds and is verified offline. Next real work is only the two
owner steps above, or feature tweaks requested after review.
