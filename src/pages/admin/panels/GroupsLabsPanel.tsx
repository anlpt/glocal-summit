import type { SummitData } from '../../../hooks/useSummit.ts';
import type { Group, Lab } from '../../../types.ts';
import { db } from '../../../lib/db.ts';
import { exportTable } from '../../../lib/excel.ts';

export default function GroupsLabsPanel({ summit }: { summit: SummitData }) {
  const { groups, labs, reload } = summit;

  async function saveGroup(g: Group, patch: Partial<Group>) {
    await db.saveGroup({ ...g, ...patch });
    reload();
  }
  async function addGroup() {
    await db.saveGroup({ id: 0, name: 'New group', color: '#888888', sort_order: groups.length + 1 });
    reload();
  }
  async function delGroup(id: number) {
    if (!confirm('Delete this group and all its units?')) return;
    await db.deleteGroup(id);
    reload();
  }
  async function saveLab(l: Lab, patch: Partial<Lab>) {
    await db.saveLab({ ...l, ...patch });
    reload();
  }
  async function addLab(groupId: number, count: number) {
    await db.saveLab({ id: 0, group_id: groupId, name: 'New unit', sort_order: count + 1 });
    reload();
  }
  async function delLab(id: number) {
    await db.deleteLab(id);
    reload();
  }

  function exportUnits() {
    const rows = labs.map((l) => ({
      unit: l.name,
      group: groups.find((g) => g.id === l.group_id)?.name ?? '',
    }));
    exportTable('research-units.xlsx', 'Units', [
      { header: 'Research Unit', key: 'unit', width: 34 },
      { header: 'Group', key: 'group', width: 44 },
    ], rows);
  }

  return (
    <div className="panel">
      <div className="panel__actions">
        <button className="btn" onClick={addGroup}>+ Add group</button>
        <button className="btn" onClick={exportUnits}>Export units to Excel</button>
      </div>

      {groups.map((g) => {
        const groupLabs = labs.filter((l) => l.group_id === g.id).sort((a, b) => a.sort_order - b.sort_order);
        return (
          <section key={g.id} className="card" style={{ borderTop: `3px solid ${g.color}` }}>
            <div className="grouprow">
              <input
                type="color"
                className="grouprow__color"
                value={g.color}
                onChange={(e) => saveGroup(g, { color: e.target.value })}
                title="Group color"
              />
              <input
                className="field__input grouprow__name"
                defaultValue={g.name}
                onBlur={(e) => e.target.value !== g.name && saveGroup(g, { name: e.target.value })}
              />
              <button className="btn btn--danger" onClick={() => delGroup(g.id)}>Delete</button>
            </div>
            <ul className="unitlist">
              {groupLabs.map((l) => (
                <li key={l.id} className="unitlist__row">
                  <input
                    className="field__input"
                    defaultValue={l.name}
                    onBlur={(e) => e.target.value !== l.name && saveLab(l, { name: e.target.value })}
                  />
                  <button className="btn btn--ghost" onClick={() => delLab(l.id)}>Remove</button>
                </li>
              ))}
            </ul>
            <button className="btn btn--ghost" onClick={() => addLab(g.id, groupLabs.length)}>
              + Add unit
            </button>
          </section>
        );
      })}
    </div>
  );
}
