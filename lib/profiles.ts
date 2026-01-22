import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getAppConfig } from './config';

export type ProfessionOption =
  | 'Business Owner'
  | 'Entrepreneur'
  | 'Investor'
  | 'Real Estate Professional'
  | 'Attorney'
  | 'Finance / Banking'
  | 'Technology'
  | 'Healthcare'
  | 'Consulting'
  | 'Marketing / Media'
  | 'Other';

export type YearsExperienceOption = '0–2' | '3–5' | '6–10' | '11–15' | '16+';

export type ReasonForJoiningOption =
  | 'Learning'
  | 'Networking'
  | 'Sharing expertise'
  | 'Deal flow'
  | 'Discussion only';

export type Profile = {
  user_id: string;
  // Public identity (professional only)
  first_name?: string;
  last_name?: string;
  display_name?: string;
  // Back-compat with earlier UI (author line)
  username: string;

  profession?: ProfessionOption | string;
  industry?: string | null;
  primary_role?: string | null;
  years_experience?: number | null;
  join_intent?: string[];

  screenshot_notice_accepted_at?: string | null;

  role: 'member' | 'verified' | 'host';
  onboarding_completed: boolean;
  standards_version: number;
  standards_accepted_at: string | null;
  invite_quota: number;
  created_at?: string;
  // Local-only governance fields (never shown to users)
  trust_score?: number;
  shadow_level?: 'soft' | 'medium' | 'hard' | null;
  shadow_until?: string | null;
  deleted_at?: string | null;
};

const MOCK_PROFILE_LEGACY_KEY = 'mock_profile_v1';
const MOCK_PROFILES_KEY = 'mock_profiles_v1';

type ProfileMap = Record<string, Profile>;

async function readProfileMap(): Promise<ProfileMap> {
  const raw = await AsyncStorage.getItem(MOCK_PROFILES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProfileMap;
  } catch {
    return {};
  }
}

async function writeProfileMap(map: ProfileMap) {
  await AsyncStorage.setItem(MOCK_PROFILES_KEY, JSON.stringify(map));
}

async function getMockProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(MOCK_PROFILE_LEGACY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setMockProfile(profile: Profile | null) {
  if (!profile) await AsyncStorage.removeItem(MOCK_PROFILE_LEGACY_KEY);
  else await AsyncStorage.setItem(MOCK_PROFILE_LEGACY_KEY, JSON.stringify(profile));
}

async function upsertMockProfile(profile: Profile) {
  const map = await readProfileMap();
  map[profile.user_id] = profile;
  await writeProfileMap(map);
  // Keep legacy key in sync for earlier screens.
  await setMockProfile(profile);
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const map = await readProfileMap();
    return map[userId] ?? null;
  }

  // Supabase mode can be implemented later.
  return null;
}

export async function listProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) {
    const map = await readProfileMap();
    return Object.values(map);
  }

  // Supabase mode can be implemented later.
  return [];
}

export async function getMyProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const userId = session?.user?.id;
    if (!userId) return null;

    const map = await readProfileMap();
    const p = map[userId];
    if (p) {
      // Keep legacy key aligned.
      await setMockProfile(p);
      return p;
    }

    // Migrate legacy profile if present.
    const legacy = await getMockProfile();
    if (legacy && legacy.user_id === userId) {
      await upsertMockProfile(legacy);
      return legacy;
    }

    return null;
  }

  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function ensureMyProfile(params: { userId: string; inviteCode?: string }) {
  if (!isSupabaseConfigured) {
    const existing = await getProfileById(params.userId);
    if (existing) return existing;

    // Initialize local governance state deterministically from invite code.
    const { initGovernanceState, getGovernanceState } = await import('./governanceStore');
    await initGovernanceState({ userId: params.userId, inviteCode: params.inviteCode });
    const g = await getGovernanceState(params.userId);

    const { getSession } = await import('./session');
    const s = await getSession();
    const role = s?.role === 'admin' ? 'host' : 'member';

    const createdAt = new Date().toISOString();
    const blank: Profile = {
      user_id: params.userId,
      first_name: '',
      last_name: '',
      display_name: '',
      username: 'Member',
      profession: undefined,
      industry: null,
      primary_role: null,
      years_experience: null,
      join_intent: [],

      screenshot_notice_accepted_at: null,
      role,
      onboarding_completed: false,
      standards_version: 0,
      standards_accepted_at: null,
      invite_quota: 2,
      created_at: createdAt,
      trust_score: g.trustScore,
      shadow_level: g.shadowLevel,
      shadow_until: g.shadowUntil,
      deleted_at: g.deletedAt,
    };

    await upsertMockProfile(blank);
    return blank;
  }

  // Supabase mode can be implemented later.
  return null;
}

