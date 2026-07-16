import type { Group, Lab, Participant, Selection, Response } from '../types.ts';
import { labCounts, groupCounts, participantsById } from './counts.ts';

interface Column {
  header: string;
  key: string;
  width?: number;
}

async function buildAndDownload(
  filename: string,
  sheets: { name: string; columns: Column[]; rows: Record<string, unknown>[] }[],
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Glocal Summit';
  wb.created = new Date();
  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));
    ws.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 22 }));
    ws.getRow(1).font = { bold: true };
    ws.addRows(sheet.rows);
  }
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** One generic table export (used by every admin panel). */
export function exportTable(
  filename: string,
  sheetName: string,
  columns: Column[],
  rows: Record<string, unknown>[],
): Promise<void> {
  return buildAndDownload(filename, [{ name: sheetName, columns, rows }]);
}

/** Master workbook: Participants, Selections, Lab Counts, Group Counts, Answers. */
export function exportMaster(
  groups: Group[],
  labs: Lab[],
  participants: Participant[],
  selections: Selection[],
  responses: Response[] = [],
  collabQuestion = 'Open-ended question',
): Promise<void> {
  const pById = participantsById(participants);
  const labById = new Map(labs.map((l) => [l.id, l]));
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const participantRows = participants.map((p) => ({
    stt: p.stt,
    title: p.title,
    name: p.name,
    country: p.country,
    org: p.org,
    role: p.role,
    email: p.email,
    coordinator: p.coordinator,
    topic: p.group_id ? (groupById.get(p.group_id)?.name ?? '') : '',
  }));

  const selectionRows = selections.map((s) => {
    const p = pById.get(s.participant_id);
    const lab = labById.get(s.lab_id);
    const group = lab ? groupById.get(lab.group_id) : undefined;
    return {
      name: p?.name ?? '',
      email: p?.email ?? '',
      country: p?.country ?? '',
      org: p?.org ?? '',
      lab: lab?.name ?? '',
      group: group?.name ?? '',
    };
  });

  const labRows = labCounts(labs, groups, selections).map((c) => ({
    lab: c.lab.name,
    group: c.group?.name ?? '',
    count: c.count,
  }));

  const groupRows = groupCounts(labs, groups, selections).map((c) => ({
    group: c.group.name,
    count: c.count,
  }));

  const answerRows = responses
    .filter((r) => r.answer.trim())
    .map((r) => {
      const p = pById.get(r.participant_id);
      return { name: p?.name ?? '', email: p?.email ?? '', org: p?.org ?? '', answer: r.answer };
    });

  return buildAndDownload('glocal-summit-export.xlsx', [
    {
      name: 'Participants',
      columns: [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Title', key: 'title', width: 8 },
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Country', key: 'country', width: 14 },
        { header: 'Organization', key: 'org', width: 34 },
        { header: 'Role', key: 'role', width: 30 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Coordinator', key: 'coordinator', width: 24 },
        { header: 'Topic', key: 'topic', width: 40 },
      ],
      rows: participantRows,
    },
    {
      name: 'Selections',
      columns: [
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Country', key: 'country', width: 14 },
        { header: 'Organization', key: 'org', width: 34 },
        { header: 'Research Unit', key: 'lab', width: 34 },
        { header: 'Group', key: 'group', width: 40 },
      ],
      rows: selectionRows,
    },
    {
      name: 'Lab Counts',
      columns: [
        { header: 'Research Unit', key: 'lab', width: 34 },
        { header: 'Group', key: 'group', width: 40 },
        { header: 'Selections', key: 'count', width: 12 },
      ],
      rows: labRows,
    },
    {
      name: 'Group Counts',
      columns: [
        { header: 'Group', key: 'group', width: 44 },
        { header: 'Selections', key: 'count', width: 12 },
      ],
      rows: groupRows,
    },
    {
      name: 'Answers',
      columns: [
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Organization', key: 'org', width: 34 },
        { header: collabQuestion.slice(0, 60) || 'Answer', key: 'answer', width: 70 },
      ],
      rows: answerRows,
    },
  ]);
}
