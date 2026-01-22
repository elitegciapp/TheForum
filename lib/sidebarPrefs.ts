import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'sidebar_favorite_rooms_v1';
const DRAWER_OPEN_KEY = 'sidebar_drawer_open_v1';

export async function getFavoriteRoomIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

export async function setFavoriteRoomIds(ids: string[]) {
  const unique = Array.from(new Set((ids ?? []).map((x) => String(x))));
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(unique));
}

export async function toggleFavoriteRoomId(roomId: string): Promise<string[]> {
  const id = String(roomId);
  const current = await getFavoriteRoomIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  await setFavoriteRoomIds(next);
  return next;
}

export async function getDrawerOpen(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(DRAWER_OPEN_KEY);
  if (raw == null) return false;
  return raw === 'true';
}

export async function setDrawerOpen(open: boolean) {
  await AsyncStorage.setItem(DRAWER_OPEN_KEY, open ? 'true' : 'false');
}
