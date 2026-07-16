import { useState } from 'react';
import type { SummitData } from '../../../hooks/useSummit.ts';
import type { Participant } from '../../../types.ts';
import { db } from '../../../lib/db.ts';
import { exportTable } from '../../../lib/excel.ts';
import Logo from '../../../components/ui/Logo.tsx';

const EMPTY: Participant = {
  id: 0, stt: '', title: '', name: '', country: '', org: '', org_logo_url: null,
  role: '', email: '', coordinator: '', group_id: null,
};

export default function ParticipantsPanel({ summit }: { summit: SummitData }) {
  const { participants, groups, reload } = summit;
  const [editing, setEditing] = useState<Participant | null>(null);
  const [query, setQuery] = useState('');

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.email.toLowerCase().includes(query.toLowerCase()) ||
      p.org.toLowerCase().includes(query.toLowerCase()),
  );

  async function save(p: Participant) {
    await db.saveParticipant(p);
    setEditing(null);
    reload();
  }
  async function remove(id: number) {
    if (!confirm('Delete this participant?')) return;
    await db.deleteParticipant(id);
    reload();
  }
  function exportParticipants() {
    exportTable(
      'participants.xlsx',
      'Participants',
      [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Title', key: 'title', width: 8 },
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Country', key: 'country', width: 14 },
        { header: 'Organization', key: 'org', width: 34 },
        { header: 'Role', key: 'role', width: 30 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Coordinator', key: 'coordinator', width: 24 },
        { header: 'Type', key: 'type', width: 10 },
      ],
      participants.map((p) => ({ ...p, type: p.self_registered ? 'Guest' : 'Invited' })),
    );
  }

  return (
    <div className="panel">
      <div className="panel__actions">
        <input
          className="field__input"
          placeholder="Search name, email, org…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: '20rem' }}
        />
        <button className="btn" onClick={() => setEditing({ ...EMPTY })}>+ Add participant</button>
        <button className="btn" onClick={exportParticipants}>Export to Excel</button>
      </div>

      <p className="card__hint">
        {filtered.length} of {participants.length} participants
        {participants.some((p) => p.self_registered) &&
          ` · ${participants.filter((p) => p.self_registered).length} guest${
            participants.filter((p) => p.self_registered).length === 1 ? '' : 's'
          }`}
      </p>

      <ul className="plist">
        {filtered.map((p) => (
          <li key={p.id} className="plist__row">
            <Logo org={p.org} src={p.org_logo_url} size={36} />
            <div className="plist__info">
              <span className="plist__name">
                {p.title} {p.name}
                {p.self_registered && <span className="tag tag--guest">Guest</span>}
              </span>
              <span className="plist__meta">{p.email} · {p.country}</span>
            </div>
            <button className="btn btn--ghost" onClick={() => setEditing(p)}>Edit</button>
          </li>
        ))}
      </ul>

      {editing && (
        <ParticipantEditor
          participant={editing}
          groups={groups}
          onCancel={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => remove(editing.id) : undefined}
        />
      )}
    </div>
  );
}

function ParticipantEditor({
  participant, groups, onCancel, onSave, onDelete,
}: {
  participant: Participant;
  groups: SummitData['groups'];
  onCancel: () => void;
  onSave: (p: Participant) => void;
  onDelete?: () => void;
}) {
  const [p, setP] = useState<Participant>(participant);
  const upd = (patch: Partial<Participant>) => setP((prev) => ({ ...prev, ...patch }));

  function onLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => upd({ org_logo_url: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="detail" onClick={onCancel}>
      <div className="detail__panel" onClick={(e) => e.stopPropagation()}>
        <header className="detail__head" style={{ ['--group' as string]: 'var(--red)' }}>
          <h2 className="detail__title">{p.id ? 'Edit participant' : 'New participant'}</h2>
          <button className="btn btn--ghost" onClick={onCancel}>Close</button>
        </header>

        <div className="editor__logo">
          <Logo org={p.org} src={p.org_logo_url} size={56} />
          <label className="btn btn--ghost">
            Upload logo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && onLogoFile(e.target.files[0])}
            />
          </label>
          {p.org_logo_url && (
            <button className="btn btn--ghost" onClick={() => upd({ org_logo_url: null })}>
              Clear logo
            </button>
          )}
        </div>

        <Row label="Name" v={p.name} on={(v) => upd({ name: v })} />
        <Row label="Title" v={p.title} on={(v) => upd({ title: v })} />
        <Row label="Email" v={p.email} on={(v) => upd({ email: v })} />
        <Row label="Country" v={p.country} on={(v) => upd({ country: v })} />
        <Row label="Organization" v={p.org} on={(v) => upd({ org: v })} />
        <Row label="Role" v={p.role} on={(v) => upd({ role: v })} />
        <Row label="Coordinator" v={p.coordinator} on={(v) => upd({ coordinator: v })} />
        <label className="field">
          <span className="field__label">Group (topic)</span>
          <select
            className="field__input"
            value={p.group_id ?? ''}
            onChange={(e) => upd({ group_id: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">— Keynote / none —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </label>

        <div className="editor__actions">
          <button className="btn btn--primary" onClick={() => onSave(p)}>Save</button>
          {onDelete && <button className="btn btn--danger" onClick={onDelete}>Delete</button>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input className="field__input" value={v} onChange={(e) => on(e.target.value)} />
    </label>
  );
}
