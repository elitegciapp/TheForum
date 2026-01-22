// @ts-nocheck
import { adminClient, getAuthedUser, json, requireAdmin } from '../_shared/enforcement.ts';

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
    if (!targetUserId) return json({ error: 'BAD_USER' }, { status: 400 });

    const nowIso = new Date().toISOString();

    // Soft-delete by default: mark deleted + lock account (content retention possible).
    await admin.from('profiles').update({ deleted_at: nowIso, suspended_until: '9999-12-31T00:00:00Z', shadow_level: 'hard' }).eq('user_id', targetUserId);
    await admin.from('policy_events').insert({ user_id: targetUserId, type: 'MOD_REMOVE', delta: 0, meta: { action: 'ADMIN_DELETE' } });

    // Optional hard delete of auth user
    const hardDelete = (Deno.env.get('ADMIN_DELETE_HARD') ?? '').toLowerCase() === 'true';
    if (hardDelete) {
      await admin.auth.admin.deleteUser(targetUserId);
    }

    return json({ ok: true, hardDelete });
  } catch (e) {
    const msg = String(e?.message ?? e);
    const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'FORBIDDEN' ? 403 : 500;
    return json({ error: msg }, { status });
  }
});
