export type TrustScore = number;

export type ShadowLevel = 'soft' | 'medium' | 'hard' | null;

export type Capabilities = {
  canComment: boolean;
  canPost: boolean;
  canPostLinks: boolean;
  canRequestRoom: boolean;
  moderatorEligible: boolean;
  stewardTier: boolean;
};

export type GovernanceState = {
  userId: string;
  trustScore: TrustScore;
  shadowLevel: ShadowLevel;
  shadowUntil: string | null;
  screenshotCount: number;
  deletedAt: string | null;
  // For later integration (admins override automation)
  manualTrustLocked?: boolean;
  manualShadowLocked?: boolean;
};

export type GovernanceEventType =
  | 'TRUST_DELTA'
  | 'QUALITY_SAVE'
  | 'SCREENSHOT'
  | 'SHADOW_SET'
  | 'ACCOUNT_DELETED'
  | 'ADMIN_OVERRIDE';

export type GovernanceEvent = {
  id: string;
  userId: string;
  type: GovernanceEventType;
  createdAt: string;
  trustDelta?: number;
  meta?: Record<string, any>;
};

export function clampTrust(score: unknown): TrustScore {
  const n = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.trunc(n)));
}

export function computeCapabilities(trustScore: TrustScore): Capabilities {
  const t = clampTrust(trustScore);
  return {
    // V1: allow basic participation once onboarded; keep higher-sensitivity actions gated.
    canComment: t >= 0,
    canPost: t >= 0,
    canPostLinks: t >= 25,
    canRequestRoom: t >= 50,
    moderatorEligible: t >= 75,
    stewardTier: t >= 75,
  };
}

export function isLinkLike(text: string) {
  return /(https?:\/\/|www\.)/i.test(text);
}

export function evaluateShadow(state: Pick<GovernanceState, 'shadowLevel' | 'shadowUntil'>, nowMs = Date.now()): ShadowLevel {
  const untilMs = state.shadowUntil ? new Date(state.shadowUntil).getTime() : null;
  if (untilMs && Number.isFinite(untilMs) && untilMs <= nowMs) return null;
  return state.shadowLevel ?? null;
}

function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV-1a prime: 16777619
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash >>> 0;
}

// Soft shadow: deterministically visible ~30% of the time for non-high-trust viewers.
export function softShadowVisible(params: { viewerId: string; authorId: string; postId: string }) {
  const { viewerId, authorId, postId } = params;
  const h = fnv1a32(`${viewerId}:${authorId}:${postId}`);
  return (h % 10) < 3;
}

export function shouldShowAuthorContent(params: {
  viewerId: string;
  viewerTrust: TrustScore;
  viewerIsModerator: boolean;
  authorId: string;
  authorShadowLevel: ShadowLevel;
  postId: string;
}) {
  const { viewerId, viewerTrust, viewerIsModerator, authorId, authorShadowLevel, postId } = params;

  // Author always sees self.
  if (viewerId === authorId) return true;

  // Moderators/admins always see.
  if (viewerIsModerator) return true;

  if (!authorShadowLevel) return true;

  if (authorShadowLevel === 'soft') {
    // High-trust viewers always see soft-shadow users.
    if (clampTrust(viewerTrust) >= 75) return true;
    return softShadowVisible({ viewerId, authorId, postId });
  }

  // Medium/hard: only author/mods.
  return false;
}

export function applyTrustDelta(state: GovernanceState, delta: number) {
  if (state.manualTrustLocked) return state;
  return { ...state, trustScore: clampTrust(state.trustScore + delta) };
}

export function computeStartingTrust(params: { inviteCode?: string; isAdminInvited?: boolean; isFoundingCohort?: boolean; isAdmin?: boolean }) {
  if (params.isAdmin) return 100;
  if (params.isFoundingCohort) return 55;
  if (params.isAdminInvited) return 45;
  // Default to 0 so onboarding can initialize trust without decreasing users.
  return 0;
}

export function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function addDaysIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function applyScreenshotEscalation(state: GovernanceState): {
  nextState: GovernanceState;
  events: GovernanceEvent[];
  shouldDeleteAccount: boolean;
} {
  const nowIso = new Date().toISOString();
  const nextCount = Math.max(1, (state.screenshotCount ?? 0) + 1);

  const events: GovernanceEvent[] = [];

  // Always log screenshot attempt.
  events.push({
    id: randomId('evt'),
    userId: state.userId,
    type: 'SCREENSHOT',
    createdAt: nowIso,
    meta: { count: nextCount },
  });

  // 1st screenshot: warning + trust −5
  if (nextCount === 1) {
    const nextState = applyTrustDelta({ ...state, screenshotCount: nextCount }, -5);
    events.push({
      id: randomId('evt'),
      userId: state.userId,
      type: 'TRUST_DELTA',
      createdAt: nowIso,
      trustDelta: -5,
      meta: { reason: 'SCREENSHOT_1' },
    });
    return { nextState, events, shouldDeleteAccount: false };
  }

  // 2nd screenshot: 14-day hard shadow
  if (nextCount === 2) {
    const nextState: GovernanceState = {
      ...state,
      screenshotCount: nextCount,
      shadowLevel: 'hard',
      shadowUntil: addDaysIso(14),
    };

    events.push({
      id: randomId('evt'),
      userId: state.userId,
      type: 'SHADOW_SET',
      createdAt: nowIso,
      meta: { level: 'hard', until: nextState.shadowUntil, reason: 'SCREENSHOT_2' },
    });

    return { nextState, events, shouldDeleteAccount: false };
  }

  // 3rd screenshot: account deletion
  const nextState: GovernanceState = {
    ...state,
    screenshotCount: nextCount,
    deletedAt: nowIso,
    shadowLevel: 'hard',
    shadowUntil: null,
  };

  events.push({
    id: randomId('evt'),
    userId: state.userId,
    type: 'ACCOUNT_DELETED',
    createdAt: nowIso,
    meta: { reason: 'SCREENSHOT_3' },
  });

  return { nextState, events, shouldDeleteAccount: true };
}
