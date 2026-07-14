# Glocal Summit Selection Platform — Implementation Plan

> **For agentic workers:** Implement task-by-task. Each task ends with a testable deliverable and a commit. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship a private, Vercel-deployed React app where 37 summit participants log in by email, pick research units (labs), an admin manages content and exports Excel, and a live view shows real-time popularity.

**Architecture:** React 19 + Vite + TS SPA, three routes (`/`, `/live`, `/admin`). Supabase (Postgres + Realtime) is the backend; the client reads/writes directly. Seed + logos generated from the participants CSV at build time.

**Tech Stack:** React 19, Vite 8, TypeScript, react-router-dom 7, @supabase/supabase-js, xlsx (SheetJS), d3 (hierarchy/force/scale), oxlint, Playwright.

## Global Constraints

- Group header text (the 7 Topic strings) rendered **verbatim** — never mutated.
- Labs (20) are the selectable units, grouped under their group header.
- Participant identity = email, matched case-insensitively/trimmed against the 37.
- Admin gate = client-side `admin` / `123`.
- RTD tokens: red `#cc2027`, ink `#262626`; fonts Anton / Instrument Sans / IBM Plex Mono.
- Editing locked when `settings.voting_open = false`.
- Repo **private**; deploy **Vercel**; emails may live in seed but never in a public repo.
- Supabase keys in `.env.local` (git-ignored); `.env.example` documents them.

---

## File map

```
index.html
package.json  vite.config.ts  tsconfig*.json  vercel.json  .env.example
scripts/
  build-seed.mjs         # CSV -> src/data/seed.ts + supabase/seed.sql
  fetch-logos.mjs        # orgs -> public/logos/*, logo map
src/
  main.tsx  App.tsx
  types.ts
  lib/supabase.ts  lib/db.ts  lib/excel.ts  lib/labs.ts
  data/seed.ts           # generated
  hooks/useSettings.ts  hooks/useSelections.ts  hooks/useRealtime.ts
  styles/tokens.css  styles/global.css
  components/shell/Header.tsx  components/ui/Logo.tsx  components/ui/Button.tsx
  pages/participant/Participant.tsx  LoginForm.tsx  UnitPicker.tsx  participant.css
  pages/live/Live.tsx  Bubbles.tsx  BarRace.tsx  Treemap.tsx  Leaderboard.tsx  live.css
  pages/admin/Admin.tsx  AdminLogin.tsx  panels/*.tsx  admin.css
supabase/schema.sql  supabase/seed.sql   # generated
docs/GUIDE.md  docs/memory/PROGRESS.md
```

---

## Phase 0 — Scaffold (deliverable: `npm run dev` serves a styled shell)

### Task 0.1: Vite project + tokens + router shell
**Files:** create `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css` (port from agenda), `src/styles/global.css`, `src/components/shell/Header.tsx`.
- [ ] Scaffold Vite React-TS; add deps: react-router-dom, @supabase/supabase-js; devDeps: oxlint, playwright, @types/node.
- [ ] Port `tokens.css` from `rtd2026-agenda`; add group color palette (7 colors keyed to groups).
- [ ] Router with 3 routes rendering placeholder pages + shared `Header`.
- [ ] Verify: `npm run build` passes; `npm run dev` shows header + placeholders at `/`, `/live`, `/admin`.
- [ ] Commit `chore: scaffold vite react app with rtd tokens and routes`.

---

## Phase 1 — Data pipeline (deliverable: typed seed + schema + logos)

### Task 1.1: Seed generator
**Files:** create `scripts/build-seed.mjs`, `src/types.ts`, `src/lib/labs.ts`, generates `src/data/seed.ts` + `supabase/seed.sql`.
- [ ] `types.ts`: `Group`, `Lab`, `Participant`, `Selection`, `Settings`.
- [ ] `labs.ts`: `splitLabs(topic: string): string[]` splitting on `-`/`;`, trimming, deduping. Unit-test it.
- [ ] `build-seed.mjs`: read `scripts/participants.csv`, emit 7 groups (verbatim names + assigned colors), 20 labs, 37 participants (blank-topic → group "Keynote"), to `seed.ts` and `seed.sql`.
- [ ] Verify: run script; `seed.ts` has 7 groups / 20 labs / 37 participants; `splitLabs` test passes.
- [ ] Commit `feat: generate typed seed and sql from participants csv`.

### Task 1.2: Supabase schema
**Files:** create `supabase/schema.sql`.
- [ ] Tables per spec §5 with PK/FK, `selections` unique `(participant_id, lab_id)`, `settings` seeded with `voting_open=true` + copy.
- [ ] RLS: read-all on all tables; insert/delete on `selections`; permissive writes for CMS (documented tradeoff). Enable Realtime on `selections`.
- [ ] Verify: SQL parses (psql `--dry` or manual review); FK names consistent with `db.ts`.
- [ ] Commit `feat: supabase schema with rls and realtime`.

### Task 1.3: Logo fetch script
**Files:** create `scripts/fetch-logos.mjs`, output `public/logos/*`, `src/data/logos.ts` (org→path map), override map for messy names.
- [ ] Dedupe 34 orgs; resolve each to a domain (override map + heuristic); download logo (Clearbit/logo→favicon fallback) into `public/logos/`.
- [ ] Write `logos.ts` mapping normalized org → local path; missing → null (CMS fills later).
- [ ] Verify: script runs; ≥60% orgs get a file; map compiles.
- [ ] Commit `feat: fetch org logos at build time`.

---

## Phase 2 — Supabase client layer (deliverable: app reads live data)

