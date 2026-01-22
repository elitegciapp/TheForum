import { Alert, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useState } from 'react';
import { validateAndConsumeAccessCode } from '../../lib/accessCodes';
import { createSession } from '../../lib/session';
import { initGovernanceState } from '../../lib/governanceStore';
import { ensureMyProfile } from '../../lib/profiles';

export default function Welcome() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  async function enter() {
    setLoading(true);
    try {
      const res = await validateAndConsumeAccessCode(code);
      if (!res.ok) {
        Alert.alert('Access denied', 'Invalid access code.');
        return;
      }

      const session = await createSession(res.role);
      // Seed Step 3 governance defaults immediately.
      await initGovernanceState({ userId: session.userId, inviteCode: code.trim().toUpperCase() });

      // Create a minimal profile record (onboarding will fill it).
      await ensureMyProfile({ userId: session.userId, inviteCode: code.trim().toUpperCase() });

      // Required onboarding (first time only).
      router.replace('/(onboarding)/identity');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function enterAsAdmin() {
    setAdminLoading(true);
    try {
      const session = await createSession('admin');
      await initGovernanceState({ userId: session.userId, inviteCode: 'ADMIN_BYPASS' });
      await ensureMyProfile({ userId: session.userId, inviteCode: 'ADMIN_BYPASS' });
      router.replace('/(onboarding)/identity');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setAdminLoading(false);
    }
  }

  async function enterAsUser() {
    setUserLoading(true);
    try {
      const session = await createSession('user');
      await initGovernanceState({ userId: session.userId, inviteCode: 'USER_BYPASS' });
      await ensureMyProfile({ userId: session.userId, inviteCode: 'USER_BYPASS' });
      router.replace('/(onboarding)/identity');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setUserLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ marginTop: 30 }}>
        <Text style={styles.h1}>The Forum</Text>
        <Text style={styles.sub}>Private discussions for professionals.</Text>
        <Text style={styles.sub2}>Access is by code.</Text>

        <Input label="Access code" value={code} onChangeText={setCode} placeholder="FORUM-XXXXX-XXXXX" />
        <Button title="Continue" onPress={enter} loading={loading} disabled={!code.trim()} />

        <View style={{ marginTop: 10 }}>
          <Button
            title="Continue as Admin (test)"
            variant="secondary"
            onPress={enterAsAdmin}
            loading={adminLoading}
            disabled={loading || userLoading}
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <Button
            title="Continue as User (test)"
            variant="secondary"
            onPress={enterAsUser}
            loading={userLoading}
            disabled={loading || adminLoading}
          />
        </View>

        <View style={{ marginTop: 28 }}>
          <Text style={styles.small}>
            By continuing, you agree to respectful discussion and discretion.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 34, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 10, fontSize: 16, color: '#3A332A' },
  sub2: { marginTop: 6, fontSize: 14, color: '#6B6257' },
  small: { color: '#6B6257', lineHeight: 18 },
});
