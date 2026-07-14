import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when Supabase env vars are present; otherwise the app runs on
 *  local seed data + localStorage (great for local dev and demos). */
export const hasSupabase = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, anonKey!, { realtime: { params: { eventsPerSecond: 5 } } })
  : null;
