import { useState } from 'react';
import type { SummitData } from '../../../hooks/useSummit.ts';
import { isVotingOpen } from '../../../hooks/useSummit.ts';
import { db } from '../../../lib/db.ts';
import { exportMaster } from '../../../lib/excel.ts';
import { SETTING_KEYS } from '../../../types.ts';

export default function OverviewPanel({ summit }: { summit: SummitData }) {
  const { settings, groups, labs, participants, selections, responses, reload } = summit;
  const votingOpen = isVotingOpen(settings);
  const [saving, setSaving] = useState(false);

  async function set(key: string, value: string) {
    await db.setSetting(key, value);
    reload();
  }

  async function saveText(key: string, value: string) {
    setSaving(true);
    try {
      await set(key, value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <section className="card">
        <h2 className="card__title">Voting</h2>
        <p className="card__hint">
          When closed, participants can no longer change their selections.
        </p>
        <div className="voting-toggle">
          <span className={'voting-state' + (votingOpen ? ' is-open' : '')}>
            {votingOpen ? '● Open' : '● Closed'}
          </span>
          <button
            className={votingOpen ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={() => set(SETTING_KEYS.votingOpen, votingOpen ? 'false' : 'true')}
          >
            {votingOpen ? 'Close voting' : 'Open voting'}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Page content</h2>
        <TextField
          key={`title-${settings.hero_title ?? ''}`}
          label="Hero title"
          initial={settings.hero_title ?? ''}
          onSave={(v) => saveText(SETTING_KEYS.heroTitle, v)}
        />
        <TextField
          key={`sub-${settings.hero_subtitle ?? ''}`}
          label="Hero subtitle"
          initial={settings.hero_subtitle ?? ''}
          onSave={(v) => saveText(SETTING_KEYS.heroSubtitle, v)}
        />
        <TextField
          key={`instr-${settings.instructions ?? ''}`}
          label="Instructions"
          initial={settings.instructions ?? ''}
          multiline
          onSave={(v) => saveText(SETTING_KEYS.instructions, v)}
        />
        <label className="field">
          <span className="field__label">Live view default style</span>
          <select
            className="field__input"
            value={settings.live_default_style ?? 'bubbles'}
            onChange={(e) => set(SETTING_KEYS.liveDefaultStyle, e.target.value)}
          >
            <option value="bubbles">Bubbles</option>
            <option value="bars">Bar race</option>
            <option value="treemap">Treemap</option>
            <option value="board">Leaderboard</option>
          </select>
        </label>
        {saving && <p className="card__hint">Saving…</p>}
      </section>

      <section className="card">
        <h2 className="card__title">Open-ended question</h2>
        <p className="card__hint">
          Shown to every participant below the units. Edit the wording anytime.
        </p>
        <TextField
          key={`collab-${settings.collab_question ?? ''}`}
          label="Question"
          initial={settings.collab_question ?? ''}
          multiline
          onSave={(v) => saveText(SETTING_KEYS.collabQuestion, v)}
        />
      </section>

      <section className="card">
        <h2 className="card__title">Export</h2>
        <p className="card__hint">
          Download an Excel workbook: Participants, Selections, Lab Counts, Group Counts, Answers.
        </p>
        <button
          className="btn btn--primary"
          onClick={() =>
            exportMaster(
              groups,
              labs,
              participants,
              selections,
              responses,
              settings.collab_question || 'Open-ended question',
            )
          }
        >
          Export everything to Excel
        </button>
      </section>
    </div>
  );
}

function TextField({
  label,
  initial,
  multiline,
  onSave,
}: {
  label: string;
  initial: string;
  multiline?: boolean;
  onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="field__row">
        {multiline ? (
          <textarea
            className="field__input"
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <input className="field__input" value={value} onChange={(e) => setValue(e.target.value)} />
        )}
        <button className="btn" disabled={!dirty} onClick={() => onSave(value)}>
          Save
        </button>
      </div>
    </label>
  );
}
