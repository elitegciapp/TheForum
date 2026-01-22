import { Alert, Text, StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { signOut } from '../../lib/auth';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSession } from '../../lib/session';

export default function Settings() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession();
        if (!cancelled) setIsAdmin(s?.role === 'admin');
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Settings</Text>

      <View style={{ marginTop: 12 }}>
        {isAdmin && (
          <Button title="Admin Dashboard" variant="secondary" onPress={() => router.push('/admin')} />
        )}
        <Button title="Account" variant="secondary" onPress={() => router.push('/settings/account')} />
        <Button title="Community Guidelines" variant="secondary" onPress={() => router.push('/settings/community-guidelines')} />
        <Button title="Terms of Access" variant="secondary" onPress={() => router.push('/settings/terms-of-access')} />
        <Button title="Privacy Summary" variant="secondary" onPress={() => router.push('/settings/privacy-summary')} />
        <Button title="Screenshot Notice" variant="secondary" onPress={() => router.push('/settings/screenshot-notice')} />
        <Button title="Sign Out" onPress={logout} />
      </View>

      <Text style={styles.foot}>Policies are provided for members and review.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  foot: { marginTop: 18, color: '#6B6257' },
});
