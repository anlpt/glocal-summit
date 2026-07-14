# Glocal Summit — Research Unit Selection Platform

Interactive platform for the RTD Glocal Summit 2026. Invited participants sign in
by email and choose the research units (labs) they want to join; a live big-screen
view shows real-time popularity; an admin manages content and exports to Excel.

> **New here? Read [docs/GUIDE.md](docs/GUIDE.md)** — full setup, Supabase, deploy,
> and day-of instructions with illustrated steps.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 (runs offline on seed data)
```

- `/` — participant sign-in + unit selection
- `/live` — real-time popularity (Bubbles / Bar race / Treemap / Leaderboard)
- `/admin` — CMS + Excel export (login `admin` / `123`)

## Go live

Real-time across devices needs Supabase. In short:

1. Create a free Supabase project.
2. Run `supabase/schema.sql` then `supabase/seed.sql` in its SQL editor.
3. Copy the Project URL + anon key into `.env.local` (see `.env.example`).
4. Deploy to Vercel (private-repo friendly) with the same env vars.

Full walkthrough: **[docs/GUIDE.md](docs/GUIDE.md)**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | oxlint |
| `npm run seed` | Regenerate `src/data/seed.ts` + `supabase/seed.sql` from `scripts/participants.csv` |
| `npm run logos` | Re-fetch org logos into `public/logos/` |

## Tech

React 19 · Vite · TypeScript · Supabase (Postgres + Realtime) · exceljs · d3.

## Project layout

```
src/
  pages/participant  · sign-in + unit picker
  pages/live         · 4 real-time visualizations + detail drawer
  pages/admin        · CMS panels + Excel export
  lib/               · data layer (supabase | offline), counts, excel, labs
  hooks/useSummit    · loads all data + realtime refresh
  data/              · generated seed + logo map
scripts/             · seed + logo generators
supabase/            · schema.sql + seed.sql
docs/                · GUIDE.md, specs, plans, memory/
```

## Notes

- **Group text is verbatim** from the source sheet and never mutated; the 20
  selectable units are derived from it.
- The app runs fully **offline** on seed data and switches to Supabase
  automatically when env vars are present.
- Admin auth is a client-side gate — fine for an internal event; see GUIDE §7.
