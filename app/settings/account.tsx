import { Alert, Text, StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { deleteAccount } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { getMyProfile } from '../../lib/profiles';
import { clearSession } from '../../lib/session';

export default function Account() {
  const [header, setHeader] = useState<{ name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        const name = p?.username ?? 'Member';
        if (!cancelled) setHeader({ name });
      } catch {
        if (!cancelled) {
          setHeader(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestDelete() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and your content. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              // Session may already be invalidated after auth user deletion, but ensure we return to auth.
              await supabase.auth.signOut();
              await clearSession();
              router.replace('/(auth)/welcome');
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      await clearSession();
      router.replace('/(auth)/welcome');
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Account</Text>

      {header && (
        <Text style={styles.profileLine}>{header.name}</Text>
      )}

      <View style={{ marginTop: 12 }}>
        <Button title="Profile" variant="secondary" onPress={() => router.push('/settings/profile')} />
        <Button title="Community Guidelines" variant="secondary" onPress={() => router.push('/settings/community-guidelines')} />
        <Button title="Terms of Access" variant="secondary" onPress={() => router.push('/settings/terms-of-access')} />
        <Button title="Privacy Summary" variant="secondary" onPress={() => router.push('/settings/privacy-summary')} />
        <Button title="Screenshot Notice" variant="secondary" onPress={() => router.push('/settings/screenshot-notice')} />
        <Button title="Delete Account" variant="secondary" onPress={requestDelete} />
        <Button title="Sign Out" onPress={signOut} />
      </View>

      <Text style={styles.note}>Policies are provided for members and review.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  profileLine: { marginTop: 8, color: '#3A332A', fontWeight: '700' },
  note: { marginTop: 18, color: '#6B6257', lineHeight: 18 },
});
