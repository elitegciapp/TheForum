import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useScreenshotMonitor } from '../../hooks/useScreenshotMonitor';
import { Redirect } from 'expo-router';
import { getSession, subscribeSession } from '../../lib/session';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sidebar } from '../../components/Sidebar';
import { getDrawerOpen, setDrawerOpen } from '../../lib/sidebarPrefs';

function ScreenshotGuard() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const session = (await supabase.auth.getSession()).data.session;
      if (mounted) setUserId(session?.user?.id ?? null);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useScreenshotMonitor(userId);
  return null;
}

function ProtectedGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const s = await getSession();
      if (mounted) setOk(!!s?.userId);
    }

    check();
    const unsub = subscribeSession(() => check());

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  if (ok === null) return null;
  if (!ok) return <Redirect href="/(auth)/welcome" />;
  return <>{children}</>;
}

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpenState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const open = await getDrawerOpen();
        if (!cancelled) setDrawerOpenState(open);
      } catch {
        if (!cancelled) setDrawerOpenState(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Close drawer automatically when switching to desktop.
    if (isDesktop) {
      setDrawerOpenState(false);
      setDrawerOpen(false).catch(() => {});
    }
  }, [isDesktop]);

  async function toggleDrawer(next?: boolean) {
    const open = typeof next === 'boolean' ? next : !drawerOpen;
    setDrawerOpenState(open);
    try {
      await setDrawerOpen(open);
    } catch {
      // ignore
    }
  }

  return (
    <ProtectedGuard>
      <ScreenshotGuard />
      <View style={styles.shell}>
        {isDesktop && (
          <View style={styles.sidebarDesktop}>
            <Sidebar variant="desktop" />
          </View>
        )}

        <View style={styles.content}>
          {!isDesktop && (
            <SafeAreaView edges={['top']} style={styles.topBarSafe} pointerEvents="box-none">
              <View style={styles.topBar} pointerEvents="auto">
                <Pressable
                  onPress={() => toggleDrawer(true)}
                  accessibilityLabel="Open rooms navigation"
                  style={styles.hamburger}
                  hitSlop={8}
                >
                  <View style={styles.hLine} />
                  <View style={styles.hLine} />
                  <View style={styles.hLine} />
                </Pressable>
                <Text style={styles.topBarTitle}>Communities</Text>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          )}

          <View style={[styles.stackWrap, !isDesktop && { paddingTop: insets.top + 52 }]} pointerEvents="box-none">
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </View>

        {!isDesktop && drawerOpen && (
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.drawerBackdrop} onPress={() => toggleDrawer(false)} />
            <View style={styles.drawerPanel}>
              <Sidebar variant="drawer" onNavigate={() => toggleDrawer(false)} />
            </View>
          </View>
        )}
      </View>
    </ProtectedGuard>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#F7F4EF' },
  sidebarDesktop: { width: 300 },
  content: { flex: 1, position: 'relative' },

  stackWrap: { flex: 1 },

  topBarSafe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 50,
    elevation: 50,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#F7F4EF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DED3',
  },
  topBarTitle: {
    color: '#1E1A14',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hamburger: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  hLine: { width: 16, height: 2, backgroundColor: '#1E1A14', borderRadius: 2 },

  drawerOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  drawerPanel: { width: 300, backgroundColor: '#F7F4EF' },
});
