// @ts-nocheck
import { adminClient, getAuthedUser, getProfileByUserId, json } from '../_shared/enforcement.ts';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { user } = await getAuthedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    const admin = adminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const profile = await getProfileByUserId(admin, user.id);
    if (!profile) return json({ error: 'NO_PROFILE' }, { status: 404 });

    // If already deleted, treat as terminal.
    if (profile.deleted_at) {
      return json({ status: 'deleted' });
    }

    // Deterministic counter update:
    // - If row exists: increment
    // - If not: create with count=1
    const { data: existing, error: selErr } = await admin
      .from('policy_violations')
      .select('count')
      .eq('user_id', user.id)
      .eq('type', 'SCREENSHOT')
      .maybeSingle();

    if (selErr) throw selErr;

    const nowIso = new Date().toISOString();

    let nextCount = 1;
    if (!existing) {
      const { error: insErr } = await admin.from('policy_violations').insert({
        user_id: user.id,
        type: 'SCREENSHOT',
        count: 1,
        last_violation: nowIso,
        updated_at: nowIso,
        status: 'active',
      });
      if (insErr) throw insErr;
    } else {
      nextCount = Math.max(1, Number(existing.count ?? 0) + 1);
      const { error: updErr } = await admin
        .from('policy_violations')
        .update({ count: nextCount, last_violation: nowIso, updated_at: nowIso })
        .eq('user_id', user.id)
        .eq('type', 'SCREENSHOT');
      if (updErr) throw updErr;
    }

    // Always log a policy event (-10)
    await admin.from('policy_events').insert({ user_id: user.id, type: 'SCREENSHOT', delta: -10 });

    // Enforcement overrides trust logic:
    // 1 -> warning
    // 2 -> 14-day suspension
    // 3+ -> permanent deletion (implemented as server-side "deleted_at" + indefinite suspension)

    if (nextCount === 1) {
      // Warning is server-only; no UI indicators required.
      await admin.from('policy_events').insert({ user_id: user.id, type: 'WARNING', delta: 0, meta: { reason: 'SCREENSHOT_1' } });
      return json({ status: 'warning' });
    }

    if (nextCount === 2) {
      const until = addDays(new Date(), 14).toISOString();
      const { error: upErr } = await admin
        .from('profiles')
        .update({ suspended_until: until })
        .eq('user_id', user.id);
      if (upErr) throw upErr;

      await admin.from('policy_events').insert({ user_id: user.id, type: 'MOD_REMOVE', delta: 0, meta: { action: 'SUSPEND_14_DAYS' } });
      await admin.from('policy_violations').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('type', 'SCREENSHOT');

      return json({ status: 'suspended', suspendedUntil: until });
    }

    // 3+
    const nowIso = new Date().toISOString();
    await admin.from('profiles').update({ deleted_at: nowIso, suspended_until: '9999-12-31T00:00:00Z', shadow_level: 'hard' }).eq('user_id', user.id);
    await admin.from('policy_violations').update({ status: 'deleted', updated_at: nowIso }).eq('user_id', user.id).eq('type', 'SCREENSHOT');
    await admin.from('policy_events').insert({ user_id: user.id, type: 'MOD_REMOVE', delta: 0, meta: { action: 'PERMA_DELETE' } });

    // Optional: actually delete the auth user (will cascade in your current schema).
    // Set env var DELETE_AUTH_ON_PERMA_DELETE=true if you want hard deletion.
    const hardDelete = (Deno.env.get('DELETE_AUTH_ON_PERMA_DELETE') ?? '').toLowerCase() === 'true';
    if (hardDelete) {
      await admin.auth.admin.deleteUser(user.id);
    }

    return json({ status: 'deleted' });
  } catch (e) {
    const msg = String(e?.message ?? e);
    const status = msg === 'UNAUTHENTICATED' ? 401 : 500;
    return json({ error: msg }, { status });
  }
});
