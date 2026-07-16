# 2026-07-16 — Guest self-registration

## Feature
People not on the invited 37 can register and participate.

- Login form: an unrecognized email (when registration is allowed) switches to a
  register panel (name, email, **organization**, country, optional title) →
  `db.saveParticipant({ ..., self_registered: true, group_id: null })` → look up
  by email to get the new id → log in → pick units + answer the question.
  If the email already exists, it just logs in (no duplicate).
- Admin **Overview**: "Guest registration" on/off toggle (setting
  `allow_registration`, default `true`).
- Admin **Participants**: guests show a blue **"Guest"** tag + a guest count.
- Excel exports gain a **Type** column (Invited/Guest).

## Data model
- `Participant.self_registered?: boolean` (types.ts).
- `participants.self_registered boolean not null default false` (schema.sql).
- `settings.allow_registration = 'true'` default (schema + localStore defaults).

## Sync safety
`scripts/sync-sheet.mjs` now excludes `self_registered` participants from orphan
handling — guests are never flagged or deleted even with `ALLOW_DELETE=true`
(they're legitimately absent from the sheet).

## Verified
Registered "Dr. Jane Newcomer" (non-invited email) → landed in the unit picker
signed in → admin Participants showed "1 of 38 · 1 guest" with a GUEST tag.
Build + lint green.
