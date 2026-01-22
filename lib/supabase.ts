import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { clearSession, getSession, subscribeSession } from './session';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  !!url &&
  !!anon &&
  !url.includes('YOUR_PROJECT') &&
  !anon.includes('YOUR_ANON_KEY');

type AuthListener = (event: string, session: MockSession | null) => void;
const authListeners = new Set<AuthListener>();

type MockSession = {
  user: { id: string };
};

async function getMockSession(): Promise<MockSession | null> {
  const s = await getSession();
  if (!s) return null;
  return { user: { id: s.userId } };
}

async function setMockSession(session: MockSession | null) {
  // Session is the single source of truth; clearing it signs the user out.
  if (!session) {
    await clearSession();
  }
}

function createMockSupabase() {
  return {
    auth: {
      async getSession() {
        const session = await getMockSession();
        return { data: { session } };
      },
      onAuthStateChange(callback: AuthListener) {
        authListeners.add(callback);

        const unsub = subscribeSession(async () => {
          const s = await getMockSession();
          callback('TOKEN_REFRESHED', s);
        });

        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
                unsub();
              },
            },
          },
        };
      },
      async signOut() {
        await setMockSession(null);
        return { error: null };
      },
    },
    // In mock mode, these are intentionally not implemented.
    from() {
      throw new Error('Supabase is not configured (mock mode): database calls are disabled.');
    },
    storage: {
      from() {
        throw new Error('Supabase is not configured (mock mode): storage calls are disabled.');
      },
    },
    functions: {
      invoke() {
        throw new Error('Supabase is not configured (mock mode): functions are disabled.');
      },
    },
  } as any;
}

export const supabase = isSupabaseConfigured
  ? createClient(url!, anon!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : createMockSupabase();
