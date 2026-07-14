import { useMemo, useState } from 'react';
import type { Group, Lab, Participant } from '../../types.ts';
import { db } from '../../lib/db.ts';

interface UnitPickerProps {
  participant: Participant;
  groups: Group[];
  labs: Lab[];
  initialLabIds: number[];
  votingOpen: boolean;
  onSaved: (labIds: number[]) => void;
  onSwitchUser: () => void;
}

export default function UnitPicker({
  participant,
  groups,
  labs,
  initialLabIds,
  votingOpen,
  onSaved,
  onSwitchUser,
}: UnitPickerProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialLabIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const labsByGroup = useMemo(() => {
    const map = new Map<number, Lab[]>();
    for (const lab of labs) {
      const arr = map.get(lab.group_id) ?? [];
      arr.push(lab);
      map.set(lab.group_id, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [labs]);

  function toggle(labId: number) {
    if (!votingOpen) return;
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(labId)) next.delete(labId);
      else next.add(labId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const ids = [...selected];
      await db.setSelections(participant.id, ids);
      setSaved(true);
      onSaved(ids);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="picker">
      <div className="picker__bar">
        <div>
          <p className="picker__hello">
            Signed in as <strong>{participant.name}</strong>
          </p>
          <p className="picker__meta">
            {participant.email} · {selected.size} selected
          </p>
        </div>
        <button className="btn btn--ghost" onClick={onSwitchUser}>
          Not you?
        </button>
      </div>

      {!votingOpen && (
        <p className="picker__closed" role="status">
          Voting is currently closed. Your selections are locked.
        </p>
      )}

      <div className="picker__groups">
        {groups.map((group) => {
          const groupLabs = labsByGroup.get(group.id) ?? [];
          if (groupLabs.length === 0) return null;
          return (
            <section
              key={group.id}
              className="group-card"
              style={{ ['--group' as string]: group.color }}
            >
              <header className="group-card__head">
                <span className="group-card__dot" />
                <h2 className="group-card__title">{group.name}</h2>
              </header>
              <ul className="group-card__labs">
                {groupLabs.map((lab) => {
                  const on = selected.has(lab.id);
                  return (
                    <li key={lab.id}>
                      <button
                        type="button"
                        className={'lab-chip' + (on ? ' is-on' : '')}
                        aria-pressed={on}
                        disabled={!votingOpen}
                        onClick={() => toggle(lab.id)}
                      >
                        <span className="lab-chip__check" aria-hidden>
                          {on ? '✓' : '+'}
                        </span>
                        {lab.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="picker__actions">
        <button
          className="btn btn--primary btn--lg"
          onClick={save}
          disabled={saving || !votingOpen}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save my selections'}
        </button>
        {saved && <span className="picker__savednote">Your choices are recorded. You can edit until voting closes.</span>}
      </div>
    </div>
  );
}
