// @ts-nocheck
import { adminClient, computePrivileges, getAuthedUser, getProfileByUserId, json } from '../_shared/enforcement.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { user } = await getAuthedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    const admin = adminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const profile = await getProfileByUserId(admin, user.id);
    if (!profile) return json({ error: 'NO_PROFILE' }, { status: 404 });

    return json(computePrivileges(profile));
  } catch (e) {
    const msg = String(e?.message ?? e);
    const status = msg === 'UNAUTHENTICATED' ? 401 : 500;
    return json({ error: msg }, { status });
  }
});
