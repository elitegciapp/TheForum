import { clampTrust, type ShadowLevel, type TrustScore } from './governance';

export type RoomTrustRules = {
  comment: number;
  post: number;
  links: number;
};

export type Room = {
  id: string;
  name: string;
  description: string;
  trustRules: RoomTrustRules;
  moderators: string[];
  // Slow mode applies per room (posts + comments). Null disables.
  slowModeSeconds?: number | null;
  isGeneral: boolean;
  createdAt: string;
};

export type RoomRequestStatus = 'pending' | 'revision' | 'denied' | 'archived' | 'approved';

export type RoomRequest = {
  id: string;
  requestedBy: string;
  createdAt: string;
  status: RoomRequestStatus;

  proposedName: string;
  purpose: string;
  differs: string;
  exampleTopics: string;
  suggestedModerators?: string;

  adminNotes?: string;
  decidedAt?: string;
  createdRoomId?: string;
};

export const GENERAL_ROOM_ID = 'general';

export function defaultGeneralRoom(nowIso = new Date().toISOString()): Room {
  return {
    id: GENERAL_ROOM_ID,
    name: 'General',
    description: 'Broad professional discussion and community dialogue',
    trustRules: {
      comment: 0,
      post: 0,
      links: 25,
    },
    moderators: [],
    slowModeSeconds: 60,
    isGeneral: true,
    createdAt: nowIso,
  };
}

export function canCommentInRoom(trustScore: TrustScore, room: Room) {
  return clampTrust(trustScore) >= room.trustRules.comment;
}

export function canPostInRoom(trustScore: TrustScore, room: Room) {
  return clampTrust(trustScore) >= room.trustRules.post;
}

export function canPostLinksInRoom(trustScore: TrustScore, room: Room) {
  return clampTrust(trustScore) >= room.trustRules.links;
}

export function canRequestRoom(params: {
  trustScore: TrustScore;
  shadowLevel: ShadowLevel;
  accountAgeDays: number;
  minAccountAgeDays: number;
}) {
  const trustOk = clampTrust(params.trustScore) >= 50;
  const shadowOk = params.shadowLevel == null;
  const ageOk = params.accountAgeDays >= params.minAccountAgeDays;
  return trustOk && shadowOk && ageOk;
}

export function slugifyRoomId(name: string) {
  const base = (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);
  return base || 'room';
}
