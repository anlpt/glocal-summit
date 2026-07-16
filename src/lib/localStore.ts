import type { Group, Lab, Participant, Selection, Response, SettingsMap } from '../types.ts';
import { seedGroups, seedLabs, seedParticipants } from '../data/seed.ts';
import { DEFAULT_COLLAB_QUESTION } from '../types.ts';
import { type Store, normalizeEmail } from './store.ts';

// localStorage-backed store: seeds from generated data, persists mutations,
// and notifies subscribers within and across tabs. Powers offline dev/demos.

const KEY = {
  groups: 'gs_groups',
  labs: 'gs_labs',
  participants: 'gs_participants',
  selections: 'gs_selections',
  responses: 'gs_responses',
  settings: 'gs_settings',
} as const;

const DEFAULT_SETTINGS: SettingsMap = {
  voting_open: 'true',
  hero_title: 'Choose your research units',
  hero_subtitle: 'RTD Glocal Summit 2026',
  instructions:
    'Sign in with your invited email, then pick every research unit you want to join. You can pick more than one, and edit until voting closes.',
  live_default_style: 'bubbles',
  collab_question: DEFAULT_COLLAB_QUESTION,
  allow_registration: 'true',
};

const CHANGE_EVENT = 'gs-store-change';
const bus = new EventTarget();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  bus.dispatchEvent(new Event(CHANGE_EVENT));
}

function ensureSeeded(): void {
  if (!localStorage.getItem(KEY.groups)) localStorage.setItem(KEY.groups, JSON.stringify(seedGroups));
  if (!localStorage.getItem(KEY.labs)) localStorage.setItem(KEY.labs, JSON.stringify(seedLabs));
  if (!localStorage.getItem(KEY.participants))
    localStorage.setItem(KEY.participants, JSON.stringify(seedParticipants));
  if (!localStorage.getItem(KEY.selections)) localStorage.setItem(KEY.selections, JSON.stringify([]));
  if (!localStorage.getItem(KEY.responses)) localStorage.setItem(KEY.responses, JSON.stringify([]));
  if (!localStorage.getItem(KEY.settings))
    localStorage.setItem(KEY.settings, JSON.stringify(DEFAULT_SETTINGS));
}

let nextId = Date.now();
const genId = () => nextId++;

export const localStore: Store = {
  async getGroups() {
    ensureSeeded();
    return read<Group[]>(KEY.groups, seedGroups).sort((a, b) => a.sort_order - b.sort_order);
  },
  async getLabs() {
    ensureSeeded();
    return read<Lab[]>(KEY.labs, seedLabs);
  },
  async getParticipants() {
    ensureSeeded();
    return read<Participant[]>(KEY.participants, seedParticipants);
  },
  async getSelections() {
    ensureSeeded();
    return read<Selection[]>(KEY.selections, []);
  },
  async getResponses() {
    ensureSeeded();
    return read<Response[]>(KEY.responses, []);
  },
  async getSettings() {
    ensureSeeded();
    return { ...DEFAULT_SETTINGS, ...read<SettingsMap>(KEY.settings, {}) };
  },
  async findParticipantByEmail(email) {
    const target = normalizeEmail(email);
    const all = await this.getParticipants();
    return all.find((p) => normalizeEmail(p.email) === target) ?? null;
  },

  async setSelections(participantId, labIds) {
    const all = read<Selection[]>(KEY.selections, []);
    const others = all.filter((s) => s.participant_id !== participantId);
    const rows: Selection[] = labIds.map((lab_id) => ({
      id: genId(),
      participant_id: participantId,
      lab_id,
      created_at: new Date().toISOString(),
    }));
    write(KEY.selections, [...others, ...rows]);
  },
  async resetSelections(participantId) {
    if (participantId == null) {
      write(KEY.selections, []);
      return;
    }
    const all = read<Selection[]>(KEY.selections, []);
    write(KEY.selections, all.filter((s) => s.participant_id !== participantId));
  },
  async setResponse(participantId, answer) {
    const all = read<Response[]>(KEY.responses, []);
    const others = all.filter((r) => r.participant_id !== participantId);
    const trimmed = answer.trim();
    if (!trimmed) {
      write(KEY.responses, others);
      return;
    }
    write(KEY.responses, [
      ...others,
      { id: genId(), participant_id: participantId, answer: trimmed, updated_at: new Date().toISOString() },
    ]);
  },

  async setSetting(key, value) {
    const s = read<SettingsMap>(KEY.settings, {});
    write(KEY.settings, { ...s, [key]: value });
  },
  async saveGroup(group) {
    const all = read<Group[]>(KEY.groups, seedGroups);
    const id = group.id || genId();
    const next = all.some((g) => g.id === id)
      ? all.map((g) => (g.id === id ? { ...group, id } : g))
      : [...all, { ...group, id }];
    write(KEY.groups, next);
  },
  async deleteGroup(id) {
    write(KEY.groups, read<Group[]>(KEY.groups, seedGroups).filter((g) => g.id !== id));
  },
  async saveLab(lab) {
    const all = read<Lab[]>(KEY.labs, seedLabs);
    const id = lab.id || genId();
    const next = all.some((l) => l.id === id)
      ? all.map((l) => (l.id === id ? { ...lab, id } : l))
      : [...all, { ...lab, id }];
    write(KEY.labs, next);
  },
  async deleteLab(id) {
    write(KEY.labs, read<Lab[]>(KEY.labs, seedLabs).filter((l) => l.id !== id));
  },
  async saveParticipant(p) {
    const all = read<Participant[]>(KEY.participants, seedParticipants);
    const id = p.id || genId();
    const next = all.some((x) => x.id === id)
      ? all.map((x) => (x.id === id ? { ...p, id } : x))
      : [...all, { ...p, id }];
    write(KEY.participants, next);
  },
  async deleteParticipant(id) {
    write(
      KEY.participants,
      read<Participant[]>(KEY.participants, seedParticipants).filter((x) => x.id !== id),
    );
  },

  subscribe(onChange) {
    const local = () => onChange();
    const cross = (e: StorageEvent) => {
      if (e.key && Object.values(KEY).includes(e.key as (typeof KEY)[keyof typeof KEY])) onChange();
    };
    bus.addEventListener(CHANGE_EVENT, local);
    window.addEventListener('storage', cross);
    return () => {
      bus.removeEventListener(CHANGE_EVENT, local);
      window.removeEventListener('storage', cross);
    };
  },
};
