import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomId } from './governance';
import {
  Room,
  RoomRequest,
  RoomRequestStatus,
  defaultGeneralRoom,
  slugifyRoomId,
} from './rooms';

const ROOMS_KEY = 'mock_rooms_v1';
const REQUESTS_KEY = 'mock_room_requests_v1';

async function readRooms(): Promise<Room[]> {
  const raw = await AsyncStorage.getItem(ROOMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Room[];
  } catch {
    return [];
  }
}

async function writeRooms(rooms: Room[]) {
  await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

async function readRequests(): Promise<RoomRequest[]> {
  const raw = await AsyncStorage.getItem(REQUESTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RoomRequest[];
  } catch {
    return [];
  }
}

async function writeRequests(reqs: RoomRequest[]) {
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs));
}

export async function ensureDefaultRooms() {
  const rooms = await readRooms();
  const hasGeneral = rooms.some((r) => r.id === 'general');

  const migrated = rooms.map((r) => {
    // Migration: earlier mock versions defaulted new rooms to 40/50/60 which blocks basic participation.
    // Under the current V1 trust model, allow posts/comments broadly and gate links higher.
    const tr = r.trustRules;
    const looksLikeOldDefault = !!tr && tr.comment === 40 && tr.post === 50 && tr.links === 60;
    if (!looksLikeOldDefault) return r;
    return { ...r, trustRules: { comment: 0, post: 0, links: 25 } };
  });

  if (!hasGeneral) {
    const nowIso = new Date().toISOString();
    migrated.unshift(defaultGeneralRoom(nowIso));
  }

  await writeRooms(migrated);
}

export async function listRooms(): Promise<Room[]> {
  await ensureDefaultRooms();
  const rooms = await readRooms();
  return rooms.slice().sort((a, b) => {
    if (a.isGeneral && !b.isGeneral) return -1;
    if (!a.isGeneral && b.isGeneral) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getRoom(roomId: string): Promise<Room | null> {
  await ensureDefaultRooms();
  const rooms = await readRooms();
  return rooms.find((r) => r.id === roomId) ?? null;
}

export async function updateRoom(roomId: string, patch: Partial<Room>) {
  await ensureDefaultRooms();
  const rooms = await readRooms();
  const next = rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r));
  await writeRooms(next);
}

export async function submitRoomRequest(params: {
  requestedBy: string;
  proposedName: string;
  purpose: string;
  differs: string;
  exampleTopics: string;
  suggestedModerators?: string;
}) {
  const nowIso = new Date().toISOString();
  const req: RoomRequest = {
    id: randomId('req'),
    requestedBy: params.requestedBy,
    createdAt: nowIso,
    status: 'pending',
    proposedName: params.proposedName.trim(),
    purpose: params.purpose.trim(),
    differs: params.differs.trim(),
    exampleTopics: params.exampleTopics.trim(),
    suggestedModerators: params.suggestedModerators?.trim() || undefined,
  };

  const prev = await readRequests();
  await writeRequests([req, ...prev].slice(0, 200));
  return req;
}

export async function listRoomRequests(): Promise<RoomRequest[]> {
  const reqs = await readRequests();
  return reqs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function setRoomRequestStatus(params: {
  requestId: string;
  status: RoomRequestStatus;
  adminNotes?: string;
  createdRoomId?: string;
}) {
  const reqs = await readRequests();
  const nowIso = new Date().toISOString();
  const next = reqs.map((r) => {
    if (r.id !== params.requestId) return r;
    return {
      ...r,
      status: params.status,
      adminNotes: params.adminNotes,
      createdRoomId: params.createdRoomId ?? r.createdRoomId,
      decidedAt: nowIso,
    };
  });
  await writeRequests(next);
}

export async function approveRoomRequest(params: {
  requestId: string;
  name: string;
  description: string;
  adminNotes?: string;
}) {
  const rooms = await listRooms();

  const baseId = slugifyRoomId(params.name);
  let id = baseId;
  let n = 2;
  while (rooms.some((r) => r.id === id)) {
    id = `${baseId}-${n++}`;
  }

  const nowIso = new Date().toISOString();
  const room: Room = {
    id,
    name: params.name.trim(),
    description: params.description.trim(),
    trustRules: { comment: 0, post: 0, links: 25 },
    moderators: [],
    slowModeSeconds: null,
    isGeneral: false,
    createdAt: nowIso,
  };

  await writeRooms([room, ...rooms]);
  await setRoomRequestStatus({
    requestId: params.requestId,
    status: 'approved',
    adminNotes: params.adminNotes,
    createdRoomId: room.id,
  });

  return room;
}

export async function clearRoomsAndRequests() {
  await AsyncStorage.multiRemove([ROOMS_KEY, REQUESTS_KEY]);
}
