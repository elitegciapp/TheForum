// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    },
    ...init,
  });
}

export function updateTrustScore(user: { trust_score: number }, delta: number) {
  const next = Math.max(0, Math.min(100, (user.trust_score ?? 0) + delta));

  let shadow: 'soft' | 'medium' | 'hard' | null = null;
  if (next < 20) shadow = 'hard';
  else if (next < 30) shadow = 'medium';
  else if (next < 40) shadow = 'soft';

  return {
    trustScore: next,
    shadowLevel: shadow,
  };
}

export function requireTrust(user: { trust_score: number }, min: number) {
  if ((user.trust_score ?? 0) < min) {
    throw new Error('INSUFFICIENT_TRUST');
  }
}

export async function getAuthedUser(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) throw new Error('UNAUTHENTICATED');

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error('UNAUTHENTICATED');
  return { user: data.user, token };
}

export function adminClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getProfileByUserId(admin: any, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('user_id, role, trust_score, shadow_level, suspended_until, deleted_at, onboarding_completed, invite_quota')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function computePrivileges(p: any) {
  const isSuspended = !!p?.suspended_until && new Date(p.suspended_until).getTime() > Date.now();
  const isDeleted = !!p?.deleted_at;

  // Deterministic thresholds (tune server-side later)
  const trust = p?.trust_score ?? 0;

  return {
    trustScore: trust,
    shadowLevel: p?.shadow_level ?? null,
    canComment: !isSuspended && !isDeleted && trust >= 30,
    canPost: !isSuspended && !isDeleted && trust >= 40,
    canInvite: !isSuspended && !isDeleted && trust >= 70,
    isSuspended: isSuspended || isDeleted,
  };
}

export async function requireAdmin(admin: any, userId: string) {
  const p = await getProfileByUserId(admin, userId);
  if (!p) throw new Error('NO_PROFILE');
  // Treat "host" as admin for this MVP.
  if (p.role !== 'host') throw new Error('FORBIDDEN');
  return p;
}
