import type { Group, Lab, Participant, Selection, Response, SettingsMap } from '../types.ts';

/** Storage-agnostic data layer. Implemented by localStore and supabaseStore. */
export interface Store {
  getGroups(): Promise<Group[]>;
  getLabs(): Promise<Lab[]>;
  getParticipants(): Promise<Participant[]>;
  getSelections(): Promise<Selection[]>;
  getResponses(): Promise<Response[]>;
  getSettings(): Promise<SettingsMap>;
  findParticipantByEmail(email: string): Promise<Participant | null>;

  setSelections(participantId: number, labIds: number[]): Promise<void>;
  resetSelections(participantId?: number): Promise<void>;
  setResponse(participantId: number, answer: string): Promise<void>;

  setSetting(key: string, value: string): Promise<void>;
  saveGroup(group: Group): Promise<void>;
  deleteGroup(id: number): Promise<void>;
  saveLab(lab: Lab): Promise<void>;
  deleteLab(id: number): Promise<void>;
  saveParticipant(p: Participant): Promise<void>;
  deleteParticipant(id: number): Promise<void>;

  /** Subscribe to any data change (realtime). Returns an unsubscribe fn. */
  subscribe(onChange: () => void): () => void;
}

export const normalizeEmail = (email: string): string =>
  email.replace(/\s+/g, '').trim().toLowerCase();
