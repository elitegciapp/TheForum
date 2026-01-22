import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { getMyProfile } from '../lib/profiles';
import { getAppConfig } from '../lib/config';
import { getSession, subscribeSession } from '../lib/session';

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const session = await getSession();
        if (!session?.userId) {
          router.replace('/(auth)/welcome');
          return;
        }

        const profile = await getMyProfile();
        if (!profile) {
          router.replace('/(auth)/welcome');
          return;
        }

        // Required onboarding (first time only): block forum access until completed.
        if (!profile.onboarding_completed) {
          router.replace('/(onboarding)/identity');
          return;
        }

        // Screenshot policy acknowledgment (required once)
        if (!profile.screenshot_notice_accepted_at) {
          router.replace('/(onboarding)/screenshot');
          return;
        }

        // Standards acceptance + version gate (force re-acceptance on update)
        try {
          const cfg = await getAppConfig();
          const accepted = !!profile.standards_accepted_at && profile.standards_version === cfg.standards_version;
          if (!accepted) {
            router.replace('/(onboarding)/standards');
            return;
          }
        } catch {
          // If config fetch fails, don't brick the app; backend still enforces via RLS.
        }

        router.replace('/(app)/home');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();

    const unsub = subscribeSession(() => {
      boot();
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return null;
}
