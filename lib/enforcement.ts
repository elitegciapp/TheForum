import { isSupabaseConfigured, supabase } from './supabase';
import { getSession } from './session';

export type UserPrivileges = {
  trustScore: number;
  shadowLevel: 'soft' | 'medium' | 'hard' | null;
  canComment: boolean;
  canPost: boolean;
  canPostLinks: boolean;
  canRequestRoom: boolean;
  moderatorEligible: boolean;
  stewardTier: boolean;
  canInvite: boolean;
  isSuspended: boolean;
  isDeleted: boolean;
  suspendedUntil: string | null;
  deletedAt: string | null;
};

export async function getMyEnforcement(): Promise<UserPrivileges> {
  if (!isSupabaseConfigured) {
    const localSession = await getSession();
    if (localSession?.role === 'admin') {
      return {
        trustScore: 100,
        shadowLevel: null,
        canComment: true,
        canPost: true,
        canPostLinks: true,
        canRequestRoom: true,
        moderatorEligible: true,
        stewardTier: true,
        canInvite: true,
        isSuspended: false,
        isDeleted: false,
        suspendedUntil: null,
        deletedAt: null,
      };
    }

    const session = (await supabase.auth.getSession()).data.session;
    const userId = session?.user?.id;
    if (!userId) {
      return {
        trustScore: 0,
        shadowLevel: null,
        canComment: false,
        canPost: false,
        canPostLinks: false,
        canRequestRoom: false,
        moderatorEligible: false,
        stewardTier: false,
        canInvite: false,
        isSuspended: true,
        isDeleted: false,
        suspendedUntil: null,
        deletedAt: null,
      };
    }

    const { computeCapabilities, evaluateShadow } = await import('./governance');
    const { getGovernanceState } = await import('./governanceStore');

    const g = await getGovernanceState(userId);
    const caps = computeCapabilities(g.trustScore);
    const shadowLevel = evaluateShadow({ shadowLevel: g.shadowLevel, shadowUntil: g.shadowUntil });

    const isDeleted = !!g.deletedAt;
    const isSuspended = isDeleted;

    return {
      trustScore: g.trustScore,
      shadowLevel,
      canComment: !isSuspended && caps.canComment,
      canPost: !isSuspended && caps.canPost,
      canPostLinks: !isSuspended && caps.canPostLinks,
      canRequestRoom: !isSuspended && caps.canRequestRoom,
      moderatorEligible: !isSuspended && caps.moderatorEligible,
      stewardTier: !isSuspended && caps.stewardTier,
      // This app currently uses invites as an "upper-trust" capability.
      canInvite: !isSuspended && caps.canRequestRoom,
      isSuspended,
      isDeleted,
      suspendedUntil: null,
      deletedAt: g.deletedAt,
    };
  }

  const { data, error } = await supabase.functions.invoke('user-enforcement', {
    method: 'GET',
  });

  if (error) throw error;
  return data as UserPrivileges;
}
