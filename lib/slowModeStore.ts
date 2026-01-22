import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'mock_slow_mode_v1';

type SlowModeMap = Record<string, string>; // scopeKey -> lastActionAt ISO

async function readMap(): Promise<SlowModeMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SlowModeMap;
  } catch {
    return {};
  }
}

async function writeMap(map: SlowModeMap) {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function enforceSlowMode(params: { scopeKey: string; seconds: number | null | undefined }) {
  const seconds = params.seconds ?? null;
  if (!seconds || seconds <= 0) return;

  const map = await readMap();
  const lastIso = map[params.scopeKey];
  if (lastIso) {
    const lastMs = new Date(lastIso).getTime();
    if (Number.isFinite(lastMs)) {
      const dtMs = Date.now() - lastMs;
      if (Number.isFinite(dtMs) && dtMs < seconds * 1000) {
        throw new Error('Please wait a moment and try again.');
      }
    }
  }
}

export async function recordSlowModeAction(scopeKey: string, atIso = new Date().toISOString()) {
  const map = await readMap();
  map[scopeKey] = atIso;
  await writeMap(map);
}

export async function clearSlowModeForAllUsers() {
  await AsyncStorage.removeItem(KEY);
}
