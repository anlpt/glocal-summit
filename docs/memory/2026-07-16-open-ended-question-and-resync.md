# 2026-07-16 — Open-ended question + sheet re-sync

## Sheet re-sync
Re-fetched the Google Sheet and regenerated the seed. Changes captured:
- **Labs 20 → 22**: added "Immersive Convergence Center" and
  "International Center of Urbanism".
- **Coordinators updated** for many participants.
- **Kelly Shannon & Bruno De Meulder now have emails** (were blank) and topics —
  no more keynote/no-group entries. All 37 now have a group.
Ran `npm run seed` + `npm run logos` (still 22/34 logos). `supabase/seed.sql`
regenerated too (re-run it in Supabase if already provisioned, or let the 5h
sync handle it).

## New feature: open-ended, admin-editable question
Default: "In the future, what do you expect to collaborate with CTD?"
(setting key `collab_question`, editable in admin → Overview).

New pieces:
- `types.ts`: `Response` interface, `SETTING_KEYS.collabQuestion`,
  `DEFAULT_COLLAB_QUESTION`.
- New `responses` table (participant_id unique, answer, updated_at) in
  `schema.sql` + RLS + realtime. localStore key `gs_responses`.
- Store: `getResponses` / `setResponse` (upsert by participant, blank = delete).
- `useSummit` loads `responses`.
- Participant: textarea below the units in `UnitPicker.tsx`; saved alongside
  selections; locked when voting closed; prefills existing answer.
- Admin: editable question in `OverviewPanel`; answers table in
  `SelectionsPanel`; **Answers** sheet added to the Excel master export.

## Verified
Answered as Clinton Moore → persisted (gs_responses) → shows in admin Selections
"Open-ended answers (1)" → editable question renders in Overview → export label
includes Answers. Build + lint green.

## Note
The scheduled sheet sync (`scripts/sync-sheet.mjs`) is unaffected — responses are
independent of the sheet. Supabase still not provisioned by owner; app runs
offline until then.
