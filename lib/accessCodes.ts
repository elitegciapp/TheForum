import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccessCodeRole = 'user' | 'admin';

export type AccessCode = {
  code: string;
  role: AccessCodeRole;
  usesRemaining: number;
  revoked: boolean;
  createdAt: string;
};

const CODES_KEY = 'mock_access_codes_v1';

function normalize(code: string) {
  return (code ?? '').trim().toUpperCase();
}

function randomChunk(len: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function generateCode() {
  // Mock-mode friendly. In production, generate via cryptographically secure RNG.
  return `FORUM-${randomChunk(5)}-${randomChunk(5)}`;
}

async function readCodes(): Promise<AccessCode[]> {
  const raw = await AsyncStorage.getItem(CODES_KEY);
  if (!raw) {
    // Seed with hardcoded test codes (admin + user). Limited-use and revocable.
    const nowIso = new Date().toISOString();
    const seeded: AccessCode[] = [
      { code: 'FORUM-ADMIN-TEST-2026', role: 'admin', usesRemaining: 3, revoked: false, createdAt: nowIso },
      { code: 'FORUM-USER-TEST-2026', role: 'user', usesRemaining: 25, revoked: false, createdAt: nowIso },
    ];
    await AsyncStorage.setItem(CODES_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as AccessCode[];
  } catch {
    return [];
  }
}

async function writeCodes(codes: AccessCode[]) {
  await AsyncStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

export async function listAccessCodes(): Promise<AccessCode[]> {
  const codes = await readCodes();
  return codes.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function generateAccessCode(params: { role: AccessCodeRole; uses: number }) {
  const codes = await readCodes();
  const nowIso = new Date().toISOString();

  const usesRemaining = Math.max(1, Math.trunc(params.uses || 1));

  let code = generateCode();
  while (codes.some((c) => c.code === code)) code = generateCode();

  const next: AccessCode = {
    code,
    role: params.role,
    usesRemaining,
    revoked: false,
    createdAt: nowIso,
  };

  await writeCodes([next, ...codes]);
  return next;
}

export async function revokeAccessCode(code: string) {
  const target = normalize(code);
  const codes = await readCodes();
  const next = codes.map((c) => (c.code === target ? { ...c, revoked: true } : c));
  await writeCodes(next);
}

export async function validateAndConsumeAccessCode(code: string): Promise<{ ok: true; role: AccessCodeRole } | { ok: false }> {
  const target = normalize(code);
  if (!target) return { ok: false };

  const codes = await readCodes();
  const idx = codes.findIndex((c) => c.code === target);
  if (idx < 0) return { ok: false };

  const c = codes[idx];
  if (c.revoked) return { ok: false };
  if ((c.usesRemaining ?? 0) <= 0) return { ok: false };

  const updated: AccessCode = {
    ...c,
    usesRemaining: Math.max(0, (c.usesRemaining ?? 0) - 1),
  };

  const next = codes.slice();
  next[idx] = updated;
  await writeCodes(next);

  return { ok: true, role: updated.role };
}
