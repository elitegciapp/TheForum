import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import type { Room } from '../lib/rooms';
import { listRooms } from '../lib/roomsStore';
import { getFavoriteRoomIds, toggleFavoriteRoomId } from '../lib/sidebarPrefs';
import { getMyEnforcement } from '../lib/enforcement';
import { RoomListItem } from './RoomListItem';

export function RoomList(props: { variant: 'sidebar' | 'screen'; onNavigate?: () => void }) {
  const pathname = usePathname();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [canRequestRoom, setCanRequestRoom] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [r, fav, enf] = await Promise.all([listRooms(), getFavoriteRoomIds(), getMyEnforcement()]);
        if (cancelled) return;
        setRooms(r);
        setFavorites(fav);
        setCanRequestRoom(!!enf.canRequestRoom);
      } catch {
        if (cancelled) return;
        setRooms([]);
        setFavorites([]);
        setCanRequestRoom(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const activeRoomId = useMemo(() => {
    const m = pathname.match(/\/\(app\)\/room\/(.+)$/);
    return m?.[1] ?? null;
  }, [pathname]);

  const favoriteRooms = useMemo(() => rooms.filter((r) => favoriteSet.has(r.id)), [rooms, favoriteSet]);
  const joinedRooms = useMemo(() => rooms.filter((r) => !favoriteSet.has(r.id)), [rooms, favoriteSet]);

  function nav(href: string) {
    router.push(href as any);
    props.onNavigate?.();
  }

  async function toggleStar(roomId: string) {
    const next = await toggleFavoriteRoomId(roomId);
    setFavorites(next);
  }

  function requestRoom() {
    if (!canRequestRoom) {
      Alert.alert('Request Room', 'Available to trusted members.');
      return;
    }
    nav('/(app)/request-room');
  }

  return (
    <View style={[styles.shell, props.variant === 'sidebar' ? styles.shellSidebar : styles.shellScreen]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Rooms</Text>
          <Text style={styles.subtitle}>Focused discussions by topic</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => setFavoritesOnly((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={favoritesOnly ? 'Show all rooms' : 'Show favorites'}
            style={({ pressed }) => [styles.iconBtn, favoritesOnly && styles.iconBtnActive, pressed && styles.iconBtnPressed]}
          >
            <Text style={[styles.iconBtnText, favoritesOnly && styles.iconBtnTextActive]}>
              {favoritesOnly ? '★' : '☆'}
            </Text>
          </Pressable>

          <Pressable
            onPress={requestRoom}
            accessibilityRole="button"
            accessibilityLabel={canRequestRoom ? 'Request room' : 'Request room (unavailable)'}
            style={({ pressed }) => [styles.iconBtn, !canRequestRoom && styles.iconBtnDisabled, pressed && styles.iconBtnPressed]}
          >
            <Text style={styles.iconBtnText}>＋</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {favoriteRooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Favorites</Text>
            <View style={styles.sectionBody}>
              {favoriteRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isActive={activeRoomId === room.id}
                  isStarred
                  variant="favorites"
                  onPress={() => nav(`/(app)/room/${room.id}`)}
                  onToggleStar={() => toggleStar(room.id)}
                />
              ))}
            </View>
            <View style={styles.sectionDivider} />
          </View>
        )}

        {!favoritesOnly && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Joined Rooms</Text>
            <View style={styles.sectionBody}>
              {joinedRooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  isActive={activeRoomId === room.id}
                  isStarred={favoriteSet.has(room.id)}
                  variant="joined"
                  onPress={() => nav(`/(app)/room/${room.id}`)}
                  onToggleStar={() => toggleStar(room.id)}
                />
              ))}
            </View>
          </View>
        )}

        {favoritesOnly && favoriteRooms.length === 0 && (
          <View style={{ paddingVertical: 10 }}>
            <Text style={styles.emptyMuted}>No favorites yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  shellSidebar: {
    paddingTop: 6,
  },
  shellScreen: {
    paddingTop: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1A14',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  subtitle: {
    marginTop: 2,
    color: '#6B6257',
    fontSize: 12,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.85,
  },
  iconBtnActive: {
    backgroundColor: '#1E1A14',
    borderColor: '#1E1A14',
  },
  iconBtnDisabled: {
    opacity: 0.55,
  },
  iconBtnText: {
    color: '#1E1A14',
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 18,
  },
  iconBtnTextActive: {
    color: '#FFFFFF',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5DED3',
    marginTop: 10,
    marginBottom: 6,
  },

  scrollContent: {
    paddingBottom: 18,
  },

  section: {
    paddingHorizontal: 6,
  },
  sectionLabel: {
    color: '#6B6257',
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  sectionBody: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5DED3',
    marginTop: 10,
  },

  emptyMuted: {
    color: '#6B6257',
    fontWeight: '700',
    paddingHorizontal: 12,
  },
});
