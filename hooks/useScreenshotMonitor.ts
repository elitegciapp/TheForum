import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { Alert } from 'react-native';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { deleteAccount } from '../lib/auth';

async function reportScreenshot(userId: string) {
  if (!userId) return;

  // In mock mode, enforce locally.
  if (!isSupabaseConfigured) {
    try {
      const { recordScreenshotAttempt } = await import('../lib/governanceStore');
      const res = await recordScreenshotAttempt(userId);
      if (res.status === 'deleted') {
        // Silent deletion: clear local data + sign out.
        await deleteAccount();
      }
    } catch {
      // Silent by design.
    }
    return;
  }

  try {
    await supabase.functions.invoke('policy-screenshot', { body: {} });
  } catch {
    // Intentionally swallow: enforcement is server-side and UX should not break.
  }
}

export function useScreenshotMonitor(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;

    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert(
        'Confidential Content',
        'Screenshots are not permitted. Continued violations will result in suspension.'
      );

      reportScreenshot(userId);
    });

    return () => subscription.remove();
  }, [userId]);
}
