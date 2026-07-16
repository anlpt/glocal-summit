import type { Group, Lab, Participant, Selection, Response, SettingsMap } from '../types.ts';
import { supabase } from './supabase.ts';
import { type Store, normalizeEmail } from './store.ts';

// Supabase-backed store. Used when VITE_SUPABASE_URL/ANON_KEY are set.

const sb = () => {
  if (!supabase) throw new Error('Supabase client not configured');
  return supabase;
};

export const supabaseStore: Store = {
  async getGroups() {
    const { data, error } = await sb().from('groups').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []) as Group[];
  },
  async getLabs() {
    const { data, error } = await sb().from('labs').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []) as Lab[];
  },
  async getParticipants() {
    const { data, error } = await sb().from('participants').select('*').order('id');
    if (error) throw error;
    return (data ?? []) as Participant[];
  },
  async getSelections() {
    const { data, error } = await sb().from('selections').select('*');
    if (error) throw error;
    return (data ?? []) as Selection[];
  },
  async getResponses() {
    const { data, error } = await sb().from('responses').select('*');
    if (error) throw error;
    return (data ?? []) as Response[];
  },
  async getSettings() {
    const { data, error } = await sb().from('settings').select('*');
    if (error) throw error;
    const map: SettingsMap = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  },
  async findParticipantByEmail(email) {
    const target = normalizeEmail(email);
    const { data, error } = await sb().from('participants').select('*').ilike('email', target);
    if (error) throw error;
    const rows = (data ?? []) as Participant[];
    return rows.find((p) => normalizeEmail(p.email) === target) ?? rows[0] ?? null;
  },

  async setSelections(participantId, labIds) {
    const del = await sb().from('selections').delete().eq('participant_id', participantId);
    if (del.error) throw del.error;
    if (labIds.length === 0) return;
    const rows = labIds.map((lab_id) => ({ participant_id: participantId, lab_id }));
    const ins = await sb().from('selections').insert(rows);
    if (ins.error) throw ins.error;
  },
  async resetSelections(participantId) {
    let q = sb().from('selections').delete();
    q = participantId == null ? q.gte('id', 0) : q.eq('participant_id', participantId);
    const { error } = await q;
    if (error) throw error;
  },
  async setResponse(participantId, answer) {
    const trimmed = answer.trim();
    if (!trimmed) {
      const { error } = await sb().from('responses').delete().eq('participant_id', participantId);
      if (error) throw error;
      return;
    }
    const { error } = await sb()
      .from('responses')
      .upsert(
        { participant_id: participantId, answer: trimmed, updated_at: new Date().toISOString() },
        { onConflict: 'participant_id' },
      );
    if (error) throw error;
  },

  async setSetting(key, value) {
    const { error } = await sb().from('settings').upsert({ key, value });
    if (error) throw error;
  },
  async saveGroup(group) {
    const { id, ...rest } = group;
    const { error } = await sb().from('groups').upsert(id ? group : rest);
    if (error) throw error;
  },
  async deleteGroup(id) {
    const { error } = await sb().from('groups').delete().eq('id', id);
    if (error) throw error;
  },
  async saveLab(lab) {
    const { id, ...rest } = lab;
    const { error } = await sb().from('labs').upsert(id ? lab : rest);
    if (error) throw error;
  },
  async deleteLab(id) {
    const { error } = await sb().from('labs').delete().eq('id', id);
    if (error) throw error;
  },
  async saveParticipant(p) {
    const { id, ...rest } = p;
    const { error } = await sb().from('participants').upsert(id ? p : rest);
    if (error) throw error;
  },
  async deleteParticipant(id) {
    const { error } = await sb().from('participants').delete().eq('id', id);
    if (error) throw error;
  },

  subscribe(onChange) {
    const channel = sb()
      .channel('gs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'selections' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labs' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, onChange)
      .subscribe();
    return () => {
      void sb().removeChannel(channel);
    };
  },
};
