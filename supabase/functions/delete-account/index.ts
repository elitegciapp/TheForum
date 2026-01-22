// @ts-nocheck
// Supabase Edge Function: delete-account
// Deploy with: supabase functions deploy delete-account
// Requires env vars in Supabase project:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    },
    ...init,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json({ error: 'Missing bearer token' }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Validate JWT and get user
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json({ error: 'Invalid session' }, { status: 401 });
  }

  const userId = userData.user.id;

  // Best-effort cleanup of user data (service role bypasses RLS)
  // Keep this minimal but compliant: remove profile, posts (cascades images), reports, and invite redemption link.
  const cleanupErrors: string[] = [];

  {
    const { error } = await admin.from('posts').delete().eq('author_id', userId);
    if (error) cleanupErrors.push(`posts delete: ${error.message}`);
  }

  {
    const { error } = await admin.from('reports').delete().eq('reporter_id', userId);
    if (error) cleanupErrors.push(`reports delete: ${error.message}`);
  }

  {
    const { error } = await admin.from('profiles').delete().eq('user_id', userId);
    if (error) cleanupErrors.push(`profiles delete: ${error.message}`);
  }

  {
    const { error } = await admin
      .from('invites')
      .update({ redeemed_by: null, redeemed_at: null })
      .eq('redeemed_by', userId);
    if (error) cleanupErrors.push(`invites unlink: ${error.message}`);
  }

  // Finally delete auth user
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    return json(
      {
        error: delErr.message,
        cleanupErrors,
      },
      { status: 500 }
    );
  }

  return json({ ok: true, cleanupErrors });
});
