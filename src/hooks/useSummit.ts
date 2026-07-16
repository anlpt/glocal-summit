import { useCallback, useEffect, useState } from 'react';
import type { Group, Lab, Participant, Selection, Response, SettingsMap } from '../types.ts';
import { db } from '../lib/db.ts';

export interface SummitData {
  groups: Group[];
  labs: Lab[];
  participants: Participant[];
  selections: Selection[];
  responses: Response[];
  settings: SettingsMap;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads all summit data and live-refreshes on any store change (realtime). */
export function useSummit(): SummitData {
  const [state, setState] = useState<Omit<SummitData, 'reload'>>({
    groups: [],
    labs: [],
    participants: [],
    selections: [],
    responses: [],
    settings: {},
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      const [groups, labs, participants, selections, responses, settings] = await Promise.all([
        db.getGroups(),
        db.getLabs(),
        db.getParticipants(),
        db.getSelections(),
        db.getResponses(),
        db.getSettings(),
      ]);
      setState({ groups, labs, participants, selections, responses, settings, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    void load();
    const unsub = db.subscribe(() => void load());
    return unsub;
  }, [load]);

  return { ...state, reload: load };
}

export const isVotingOpen = (settings: SettingsMap): boolean => settings.voting_open !== 'false';
