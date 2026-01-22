import { useState } from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { validateInvite } from '../../lib/invites';

export default function Invite() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function next() {
    setLoading(true);
    try {
      const res = await validateInvite(code);
      if (!res.ok) {
        Alert.alert('Invite not valid', res.reason);
        return;
      }
      router.push({ pathname: '/(auth)/signup', params: { code: code.trim().toUpperCase() } });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.h1}>Enter Invitation</Text>
      <Text style={styles.sub}>Use the code you received.</Text>

      <Input label="Invitation code" value={code} onChangeText={setCode} placeholder="XXXX-XXXX" />
      <Button title="Continue" onPress={next} loading={loading} disabled={!code.trim()} />
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 8, color: '#6B6257' },
});
