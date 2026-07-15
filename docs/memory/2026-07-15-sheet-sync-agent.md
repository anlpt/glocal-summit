# 2026-07-15 — Scheduled Sheet → Supabase Sync

## Done
- `scripts/lib/parse-sheet.mjs`: shared CSV parser (natural keys) used by both
  `build-seed.mjs` (refactored to use it) and the sync. Seed output verified
  byte-identical after the refactor.
- `scripts/sync-sheet.mjs`: fetches the sheet CSV, reconciles groups/labs/
  participants into Supabase by **natural key** (group name / lab name /
  participant email). Inserts new, updates changed fields. **No deletes** by
  default (removed people logged as "orphans"); `ALLOW_DELETE=true` opts in.
  Preserves CMS-set logos (`org_logo_url`) and group colors.
- `.github/workflows/sync-sheet.yml`: cron `0 */5 * * *` (every 5h) +
  `workflow_dispatch` (with an `allow_delete` input). Reads `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE` (falls back to `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- `npm run sync` script added.
- GUIDE.md §5 documents turning it on.

## Verified
- Syntax, parser (7 groups / 21 labs / 37 participants against the LIVE sheet —
  note the sheet already grew from 20→21 labs, which the sync will pick up).
- Clean failure + exit 1 when creds absent.
- Manual workflow_dispatch on GitHub ran the full pipeline and stopped exactly at
  "Missing Supabase credentials" (run 29386366624) — pipeline is correctly wired.

## Activate (owner-only)
Add repo secrets `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE` (Settings → Secrets and
variables → Actions). Then it runs every 5h automatically; the next run turns
green and syncs. See GUIDE.md §5.

## Notes
- GitHub cron is UTC and best-effort; scheduled workflows pause after 60 days of
  repo inactivity (any push re-arms).
- This is a deterministic cron job, deliberately NOT an LLM agent — cheaper and
  reliable for a mechanical CSV→DB sync.
