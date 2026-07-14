import { hasSupabase } from './supabase.ts';
import { localStore } from './localStore.ts';
import { supabaseStore } from './supabaseStore.ts';
import type { Store } from './store.ts';

/** The active data layer: Supabase when configured, else offline localStore. */
export const db: Store = hasSupabase ? supabaseStore : localStore;

export { hasSupabase };
export { logoForOrg } from '../data/logos.ts';
