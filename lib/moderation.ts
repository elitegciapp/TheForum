import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShadowLevel } from './governance';

export type ModeratorAction =
  | 'POST_REMOVE'
  | 'POST_LOCK'
  | 'POST_UNLOCK'
  | 'ROOM_SLOW_MODE_SET'
  | 'THREAD_SLOW_MODE_SET'
  | 'ROOM_SHADOW_SET'
  | 'FLAG_TO_ADMIN';

export type ModeratorEvent = {
  id: string;
  moderatorId: string;
  roomId: string;
  targetUserId?: string;
  targetPostId?: string;
  action: ModeratorAction;
  createdAt: string;
  meta?: Record<string, any>;
};

export type RoomShadowEntry = {
  roomId: string;
  userId: string;
  level: ShadowLevel;
  until: string | null;
  setBy: string;
  createdAt: string;
};

const ROOM_SHADOWS_KEY = 'mock_room_shadows_v1';
const MOD_EVENTS_KEY = 'mock_moderator_events_v1';

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

type RoomShadowMap = Record<string, RoomShadowEntry>; // `${roomId}:${userId}` -> entry

async function readRoomShadowMap(): Promise<RoomShadowMap> {
  const raw = await AsyncStorage.getItem(ROOM_SHADOWS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as RoomShadowMap;
  } catch {
    return {};
  }
}

async function writeRoomShadowMap(map: RoomShadowMap) {
  await AsyncStorage.setItem(ROOM_SHADOWS_KEY, JSON.stringify(map));
}

async function readEvents(): Promise<ModeratorEvent[]> {
  const raw = await AsyncStorage.getItem(MOD_EVENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ModeratorEvent[];
  } catch {
    return [];
  }
}

async function writeEvents(events: ModeratorEvent[]) {
  await AsyncStorage.setItem(MOD_EVENTS_KEY, JSON.stringify(events));
}

export async function appendModeratorEvent(event: Omit<ModeratorEvent, 'id' | 'createdAt'>) {
  const nowIso = new Date().toISOString();
  const events = await readEvents();
  events.unshift({ id: randomId('mod'), createdAt: nowIso, ...event });
  await writeEvents(events.slice(0, 800));
}

export async function listModeratorEvents(): Promise<ModeratorEvent[]> {
  const events = await readEvents();
  return events.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRoomShadowLevel(roomId: string, userId: string, nowMs = Date.now()): Promise<ShadowLevel> {
  const map = await readRoomShadowMap();
  const key = `${roomId}:${userId}`;
  const entry = map[key];
  if (!entry) return null;
  if (!entry.level) return null;
  if (entry.until) {
    const untilMs = new Date(entry.until).getTime();
    if (Number.isFinite(untilMs) && untilMs <= nowMs) return null;
  }
  return entry.level;
}

async function canModerateRoom(params: { actorId: string; roomId: string }) {
  const { getSession } = await import('./session');
  const s = await getSession();
  if (s?.role === 'admin') return true;

  const { getRoom } = await import('./roomsStore');
  const room = await getRoom(params.roomId);
  if (!room) return false;
  if (!room.moderators?.includes(params.actorId)) return false;

  const { getGovernanceState } = await import('./governanceStore');
  const { computeCapabilities } = await import('./governance');
  const g = await getGovernanceState(params.actorId);
  return computeCapabilities(g.trustScore).moderatorEligible;
}

export async function setRoomShadow(params: { actorId: string; roomId: string; targetUserId: string; level: ShadowLevel; until: string | null }) {
  const ok = await canModerateRoom({ actorId: params.actorId, roomId: params.roomId });
  if (!ok) throw new Error('Action not permitted');

  const nowIso = new Date().toISOString();
  const map = await readRoomShadowMap();
  const key = `${params.roomId}:${params.targetUserId}`;
  map[key] = {
    roomId: params.roomId,
    userId: params.targetUserId,
    level: params.level,
    until: params.until ?? null,
    setBy: params.actorId,
    createdAt: nowIso,
  };
  await writeRoomShadowMap(map);

  await appendModeratorEvent({
    moderatorId: params.actorId,
    roomId: params.roomId,
    targetUserId: params.targetUserId,
    action: 'ROOM_SHADOW_SET',
    meta: { level: params.level, until: params.until ?? null },
  });
}

export async function setRoomSlowMode(params: { actorId: string; roomId: string; seconds: number | null }) {
  const ok = await canModerateRoom({ actorId: params.actorId, roomId: params.roomId });
  if (!ok) throw new Error('Action not permitted');

  const { updateRoom } = await import('./roomsStore');
  await updateRoom(params.roomId, { slowModeSeconds: params.seconds ?? null });

  await appendModeratorEvent({
    moderatorId: params.actorId,
    roomId: params.roomId,
    action: 'ROOM_SLOW_MODE_SET',
    meta: { seconds: params.seconds ?? null },
  });
}

export async function setThreadSlowMode(params: { actorId: string; postId: string; roomId: string; seconds: number | null }) {
  const ok = await canModerateRoom({ actorId: params.actorId, roomId: params.roomId });
  if (!ok) throw new Error('Action not permitted');

  const { updatePost } = await import('./posts');
  await updatePost(params.postId, { thread_slow_mode_seconds: params.seconds ?? null });

  await appendModeratorEvent({
    moderatorId: params.actorId,
    roomId: params.roomId,
    targetPostId: params.postId,
    action: 'THREAD_SLOW_MODE_SET',
    meta: { seconds: params.seconds ?? null },
  });
}

export async function setPostLocked(params: { actorId: string; postId: string; roomId: string; locked: boolean }) {
  const ok = await canModerateRoom({ actorId: params.actorId, roomId: params.roomId });
  if (!ok) throw new Error('Action not permitted');

  const { updatePost } = await import('./posts');
  await updatePost(params.postId, { locked: params.locked });

  await appendModeratorEvent({
    moderatorId: params.actorId,
    roomId: params.roomId,
    targetPostId: params.postId,
    action: params.locked ? 'POST_LOCK' : 'POST_UNLOCK',
  });
}

export async function removePost(params: { actorId: string; postId: string; roomId: string; targetUserId?: string }) {
  const ok = await canModerateRoom({ actorId: params.actorId, roomId: params.roomId });
  if (!ok) throw new Error('Action not permitted');

  const { updatePost } = await import('./posts');
  await updatePost(params.postId, {
    status: 'removed',
    removed_at: new Date().toISOString(),
    removed_by: params.actorId,
  } as any);

  await appendModeratorEvent({
    moderatorId: params.actorId,
    roomId: params.roomId,
    targetPostId: params.postId,
    targetUserId: params.targetUserId,
    action: 'POST_REMOVE',
  });
}

export async function flagToAdmin(params: { actorId: string; roomId: string; targetUserId?: string; targetPostId?: string; meta?: Record<string, any> }) {
  const ok = await canModerateRoom({ actorId: params.actorId, roomId: params.roomId });
  if (!ok) throw new Error('Action not permitted');

  await appendModeratorEvent({
    moderatorId: params.actorId,
    roomId: params.roomId,
    targetUserId: params.targetUserId,
    targetPostId: params.targetPostId,
    action: 'FLAG_TO_ADMIN',
    meta: params.meta,
  });
}

export async function clearModerationData() {
  await AsyncStorage.multiRemove([ROOM_SHADOWS_KEY, MOD_EVENTS_KEY]);
}
