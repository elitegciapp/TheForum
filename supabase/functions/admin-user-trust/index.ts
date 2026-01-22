// @ts-nocheck
import { adminClient, getAuthedUser, json, requireAdmin, updateTrustScore } from '../_shared/enforcement.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { user } = await getAuthedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    const admin = adminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await requireAdmin(admin, user.id);

    const body = await req.json();
    const targetUserId = String(body?.userId ?? '');
    const trustScore = Number(body?.trustScore);

    if (!targetUserId) return json({ error: 'BAD_USER' }, { status: 400 });
    if (!Number.isFinite(trustScore)) return json({ error: 'BAD_TRUST' }, { status: 400 });

    const clamped = Math.max(0, Math.min(100, trustScore));
    const shadow = updateTrustScore({ trust_score: clamped }, 0).shadowLevel;

    const { error } = await admin.from('profiles').update({ trust_score: clamped, shadow_level: shadow }).eq('user_id', targetUserId);
    if (error) throw error;

    await admin.from('policy_events').insert({ user_id: targetUserId, type: 'MOD_REMOVE', delta: 0, meta: { action: 'ADMIN_SET_TRUST', trustScore: clamped } });

    return json({ ok: true, trustScore: clamped, shadowLevel: shadow });
  } catch (e) {
    const msg = String(e?.message ?? e);
    const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'FORBIDDEN' ? 403 : 500;
    return json({ error: msg }, { status });
  }
});
