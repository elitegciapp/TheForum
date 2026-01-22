import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GovernanceEvent,
  GovernanceState,
  applyScreenshotEscalation,
  computeStartingTrust,
  randomId,
} from './governance';

const STATE_KEY = 'mock_governance_state_v1';
const EVENTS_KEY = 'mock_governance_events_v1';

type StateMap = Record<string, GovernanceState>;

async function readStateMap(): Promise<StateMap> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StateMap;
  } catch {
    return {};
  }
}

async function writeStateMap(map: StateMap) {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(map));
}

async function readEvents(): Promise<GovernanceEvent[]> {
  const raw = await AsyncStorage.getItem(EVENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GovernanceEvent[];
  } catch {
    return [];
  }
}

async function writeEvents(events: GovernanceEvent[]) {
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export async function getGovernanceState(userId: string): Promise<GovernanceState> {
  const map = await readStateMap();
  const existing = map[userId];
  if (existing) return existing;

  const nowIso = new Date().toISOString();
  const seed = computeStartingTrust({});

  const next: GovernanceState = {
    userId,
    trustScore: seed,
    shadowLevel: null,
    shadowUntil: null,
    screenshotCount: 0,
    deletedAt: null,
  };

  map[userId] = next;
  await writeStateMap(map);

  const events = await readEvents();
  events.unshift({
    id: randomId('evt'),
    userId,
    type: 'ADMIN_OVERRIDE',
    createdAt: nowIso,
    meta: { action: 'INIT_DEFAULTS', trustScore: seed },
  });
  await writeEvents(events.slice(0, 500));

  return next;
}

export async function initGovernanceState(params: {
  userId: string;
  inviteCode?: string;
}) {
  const { userId, inviteCode } = params;
  const map = await readStateMap();
  if (map[userId]) return;

  const code = (inviteCode ?? '').toUpperCase();
  const isFoundingCohort = code.includes('FOUNDERS') || code.includes('FOUNDING');
  const isAdminInvited = !!inviteCode;

  const trustScore = computeStartingTrust({
    inviteCode,
    isAdminInvited,
    isFoundingCohort,
  });

  map[userId] = {
    userId,
    trustScore,
    shadowLevel: null,
    shadowUntil: null,
    screenshotCount: 0,
    deletedAt: null,
  };

  await writeStateMap(map);

  const nowIso = new Date().toISOString();
  const events = await readEvents();
  events.unshift({
    id: randomId('evt'),
    userId,
    type: 'ADMIN_OVERRIDE',
    createdAt: nowIso,
    meta: { action: 'INIT_FROM_INVITE', inviteCode, trustScore },
  });
  await writeEvents(events.slice(0, 500));
}

export async function setGovernanceState(userId: string, next: GovernanceState) {
  const map = await readStateMap();
  map[userId] = next;
  await writeStateMap(map);
}

export async function appendGovernanceEvents(eventsToAdd: GovernanceEvent[]) {
  if (!eventsToAdd.length) return;
  const events = await readEvents();
  events.unshift(...eventsToAdd);
  await writeEvents(events.slice(0, 500));
}

export async function clearGovernanceForAllUsers() {
  await AsyncStorage.multiRemove([STATE_KEY, EVENTS_KEY]);
}

export async function recordScreenshotAttempt(userId: string) {
  const current = await getGovernanceState(userId);
  const { nextState, events, shouldDeleteAccount } = applyScreenshotEscalation(current);
  await setGovernanceState(userId, nextState);
  await appendGovernanceEvents(events);

  if (shouldDeleteAccount) return { status: 'deleted' as const };
  if (nextState.screenshotCount === 2) return { status: 'hard-shadow' as const };
  return { status: 'warning' as const };
}

export async function recordQualitySaveReceived(params: {
  authorId: string;
  saverId: string;
  saverTrust: number;
  postId: string;
}) {
  // Low-noise signal: only high-trust saves influence trust, and only once per (postId,saverId).
  if (params.saverTrust < 75) return;

  const events = await readEvents();
  const already = events.some(
    (e) =>
      e.userId === params.authorId &&
      e.type === 'QUALITY_SAVE' &&
      e.meta?.postId === params.postId &&
      e.meta?.saverId === params.saverId
  );
  if (already) return;

  const current = await getGovernanceState(params.authorId);
  if (current.deletedAt) return;
  if (current.manualTrustLocked) return;

  // Small, non-gamified influence.
  const delta = params.saverTrust >= 90 ? 2 : 1;
  const next = { ...current, trustScore: Math.max(0, Math.min(100, Math.trunc(current.trustScore + delta))) };
  await setGovernanceState(params.authorId, next);

  const nowIso = new Date().toISOString();
  await appendGovernanceEvents([
    {
      id: randomId('evt'),
      userId: params.authorId,
      type: 'QUALITY_SAVE',
      createdAt: nowIso,
      trustDelta: delta,
      meta: { postId: params.postId, saverId: params.saverId, saverTrust: params.saverTrust },
    },
  ]);
}
