import AsyncStorage from '@react-native-async-storage/async-storage';

export type Session = {
  userId: string;
  role: 'user' | 'admin';
  createdAt: string;
};

const SESSION_KEY = 'local_session_v1';

type SessionListener = (session: Session | null) => void;
const listeners = new Set<SessionListener>();

export function subscribeSession(listener: SessionListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function notify(session: Session | null) {
  for (const l of listeners) {
    try {
      l(session);
    } catch {
      // ignore
    }
  }
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  await notify(session);
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
  await notify(null);
}

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export async function createSession(role: Session['role']): Promise<Session> {
  const session: Session = {
    userId: randomId('user'),
    role,
    createdAt: new Date().toISOString(),
  };
  await setSession(session);
  return session;
}
