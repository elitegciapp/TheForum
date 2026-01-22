import { Stack, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSession, subscribeSession } from '../../lib/session';

export default function AdminLayout() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const s = await getSession();
      if (mounted) setOk(!!s && s.role === 'admin');
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

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F7F4EF' },
        headerTintColor: '#1E1A14',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Council Console' }} />
      <Stack.Screen name="invites" options={{ title: 'Access Codes' }} />
      <Stack.Screen name="users" options={{ title: 'Member Oversight' }} />
      <Stack.Screen name="room-requests" options={{ title: 'Room Requests' }} />
      <Stack.Screen name="content" options={{ title: 'Content Moderation' }} />
      <Stack.Screen name="moderation" options={{ title: 'Moderation Log' }} />
      <Stack.Screen name="metrics" options={{ title: 'Forum Metrics' }} />
    </Stack>
  );
}
