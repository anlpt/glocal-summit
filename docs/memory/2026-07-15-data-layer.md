# 2026-07-15 — Phase 2: Data Layer

## Done
- `src/lib/supabase.ts`: creates client from `VITE_SUPABASE_URL/ANON_KEY`;
  `hasSupabase` guard.
- `src/lib/store.ts`: `Store` interface (reads, selection writes, CMS CRUD,
  `subscribe`).
- `src/lib/localStore.ts`: localStorage impl, seeds from `seed.ts`, notifies via
  an EventTarget + `storage` events (offline realtime).
- `src/lib/supabaseStore.ts`: Supabase impl + `postgres_changes` subscriptions.
- `src/lib/db.ts`: picks store by `hasSupabase`; re-exports `logoForOrg`.
- `src/lib/counts.ts`: `labCounts`, `groupCounts`, `participantsById`.
- `src/hooks/useSummit.ts`: loads all data + live-refresh on any change;
  `isVotingOpen`.

## Key decision
The app is fully functional **offline** (seed + localStorage) so it demos before
Supabase is configured, and switches to Supabase transparently once keys exist.
