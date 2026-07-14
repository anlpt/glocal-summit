import type { Group, Lab, Participant, Selection } from '../types.ts';

export interface LabCount {
  lab: Lab;
  group: Group | undefined;
  count: number;
  participantIds: number[];
}

export interface GroupCount {
  group: Group;
  count: number;
}

/** Count selections per lab, richest first. */
export function labCounts(labs: Lab[], groups: Group[], selections: Selection[]): LabCount[] {
  const byLab = new Map<number, number[]>();
  for (const s of selections) {
    const arr = byLab.get(s.lab_id) ?? [];
    arr.push(s.participant_id);
    byLab.set(s.lab_id, arr);
  }
  const groupById = new Map(groups.map((g) => [g.id, g]));
  return labs
    .map((lab) => {
      const participantIds = byLab.get(lab.id) ?? [];
      return { lab, group: groupById.get(lab.group_id), count: participantIds.length, participantIds };
    })
    .sort((a, b) => b.count - a.count || a.lab.name.localeCompare(b.lab.name));
}

/** Count selections per group (sum of its labs). */
export function groupCounts(labs: Lab[], groups: Group[], selections: Selection[]): GroupCount[] {
  const labToGroup = new Map(labs.map((l) => [l.id, l.group_id]));
  const tally = new Map<number, number>();
  for (const s of selections) {
    const gid = labToGroup.get(s.lab_id);
    if (gid == null) continue;
    tally.set(gid, (tally.get(gid) ?? 0) + 1);
  }
  return groups
    .map((group) => ({ group, count: tally.get(group.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

export function participantsById(participants: Participant[]): Map<number, Participant> {
  return new Map(participants.map((p) => [p.id, p]));
}
