// @ts-nocheck
import { adminClient, getAuthedUser, getProfileByUserId, json, updateTrustScore } from '../_shared/enforcement.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { user } = await getAuthedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    const body = await req.json();

    const targetUserId = String(body?.userId ?? user.id);
    const type = String(body?.type ?? '');
    const delta = Number(body?.delta ?? 0);

    // Non-admin users can only log events for themselves.
    if (targetUserId !== user.id) {
      return json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (!['SCREENSHOT', 'REPORT', 'WARNING', 'MOD_REMOVE'].includes(type)) {
      return json({ error: 'BAD_TYPE' }, { status: 400 });
    }

    if (!Number.isFinite(delta)) {
      return json({ error: 'BAD_DELTA' }, { status: 400 });
    }

    const admin = adminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const profile = await getProfileByUserId(admin, targetUserId);
    if (!profile) return json({ error: 'NO_PROFILE' }, { status: 404 });

    // Suspensions/deletions override trust logic: do not change trust when suspended/deleted.
    const isSuspended = !!profile.suspended_until && new Date(profile.suspended_until).getTime() > Date.now();
    const isDeleted = !!profile.deleted_at;

    await admin.from('policy_events').insert({ user_id: targetUserId, type, delta });

    if (isSuspended || isDeleted) {
      return json({ trustScore: profile.trust_score, shadowLevel: profile.shadow_level ?? null });
    }

    const next = updateTrustScore({ trust_score: profile.trust_score }, delta);

    const { error: updErr } = await admin
      .from('profiles')
      .update({ trust_score: next.trustScore, shadow_level: next.shadowLevel })
      .eq('user_id', targetUserId);

    if (updErr) throw updErr;

    return json(next);
  } catch (e) {
    const msg = String(e?.message ?? e);
    const status = msg === 'UNAUTHENTICATED' ? 401 : 500;
    return json({ error: msg }, { status });
  }
});