### Task 2.1: Client + data access
**Files:** create `src/lib/supabase.ts`, `src/lib/db.ts`, `.env.example`, `.env.local` (git-ignored).
- [ ] `supabase.ts`: create client from `import.meta.env.VITE_SUPABASE_URL/ANON_KEY`; export `hasSupabase` guard so app runs with seed fallback when unset.
- [ ] `db.ts`: `getGroups()`, `getLabs()`, `getParticipants()`, `findParticipantByEmail(email)`, `getSelections()`, `setSelections(participantId, labIds[])`, `getSettings()`, `setSetting(k,v)`, admin CRUD. Falls back to `seed.ts` when `!hasSupabase`.
- [ ] Verify: `getGroups()` returns 7 from seed offline; typed.
- [ ] Commit `feat: supabase client and data-access layer with seed fallback`.

### Task 2.2: Realtime + settings hooks
**Files:** create `src/hooks/useSettings.ts`, `src/hooks/useSelections.ts`, `src/hooks/useRealtime.ts`.
- [ ] `useRealtime`: subscribe to `selections` changes, invalidate on insert/delete (no-op offline).
- [ ] `useSelections`: current selections + live counts per lab/group. `useSettings`: `voting_open` + copy.
- [ ] Verify: hooks compile; live page count updates on manual insert.
- [ ] Commit `feat: realtime and settings hooks`.

---

## Phase 3 — Participant flow (deliverable: login + select + submit works)

### Task 3.1: Login form
**Files:** create `pages/participant/LoginForm.tsx`, `participant.css`.
- [ ] Name + country + email inputs; validate email against participants; error UI for no-match; store id in localStorage.
- [ ] Verify (Playwright): known email → advances; unknown → error.
- [ ] Commit `feat: participant email login`.

### Task 3.2: Unit picker + submit
**Files:** create `pages/participant/UnitPicker.tsx`, `Participant.tsx`.
- [ ] 7 colored group cards, expandable, lab checkboxes (multi, cross-group); pre-check existing selections; submit → `setSelections`; disabled + banner when `voting_open=false`.
- [ ] Verify (Playwright): select 3 labs across 2 groups, submit, reload → still checked.
- [ ] Commit `feat: research unit multi-select and submit`.

---

## Phase 4 — Live view (deliverable: 4 real-time visual styles)

### Task 4.1: Live shell + style switch + Leaderboard + BarRace
**Files:** `pages/live/Live.tsx`, `Leaderboard.tsx`, `BarRace.tsx`, `live.css`.
- [ ] Style toggle (Bubbles/Bars/Treemap/Leaderboard); counts from `useSelections`; group colors; click unit → participant list (name+email+logo).
- [ ] Verify: bars/leaderboard render & reorder on data change.
- [ ] Commit `feat: live view shell with leaderboard and bar race`.

### Task 4.2: Bubbles + Treemap (d3, dynamic import)
**Files:** `pages/live/Bubbles.tsx`, `Treemap.tsx`.
- [ ] d3 pack/force bubbles (area ∝ count) + treemap nested by group; dynamic `import('d3-...')`.
- [ ] Verify (Playwright screenshot): bubbles sized by count at 1440.
- [ ] Commit `feat: bubble and treemap live visualizations`.

---

## Phase 5 — Admin CMS + Excel (deliverable: full management + export)

### Task 5.1: Admin gate + shell
**Files:** `pages/admin/Admin.tsx`, `AdminLogin.tsx`, `admin.css`.
- [ ] `admin`/`123` gate (sessionStorage); tabbed shell: Voting, Groups, Labs, Participants, Logos, Content, Selections.
- [ ] Verify: wrong creds blocked; right creds → dashboard.
- [ ] Commit `feat: admin login and dashboard shell`.

### Task 5.2: CMS panels
**Files:** `pages/admin/panels/*.tsx`.
- [ ] Voting toggle; Groups (name/color/order); Labs CRUD; Participants edit; Logos upload/replace; Content (hero/instructions); Selections view + reset.
- [ ] Verify: toggle voting closes participant editing; edit a group color reflects on `/live`.
- [ ] Commit `feat: cms panels for all content`.

### Task 5.3: Excel export
**Files:** `src/lib/excel.ts`; wire buttons in panels + live.
- [ ] SheetJS dynamic import; `exportWorkbook()` → sheets Participants/Selections/LabCounts/GroupCounts; per-table export buttons.
- [ ] Verify: click export → `.xlsx` downloads with correct rows.
- [ ] Commit `feat: excel export via sheetjs`.

---

## Phase 6 — Docs, deploy, ship (deliverable: private repo + live Vercel URL)

### Task 6.1: Guide + memory
**Files:** `docs/GUIDE.md`, `docs/memory/PROGRESS.md`, per-task memory files.
- [ ] Illustrated Supabase setup (create project, run schema, copy URL+anon key), Vercel deploy, participant/admin usage, export, close voting.
- [ ] Commit `docs: usage guide and memory log`.

### Task 6.2: Deploy config + push + Vercel
**Files:** `vercel.json`, `README.md`.
- [ ] SPA rewrite; README quickstart. Push to new **private** GitHub repo. Wire Vercel (guide the user through the one-time link).
- [ ] Verify: build green; live URL loads; realtime works across two tabs.
- [ ] Commit `chore: deploy config and readme`.

---

## Self-review

- **Spec coverage:** §2 data→T1.1; §3 stack→T0.1; §5 model→T1.2/2.1; §6 participant→P3; §7 live→P4; §8 CMS→P5; §9 logos→T1.3; §10 excel→T5.3; §11 memory→T6.1; §12 guide→T6.1; §13 deploy→T6.2. All covered.
- **Placeholders:** none — each task names exact files + verification.
- **Type consistency:** `db.ts` names (`setSelections`, `findParticipantByEmail`, `getSettings`) referenced consistently by hooks/pages.
