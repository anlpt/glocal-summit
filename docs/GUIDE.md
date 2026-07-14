# Glocal Summit Platform — Complete Guide

A step-by-step manual for running the RTD Glocal Summit research-unit selection
platform: setup, going live, day-of operation, and troubleshooting.

- **Participant site** — `/` — invited people pick their research units.
- **Live view** — `/live` — real-time popularity for the big screen.
- **Admin** — `/admin` — manage everything, export to Excel (login `admin` / `123`).

---

## 0. Two ways to run

| Mode | When | Data lives in |
|------|------|---------------|
| **Offline** (default) | Local testing, quick demo | The browser (localStorage) |
| **Live** (Supabase) | The real event, multiple devices, real-time | Supabase cloud |

The app auto-detects: if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist
it uses Supabase; otherwise it runs offline. **Real-time across devices needs
Supabase.**

---

## 1. Run it locally (5 minutes)

```bash
npm install
npm run dev
```

Open http://localhost:5173. You'll see the participant page. It already has all
37 people and 20 units loaded from the seed. Try:

- `/` → sign in with a real invited email (e.g. `clinton.moore@undp.org`), pick units.
- `/live` → watch the bubbles.
- `/admin` → `admin` / `123`.

> Offline mode stores data only in *your* browser. Two laptops won't see each
> other. For the real event, set up Supabase (next section).

---

## 2. Set up Supabase (go live) — step by step

You do this once. It's free.

### Step 2.1 — Create the project

1. Go to **https://supabase.com** and click **Start your project** → sign in
   with GitHub or email.
2. Click **New project**.

```
   ┌─ Supabase dashboard ───────────────────────────┐
   │  Organization: [ your org ▾ ]                   │
   │  Name:         glocal-summit                    │
   │  Database password: ●●●●●●●●  (save it safely)  │
   │  Region:       Southeast Asia (Singapore)       │
   │                                   [ Create ]    │
   └─────────────────────────────────────────────────┘
```

3. Wait ~2 minutes for it to provision.

### Step 2.2 — Create the tables

1. In the left sidebar click **SQL Editor** (the `</>` icon).
2. Click **+ New query**.
3. Open `supabase/schema.sql` from this project, copy **all** of it, paste into
   the editor, and click **Run** (or ⌘/Ctrl + Enter).
   - You should see *"Success. No rows returned."*

```
   Left sidebar          SQL Editor
   ┌───────────┐        ┌───────────────────────────────┐
   │ 📊 Table  │        │  1  create table groups (...)  │
   │ 🔑 Auth   │        │  2  ...                         │
   │ </> SQL ◀ │        │                                 │
   │ ⚙  Settings│       │                    [ Run ▶ ]    │
   └───────────┘        └───────────────────────────────┘
```

4. Click **+ New query** again, open `supabase/seed.sql`, paste, **Run**. This
   loads the 7 groups, 20 units, and 37 participants.

### Step 2.3 — Copy your keys

1. Left sidebar → **Project Settings** (gear) → **API**.
2. Copy two values:

```
   ┌─ Settings ▸ API ───────────────────────────────────┐
   │  Project URL                                        │
   │    https://abcdxyz.supabase.co        [copy]        │
   │                                                     │
   │  Project API keys                                   │
   │    anon  public   eyJhbGciOi...       [copy]        │
   └─────────────────────────────────────────────────────┘
```

3. In this project, copy `.env.example` to `.env.local` and paste them in:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://abcdxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-public-key...
```

> The **anon public** key is safe to ship in a browser app. Never paste the
> **service_role** key here.

### Step 2.4 — Confirm

```bash
npm run dev
```

Open `/admin`. The badge top-right should now say **"Supabase · live"** instead
of "Offline · local data". Open `/live` on two different devices, vote on one,
and watch the other update in real time. 🎉

---

## 3. Deploy live with Vercel (private repo friendly)

GitHub Pages can't serve a **private** repo for free, and the participant list
contains emails — so we use Vercel, which deploys private repos on its free tier.

### Step 3.1 — Import the repo

1. Go to **https://vercel.com** → **Sign up / Log in with GitHub**.
2. Click **Add New… → Project**.
3. Find your **glocal-summit** repository and click **Import**.
   - If you don't see it: **Adjust GitHub App Permissions** → grant access to the repo.

### Step 3.2 — Configure

Vercel auto-detects Vite. Confirm:

```
   Framework Preset:  Vite
   Build Command:     npm run build
   Output Directory:  dist
