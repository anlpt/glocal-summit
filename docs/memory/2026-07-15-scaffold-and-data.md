# 2026-07-15 — Phase 0–1: Scaffold + Data Pipeline

## Done
- Vite + React 19 + TS scaffold; routes `/`, `/live`, `/admin`; RTD tokens ported
  from rtd2026-agenda (`src/styles/tokens.css` + 7 group colors).
- `scripts/build-seed.mjs`: parses `scripts/participants.csv` (RFC-4180 parser,
  handles embedded newlines) → `src/data/seed.ts` + `supabase/seed.sql`.
  Output: 7 groups, 20 labs, 37 participants (Kelly Shannon & Bruno De Meulder
  = keynotes with `group_id = null`).
- `src/lib/labs.ts` `splitLabs()` splits Topic on `-`/`;`.
- `supabase/schema.sql`: tables + RLS + realtime on `selections`.
- `scripts/fetch-logos.mjs`: 22/34 orgs matched (Clearbit → DuckDuckGo →
  Google favicon fallbacks) → `public/logos/*` + `src/data/logos.ts`.

## Notes / gotchas
- Swapped `xlsx` (SheetJS npm advisory) for `exceljs`.
- Missing logos (12 orgs, e.g. Tsinghua, KICT, Kwangwoon) block icon services —
  add via CMS upload or extend the DOMAINS map in `fetch-logos.mjs`.
- Re-run after sheet changes: `npm run seed && npm run logos`.
