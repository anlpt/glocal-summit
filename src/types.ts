export interface Group {
  id: number;
  name: string; // Topic string, verbatim — never mutated
  color: string;
  sort_order: number;
}

export interface Lab {
  id: number;
  group_id: number;
  name: string;
  sort_order: number;
}

export interface Participant {
  id: number;
  stt: string;
  title: string;
  name: string;
  country: string;
  org: string;
  org_logo_url: string | null;
  role: string;
  email: string;
  coordinator: string;
  group_id: number | null;
}

export interface Selection {
  id?: number;
  participant_id: number;
  lab_id: number;
  created_at?: string;
}

export type SettingsMap = Record<string, string>;

export const SETTING_KEYS = {
  votingOpen: 'voting_open',
  heroTitle: 'hero_title',
  heroSubtitle: 'hero_subtitle',
  instructions: 'instructions',
  liveDefaultStyle: 'live_default_style',
} as const;