```

### Step 3.3 — Add the environment variables

Before deploying, open **Environment Variables** and add the same two values
from Step 2.3:

```
   Name                        Value
   VITE_SUPABASE_URL           https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY      eyJhbGciOi...
```

### Step 3.4 — Deploy

Click **Deploy**. In ~1 minute you get a live URL like
`https://glocal-summit.vercel.app`. Share it with participants.

> Every future `git push` to the main branch redeploys automatically.

---

## 3b. Deploy with GitHub Pages (free, public repo)

The repo also auto-deploys to GitHub Pages via `.github/workflows/deploy.yml`
on every push to `main`.

- **Live URL:** `https://anlpt.github.io/glocal-summit/`
- **Enable once:** repo **Settings → Pages → Build and deployment → Source =
  GitHub Actions** (already set up if the first deploy ran).

### Turning on real-time on the Pages site
GitHub Pages is static hosting, so cross-device real-time needs the Supabase
backend. Add two repo secrets and the next deploy picks them up:

1. Repo **Settings → Secrets and variables → Actions → New repository secret**.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (values from Step 2.3).
   The anon public key is safe to expose.
3. Re-run the workflow: **Actions → Deploy to GitHub Pages → Run workflow**
   (or push any commit).

Without those secrets the site still works, but each browser only sees its own
data — no live sync between devices.

---

## 4. Using the platform

### For participants (`/`)
1. Enter name, country, and the email your invitation was sent to.
2. If the email is on the list, the research units appear grouped by topic.
3. Tick **every** unit you want (more than one is fine, across any group).
4. Click **Save my selections**. Come back anytime with the same email to edit —
   until the admin closes voting.

### For the big screen (`/live`)
- Switch between **Bubbles / Bar race / Treemap / Leaderboard** — bigger = more
  popular.
- Click any unit to reveal who chose it (name, email, university logo).
- It updates in real time as people vote (Supabase mode).

### For the admin (`/admin`, login `admin` / `123`)
- **Overview:** open/close voting, edit the hero text & instructions, set the
  live view's default style, and **Export everything to Excel**.
- **Groups & Units:** rename groups, change their colors, add/remove units.
- **Participants:** search, add, edit, delete; **upload a logo** for anyone whose
  auto-fetched logo is missing or wrong.
- **Selections:** see who chose what, reset selections, export counts.

### Exporting to Excel
Every relevant screen has an export button. The master export (Overview or
Selections tab) produces one `.xlsx` with four sheets: **Participants,
Selections, Lab Counts, Group Counts**.

---

## 5. Updating the participant list from the sheet

If the Google Sheet changes:

```bash
# 1. Re-download the CSV into scripts/participants.csv (see below), then:
npm run seed      # regenerates src/data/seed.ts + supabase/seed.sql
npm run logos     # re-fetches org logos
```

Re-download the sheet as CSV:

```bash
curl -sL "https://docs.google.com/spreadsheets/d/17e90sIy0RtwrzCdn0lCnWsLQWP8ObmBARwLPFqDhcHc/gviz/tq?tqx=out:csv&gid=1069324629" -o scripts/participants.csv
```

In **Supabase mode**, after regenerating, re-run the new `supabase/seed.sql` in
the SQL editor (or just edit people directly in the admin Participants tab).

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Admin badge says "Offline" but you set up Supabase | `.env.local` missing or misspelled; restart `npm run dev`. On Vercel, check the env vars and redeploy. |
| "You're not on the invited list" for a valid person | Their email differs from the sheet. Add/fix it in **admin → Participants**. |
| Live view not updating across devices | You're in offline mode. Supabase is required for cross-device real-time. |
| A logo is missing or wrong | **admin → Participants → Edit → Upload logo.** |
| Realtime not firing in Supabase | Ensure `alter publication supabase_realtime add table selections;` ran (it's in `schema.sql`). |

---

## 7. Security note

The admin login (`admin` / `123`) is a **client-side gate** suitable for a
low-stakes internal event. Anyone with the app URL can reach `/admin` and try to
log in, and the Supabase anon key allows writes (needed for voting). For a
higher-security deployment, move to Supabase Auth with server-side row-level
security. This is documented in the design spec (§5) as a known trade-off.