function onboardingTrustScore(p: Profile, role: 'user' | 'admin' | null): number {
  if (role === 'admin') return 100;
  let score = 0;
  // Profile completed (identity provided)
  if ((p.display_name ?? '').trim() && (p.first_name ?? '').trim() && (p.last_name ?? '').trim()) score += 10;
  // Profession provided
  if ((p.profession ?? '').toString().trim()) score += 10;
  // Experience provided
  if (typeof p.years_experience === 'number') score += 5;
  return Math.max(0, Math.min(100, Math.trunc(score)));
}

export async function updateMyProfile(patch: Partial<Profile>) {
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const userId = session?.user?.id;
    if (!userId) return;

    const current = await getMyProfile();
    if (!current) return;

    const next: Profile = {
      ...current,
      ...patch,
    };

    // Keep username aligned to display name for author labels.
    const dn = (next.display_name ?? '').trim();
    if (dn) next.username = dn;

    await upsertMockProfile(next);
    return;
  }

  // Supabase mode can be implemented later.
}

// Back-compat: previous flow created profile from a single username.
export async function createMyProfile(userId: string, username: string, inviteCode?: string) {
  if (!isSupabaseConfigured) {
    const p = (await ensureMyProfile({ userId, inviteCode })) as Profile | null;
    if (!p) return;
    await updateMyProfile({ display_name: username, username });
    return;
  }

  const { error } = await supabase.from('profiles').insert({
    user_id: userId,
    username,
    role: 'member',
    onboarding_completed: false,
    standards_version: 0,
    standards_accepted_at: null,
    invite_quota: 2,
  });
  if (error) throw error;
}

export async function acceptStandards() {
  const nowIso = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const p = await getMyProfile();
    if (!p) return;
    const cfg = await getAppConfig();
    await upsertMockProfile({ ...p, standards_version: cfg.standards_version, standards_accepted_at: nowIso });
    return;
  }

  const cfg = await getAppConfig();
  const { error } = await supabase
    .from('profiles')
    .update({ standards_version: cfg.standards_version, standards_accepted_at: nowIso });
  if (error) throw error;
}

export async function completeOnboarding() {
  if (!isSupabaseConfigured) {
    const p = await getMyProfile();
    if (!p) return;

    const { getSession } = await import('./session');
    const s = await getSession();
    const computed = onboardingTrustScore(p, s?.role ?? null);
    const existing = typeof p.trust_score === 'number' ? p.trust_score : 0;
    const trust = Math.max(existing, computed);

    await upsertMockProfile({ ...p, onboarding_completed: true, trust_score: trust });

    try {
      const { getGovernanceState, setGovernanceState, appendGovernanceEvents } = await import('./governanceStore');
      const { randomId } = await import('./governance');
      const g = await getGovernanceState(p.user_id);
      const next = { ...g, trustScore: Math.max(g.trustScore ?? 0, trust) };
      await setGovernanceState(p.user_id, next);
      await appendGovernanceEvents([
        {
          id: randomId('evt'),
          userId: p.user_id,
          type: 'ADMIN_OVERRIDE',
          createdAt: new Date().toISOString(),
          meta: { action: 'ONBOARDING_TRUST_INIT', trustScore: next.trustScore },
        },
      ]);
    } catch {
      // ignore
    }
    return;
  }

  const cfg = await getAppConfig();
  const { error } = await supabase.from('profiles').update({
    onboarding_completed: true,
  });
  if (error) throw error;
}
