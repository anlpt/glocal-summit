import { db, hasSupabase } from './db.ts';
import type { Participant, Selection, Response } from '../types.ts';

const MIGRATED_FLAG = 'gs_migrated_v1';
const CURRENT_KEY = 'gs_current_participant';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * One-time recovery: when the app first runs in Supabase mode, push any data
 * this browser saved while offline (self-registered guests, unit selections,
 * open-ended answers) up to the central database — without overwriting data
 * already on the server. Runs once per browser; retries on next load if it
 * fails partway. No-op when Supabase isn't configured.
 */
export async function migrateLocalData(): Promise<void> {
  if (!hasSupabase) return;
  if (localStorage.getItem(MIGRATED_FLAG) === 'done') return;

  const localSelections = readLocal<Selection[]>('gs_selections', []);
  const localResponses = readLocal<Response[]>('gs_responses', []);
  const localParticipants = readLocal<Participant[]>('gs_participants', []);

  if (localSelections.length === 0 && localResponses.length === 0) {
    localStorage.setItem(MIGRATED_FLAG, 'done');
    return;
  }

  try {
    const [serverParticipants, serverLabs, serverSelections, serverResponses] = await Promise.all([
      db.getParticipants(),
      db.getLabs(),
      db.getSelections(),
      db.getResponses(),
    ]);

    const serverByEmail = new Map(
      serverParticipants.map((p) => [p.email.toLowerCase(), p]),
    );
    const validLabIds = new Set(serverLabs.map((l) => l.id));
    const haveSelections = new Set(serverSelections.map((s) => s.participant_id));
    const haveResponses = new Set(serverResponses.map((r) => r.participant_id));

    // Map local participant id -> server participant id (creating guests as needed).
    const idMap = new Map<number, number>();
    for (const lp of localParticipants) {
      const email = (lp.email || '').toLowerCase();
      if (!email) continue;
      const existing = serverByEmail.get(email);
      if (existing) {
        idMap.set(lp.id, existing.id);
      } else if (lp.self_registered) {
        await db.saveParticipant({ ...lp, id: 0 });
        const created = await db.findParticipantByEmail(email);
        if (created) {
          idMap.set(lp.id, created.id);
          serverByEmail.set(email, created);
        }
      }
    }

    // Selections, grouped per participant; skip anyone who already has server data.
    const labsByParticipant = new Map<number, number[]>();
    for (const s of localSelections) {
      const serverId = idMap.get(s.participant_id);
      if (serverId == null || !validLabIds.has(s.lab_id)) continue;
      const arr = labsByParticipant.get(serverId) ?? [];
      arr.push(s.lab_id);
      labsByParticipant.set(serverId, arr);
    }
    for (const [serverId, labIds] of labsByParticipant) {
      if (haveSelections.has(serverId)) continue;
      await db.setSelections(serverId, [...new Set(labIds)]);
    }

    // Open-ended answers.
    for (const r of localResponses) {
      const serverId = idMap.get(r.participant_id);
      if (serverId == null || haveResponses.has(serverId) || !r.answer?.trim()) continue;
      await db.setResponse(serverId, r.answer);
    }

    // Re-point this browser's session to the server id (guests get a new id).
    const current = readLocal<{ id: number } | null>(CURRENT_KEY, null);
    if (current && idMap.has(current.id)) {
      localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: idMap.get(current.id) }));
    }

    localStorage.setItem(MIGRATED_FLAG, 'done');
  } catch {
    // Leave the flag unset so it retries on the next load.
  }
}
