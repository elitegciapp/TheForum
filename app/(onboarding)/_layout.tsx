import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSession, subscribeSession } from '../../lib/session';

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

export default function OnboardingLayout() {
  return (
    <ProtectedGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedGuard>
  );
}
