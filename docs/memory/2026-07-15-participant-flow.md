# 2026-07-15 — Phase 3: Participant Flow

## Done
- `LoginForm.tsx`: name + country + email; matches email against the 37
  (case-insensitive); friendly error on no match.
- `UnitPicker.tsx`: 7 color-coded group cards (verbatim headers) with lab chips;
  multi-select across groups; pre-checks existing picks; save → `db.setSelections`;
  disabled + banner when voting closed.
- `Participant.tsx`: session in `localStorage` (`gs_current_participant`),
  restores on reload, "Not you?" resets.
- `components/ui/Logo.tsx`: image or monogram-badge fallback.
- `styles/buttons.css` shared button system.

## Verified
Logged in as Clinton Moore, selected 2 units across groups, saved, persisted on
reload. Screenshots in session.
