import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, router } from 'expo-router';
import { getMyEnforcement } from '../lib/enforcement';
import { RoomList } from './RoomList';

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

export function Sidebar(props: Props) {
  const pathname = usePathname();
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const enf = await getMyEnforcement();
        if (cancelled) return;
        setCanModerate(!!enf.moderatorEligible);
      } catch {
        if (cancelled) return;
        setCanModerate(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function nav(href: string) {
    router.push(href as any);
    props.onNavigate?.();
  }

  return (
    <View style={[styles.shell, props.variant === 'drawer' && styles.shellDrawer]}>
      <Text style={styles.brand}>The Forum</Text>

      <View style={styles.topNav}>
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

      </View>

      <View style={styles.divider} />

      <RoomList variant="sidebar" onNavigate={props.onNavigate} />

      {canModerate && (
        <View style={styles.moderation}>
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
        </View>
      )}
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
  topNav: {
    paddingBottom: 8,
  },
  sectionLabel: {
    color: '#6B6257',
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5DED3',
    marginVertical: 12,
  },

  moderation: {
    paddingBottom: 14,
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

});
