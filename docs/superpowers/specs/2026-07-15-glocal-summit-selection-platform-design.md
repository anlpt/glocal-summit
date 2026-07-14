# Glocal Summit — Research Unit Selection Platform

**Date:** 2026-07-15
**Status:** Approved design — ready for implementation planning
**Owner:** lptan (anlpt@ueh.edu.vn)

## 1. Purpose

An interactive event website for the RTD Glocal Summit where the 37 invited
participants log in, browse the summit's research units (labs), and select the
ones they want to join. A live big-screen view shows, in real time, which
research units are most popular. An admin runs the whole thing through a CMS and
can export everything to Excel.

## 2. Source data

Pulled from the participants Google Sheet (public CSV/XLSX export):

- **37 participants.** Columns: STT, Danh xưng (title), Họ tên (name), Quốc gia
  (country), Đơn vị Logo (organization), Chức vụ (role), Email, Coordinator,
  Topic.
- **7 distinct Topic strings** — these are the **groups** (shown verbatim, text
  never altered). Each is displayed as a colored group.
- **20 selectable labs** — parsed from the Topic strings by splitting on `-`
  and `;`. These are the individual **research units** participants select.
- **2 participants with a blank Topic** (Kelly Shannon, Bruno De Meulder) →
  placed in a "Keynote / Unassigned" bucket, not a selectable unit.
- **34 distinct organizations** needing logos (deduped from messy variants).

### The 7 groups → 20 labs

1. **Governance & Policy Planning Lab - New Economy Lab** → Governance & Policy
   Planning Lab · New Economy Lab
2. **Creative Media Innovation Lab - Entertainment & Heritage Innovation Lab -
   AI Art & Branding Lab - Digital Media and Sustainable Wellbeing Lab; AI &
   Sustainability Lab** → Creative Media Innovation Lab · Entertainment &
   Heritage Innovation Lab · AI Art & Branding Lab · Digital Media and
   Sustainable Wellbeing Lab · AI & Sustainability Lab
3. **Living Lab - NetZero Open Lab** → Living Lab · NetZero Open Lab
4. **Public Space Lab - Data Drive & Urban Design Lab** → Public Space Lab ·
   Data Drive & Urban Design Lab
5. **Robotic & AI Lab - Open Lab - 3I Research Center** → Robotic & AI Lab ·
   Open Lab · 3I Research Center
6. **Smart City Research - Move System Lab - Immersive Technology Convergence
   Center** → Smart City Research · Move System Lab · Immersive Technology
   Convergence Center
7. **TIR Lab - BIT Lab - AI & Human Experience Lab** → TIR Lab · BIT Lab · AI &
   Human Experience Lab

> The group header text is displayed verbatim. The lab split is for selection
> only and is stored as data, never mutating the original Topic string.

## 3. Tech stack

Matches the sibling `rtd2026-agenda` project for consistency:

- **React 19 + Vite + TypeScript**, `react-router-dom`.
- Plain CSS with RTD design tokens (red `#cc2027`, ink `#262626`, Anton +
  Instrument Sans + IBM Plex Mono). Per-component CSS files, feature-organized.
- **Supabase** (Postgres + Realtime + storage) for data and live sync.
- `oxlint` for linting, Playwright for E2E/visual checks.
- **SheetJS (`xlsx`)** for in-browser Excel export (dynamic import).
- **d3** (hierarchy/force/scale) for live visualizations (dynamic import).

## 4. Routes

| Route | Audience | Purpose |
|-------|----------|---------|
| `/` | Participants | Login + select research units |
| `/live` | Big screen / everyone | Real-time popularity visualization |
| `/admin` | Organizer | CMS + export (login `admin` / `123`) |

## 5. Data model (Supabase)

- **groups** `(id, name, color, sort_order)` — 7 rows, name = Topic verbatim.
- **labs** `(id, group_id, name, sort_order)` — 20 rows, the selectable units.
- **participants** `(id, stt, title, name, country, org, org_logo_url, role,
  email UNIQUE, coordinator, group_id)` — 37 rows.
- **selections** `(id, participant_id, lab_id, created_at)` — the real-time
  table; a participant can have many. Unique on `(participant_id, lab_id)`.
- **settings** `(key, value)` — `voting_open` (bool), hero title/subtitle,
  instructions, live-view default style. Drives the CMS-editable content.

