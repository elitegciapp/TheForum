// @ts-nocheck
import { adminClient, getAuthedUser, json, requireAdmin } from '../_shared/enforcement.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { user } = await getAuthedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    const admin = adminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await requireAdmin(admin, user.id);

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get('userId') ?? '';
    if (!targetUserId) return json({ error: 'BAD_USER' }, { status: 400 });

    const { data, error } = await admin
      .from('policy_events')
      .select('id, type, delta, created_at, meta')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return json({ events: data ?? [] });
  } catch (e) {
    const msg = String(e?.message ?? e);
    const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'FORBIDDEN' ? 403 : 500;
    return json({ error: msg }, { status });
  }
});
