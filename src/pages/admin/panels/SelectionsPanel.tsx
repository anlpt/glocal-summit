import { useMemo } from 'react';
import type { SummitData } from '../../../hooks/useSummit.ts';
import { db } from '../../../lib/db.ts';
import { labCounts, participantsById } from '../../../lib/counts.ts';
import { exportMaster, exportTable } from '../../../lib/excel.ts';

export default function SelectionsPanel({ summit }: { summit: SummitData }) {
  const { groups, labs, participants, selections, reload } = summit;
  const counts = useMemo(() => labCounts(labs, groups, selections), [labs, groups, selections]);
  const pById = useMemo(() => participantsById(participants), [participants]);

  async function resetAll() {
    if (!confirm('Delete ALL selections? This cannot be undone.')) return;
    await db.resetSelections();
    reload();
  }

  function exportCounts() {
    exportTable(
      'lab-counts.xlsx',
      'Lab Counts',
      [
        { header: 'Research Unit', key: 'unit', width: 34 },
        { header: 'Group', key: 'group', width: 44 },
        { header: 'Selections', key: 'count', width: 12 },
      ],
      counts.map((c) => ({ unit: c.lab.name, group: c.group?.name ?? '', count: c.count })),
    );
  }

  return (
    <div className="panel">
      <div className="panel__actions">
        <button className="btn" onClick={exportCounts}>Export counts</button>
        <button
          className="btn"
          onClick={() => exportMaster(groups, labs, participants, selections)}
        >
          Export full workbook
        </button>
        <button className="btn btn--danger" onClick={resetAll}>Reset all selections</button>
      </div>

      <section className="card">
        <h2 className="card__title">Per unit ({selections.length} total selections)</h2>
        <table className="datatable">
          <thead>
            <tr><th>Research unit</th><th>Group</th><th>Count</th><th>People</th></tr>
          </thead>
          <tbody>
            {counts.map((c) => (
              <tr key={c.lab.id}>
                <td>{c.lab.name}</td>
                <td>
                  <span className="dot" style={{ background: c.group?.color }} />
                  {c.group?.name.split(/\s*-\s*/)[0]}
                </td>
                <td className="datatable__num">{c.count}</td>
                <td className="datatable__people">
                  {c.participantIds.map((id) => pById.get(id)?.name).filter(Boolean).join(', ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