RLS: event-grade. `groups`/`labs`/`participants`/`settings` are world-readable;
`selections` readable by all (for the live view) and writable for the voting
flow. Admin-only writes are gated in the client. **Known tradeoff:** the anon
key is public and admin auth is a client-side check — acceptable for a
low-sensitivity internal event tool; documented as a follow-up if stronger auth
is ever needed (Supabase Auth + server-side RLS / an edge function).

## 6. Participant flow (`/`)

1. Enter **name + country + email**.
2. Email is matched (case-insensitive, trimmed) against the 37 participants.
   - No match → friendly "you're not on the invited list" message.
   - Match → participant id stored in `localStorage`; proceed.
3. See the **7 colored groups**, each expandable to its labs. Tick **one or
   more labs across any groups**. Submit writes rows to `selections`.
4. Re-login with the same email to **edit selections until admin closes
   voting** (`voting_open = false` locks all editing; admin can reopen).

The name/country the participant types is captured with their submission; email
is the identity key.

## 7. Live view (`/live`)

- Subscribes to `selections` via Supabase Realtime; recomputes per-lab and
  per-group counts on every change.
- **Four switchable visual styles**, all color-coded by group:
  1. **Packed bubbles** — circle area ∝ count; bigger = more popular; animates
     as votes arrive.
  2. **Animated bar race** — horizontal bars ranked by count.
  3. **Treemap** — rectangle area ∝ count, nested by group.
  4. **Leaderboard** — ranked list with counts.
- Clicking any unit reveals the participants who chose it: **name + email +
  university logo** (per organizer's choice for full transparency).
- d3 modules dynamically imported to keep initial load light.

## 8. Admin / CMS (`/admin`)

Login `admin` / `123` (client-side gate). Capabilities:

- Toggle **voting open/closed**.
- Edit group names, colors, order.
- Add / edit / remove labs.
- Edit participant records (name, email, country, org, role, group).
- **Upload / replace organization logos** (Supabase storage or `public/logos`).
- Edit page copy (hero title/subtitle, instructions) via `settings`.
- View all selections; **reset** all or per-participant.
- **Export to Excel** button on every table (participants, selections, live
  counts) — SheetJS `.xlsx`, generated in-browser.

## 9. Logos

A build-time Node script maps each of the 34 orgs → a best-guess logo sourced
from the web, downloads into `public/logos/`, and records the path on the
participant/org. No external logo calls at runtime (privacy + performance +
CSP-friendly). Obscure orgs may miss; the organizer fixes them via the CMS
upload. A manual override map handles known-messy names (e.g. KICT variants).

## 10. Excel export

Client-side via SheetJS. Each admin table view exports its current data. A
"master export" produces a workbook with sheets: Participants, Selections,
Lab Counts, Group Counts.

## 11. Memory folder

`docs/memory/` in the repo:

- `PROGRESS.md` — running index of completed tasks.
- `YYYY-MM-DD-<task>.md` — one file per finished task, capturing what was done,
  key decisions, and where the next session should pick up.

## 12. Guideline

`docs/GUIDE.md` — illustrated, step-by-step:

- Creating the free Supabase project, running the schema, and pasting the URL +
  anon key (with annotated diagrams/screenshots and exactly where to click).
- Deploying to Vercel from the private repo.
- Participant usage, admin/CMS usage, exporting to Excel, closing voting.

## 13. Deployment

- **Private** GitHub repo (participant emails are in seed data).
- Deployed live via **Vercel free tier** (supports private repos). One-time
  GitHub↔Vercel link, covered in the guide. A `vercel.json` + SPA rewrite is
  included. Vite `base` set appropriately.
- Seed data (with emails) kept in the repo but repo stays private; a
  `.env.local` holds Supabase keys (git-ignored); `.env.example` documents them.

## 14. Out of scope (YAGNI)

- Real per-user passwords / SSO (email match is the identity check).
- Server-side admin auth (client gate is sufficient for this event).
- Multi-event / multi-year support — single summit instance.
- Bilingual UI — English only (data stays as-is).

## 15. Build order (high level)

1. Scaffold Vite + React + TS + router + tokens (port from agenda project).
2. Supabase schema + seed generator from the CSV (groups, labs, participants).
3. Logo fetch script.
4. Participant login + selection UI.
5. Live view with the four visual styles + realtime.
6. Admin CMS + Excel export.
7. Guide, memory folder, Vercel config.
8. Push private repo, wire Vercel, verify live.
