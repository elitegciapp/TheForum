import { supabase, isSupabaseConfigured } from './supabase';

export type InviteStatus = 'active' | 'expired' | 'redeemed';

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export async function validateInvite(code: string) {
  const trimmed = normalizeCode(code);

  if (!isSupabaseConfigured) {
    if (!trimmed) return { ok: false as const, reason: 'Invalid code' };
    return { ok: true as const };
  }

  const { data, error } = await supabase
    .from('invites')
    .select('code,status,expires_at,redeemed_by')
    .eq('code', trimmed)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false as const, reason: 'Invalid code' };

  const expiresAt = new Date(data.expires_at).getTime();
  const now = Date.now();
  if (data.status !== 'active') return { ok: false as const, reason: 'Invite is not active' };
  if (now > expiresAt) return { ok: false as const, reason: 'Invite has expired' };
  if (data.redeemed_by) return { ok: false as const, reason: 'Invite already redeemed' };

  return { ok: true as const };
}

export async function redeemInvite(code: string, userId: string) {
  const trimmed = normalizeCode(code);

  if (!isSupabaseConfigured) {
    return;
  }

  const { error } = await supabase
    .from('invites')
    .update({
      status: 'redeemed',
      redeemed_by: userId,
      redeemed_at: new Date().toISOString(),
    })
    .eq('code', trimmed)
    .eq('status', 'active');

  if (error) throw error;
}
