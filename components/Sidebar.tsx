import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, router } from 'expo-router';
import type { Room } from '../lib/rooms';
import { listRooms } from '../lib/roomsStore';
import { getFavoriteRoomIds, toggleFavoriteRoomId } from '../lib/sidebarPrefs';
import { getMyEnforcement } from '../lib/enforcement';

type Props = {
  variant: 'desktop' | 'drawer';
  onNavigate?: () => void;
};

function IconBadge(props: { label: string; active: boolean }) {
  return (
    <View style={[styles.iconBadge, props.active && styles.iconBadgeActive]}>
      <Text style={[styles.iconBadgeText, props.active && styles.iconBadgeTextActive]}>{props.label}</Text>
    </View>
  );
}

function RoomAvatar(props: { name: string; active: boolean }) {
  const initials = useMemo(() => {
    const parts = (props.name ?? '').trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? 'R';
    const b = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
    return `${a}${b}`.toUpperCase();
  }, [props.name]);

  return (
    <View style={[styles.roomAvatar, props.active && styles.roomAvatarActive]}>
      <Text style={[styles.roomAvatarText, props.active && styles.roomAvatarTextActive]}>{initials}</Text>
    </View>
  );
}

export function Sidebar(props: Props) {
  const pathname = usePathname();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [canManageRooms, setCanManageRooms] = useState(false);
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [r, fav, enf] = await Promise.all([listRooms(), getFavoriteRoomIds(), getMyEnforcement()]);
        if (cancelled) return;
        setRooms(r);
        setFavorites(fav);
        setCanManageRooms(!!enf.canRequestRoom);
        setCanModerate(!!enf.moderatorEligible);
      } catch {
        if (cancelled) return;
        setRooms([]);
        setFavorites([]);
        setCanManageRooms(false);
        setCanModerate(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const activeRoomId = useMemo(() => {
    const m = pathname.match(/\/(app)\/room\/(.+)$/);
    return m?.[2] ?? null;
  }, [pathname]);

  function nav(href: string) {
    router.push(href as any);
    props.onNavigate?.();
  }

  async function toggleStar(roomId: string) {
    const next = await toggleFavoriteRoomId(roomId);
    setFavorites(next);
  }

  const joinedRooms = rooms; // MVP: treat all available rooms as joined.

  return (
    <View style={[styles.shell, props.variant === 'drawer' && styles.shellDrawer]}>
      <Text style={styles.brand}>The Forum</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Navigation</Text>

        <Pressable
          onPress={() => nav('/(app)/home')}
          style={[styles.navRow, pathname === '/(app)/home' && styles.navRowActive]}
        >
          <IconBadge label="H" active={pathname === '/(app)/home'} />
          <Text style={[styles.navLabel, pathname === '/(app)/home' && styles.navLabelActive]}>Home</Text>
        </Pressable>

        <Pressable
          onPress={() => nav('/(app)/rooms')}
          style={[styles.navRow, pathname === '/(app)/rooms' && styles.navRowActive]}
        >
          <IconBadge label="R" active={pathname === '/(app)/rooms'} />
          <Text style={[styles.navLabel, pathname === '/(app)/rooms' && styles.navLabelActive]}>Rooms</Text>
        </Pressable>

        <Pressable
          onPress={() => nav('/(app)/explore')}
          style={[styles.navRow, pathname === '/(app)/explore' && styles.navRowActive]}
        >
          <IconBadge label="E" active={pathname === '/(app)/explore'} />
          <Text style={[styles.navLabel, pathname === '/(app)/explore' && styles.navLabelActive]}>Explore</Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Rooms</Text>
        </View>

        {canManageRooms && (
          <Pressable onPress={() => nav('/(app)/request-room')} style={styles.manageRow}>
            <Text style={styles.manageText}>Manage Rooms</Text>
          </Pressable>
        )}

        <View style={{ marginTop: 8 }}>
          <Text style={styles.subLabel}>Joined Rooms</Text>

          {joinedRooms.map((room) => {
            const isActive = activeRoomId === room.id;
            const starred = favoriteSet.has(room.id);

            return (
              <View key={room.id} style={[styles.roomRow, isActive && styles.roomRowActive]}>
                <Pressable onPress={() => nav(`/(app)/room/${room.id}`)} style={styles.roomRowMain}>
                  <RoomAvatar name={room.name} active={isActive} />
                  <Text style={[styles.roomName, isActive && styles.roomNameActive]} numberOfLines={1}>
                    {room.name}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => toggleStar(room.id)}
                  accessibilityLabel={starred ? 'Unfavorite room' : 'Favorite room'}
                  style={styles.starBtn}
                >
                  <Text style={[styles.star, starred && styles.starOn]}>{starred ? '★' : '☆'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {canModerate && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Moderation</Text>

            <Pressable
              onPress={() => nav('/(app)/mod-queue')}
              style={[styles.navRow, pathname === '/(app)/mod-queue' && styles.navRowActive]}
            >
              <IconBadge label="M" active={pathname === '/(app)/mod-queue'} />
              <Text style={[styles.navLabel, pathname === '/(app)/mod-queue' && styles.navLabelActive]}>Mod Queue</Text>
            </Pressable>

            <Pressable
              onPress={() => nav('/(app)/reports')}
              style={[styles.navRow, pathname === '/(app)/reports' && styles.navRowActive]}
            >
              <IconBadge label="R" active={pathname === '/(app)/reports'} />
              <Text style={[styles.navLabel, pathname === '/(app)/reports' && styles.navLabelActive]}>Reports</Text>
            </Pressable>

            <Pressable
              onPress={() => nav('/(app)/behavior-rules')}
              style={[styles.navRow, pathname === '/(app)/behavior-rules' && styles.navRowActive]}
            >
              <IconBadge label="B" active={pathname === '/(app)/behavior-rules'} />
              <Text style={[styles.navLabel, pathname === '/(app)/behavior-rules' && styles.navLabelActive]}>
                Behavior Rules
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F7F4EF',
    borderRightWidth: 1,
    borderRightColor: '#E5DED3',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  shellDrawer: {
    width: 300,
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1A14',
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  sectionLabel: {
    color: '#6B6257',
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subLabel: {
    color: '#6B6257',
    fontWeight: '700',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5DED3',
    marginVertical: 12,
  },

  navRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  navRowActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  navLabel: {
    marginLeft: 10,
    color: '#1E1A14',
    fontWeight: '800',
  },
  navLabelActive: {
    color: '#1E1A14',
  },

  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: '#1E1A14',
    borderColor: '#1E1A14',
  },
  iconBadgeText: {
    color: '#1E1A14',
    fontWeight: '900',
  },
  iconBadgeTextActive: {
    color: '#FFFFFF',
  },

  manageRow: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  manageText: {
    color: '#1E1A14',
    fontWeight: '800',
  },

  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  roomRowActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  roomRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomName: {
    color: '#1E1A14',
    fontWeight: '800',
  },
  roomNameActive: {
    color: '#1E1A14',
  },
  starBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  star: {
    fontSize: 18,
    color: '#6B6257',
    fontWeight: '900',
  },
  starOn: {
    color: '#1E1A14',
  },

  roomAvatar: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomAvatarActive: {
    backgroundColor: '#1E1A14',
    borderColor: '#1E1A14',
  },
  roomAvatarText: {
    color: '#1E1A14',
    fontWeight: '900',
    fontSize: 12,
  },
  roomAvatarTextActive: {
    color: '#FFFFFF',
  },
});
