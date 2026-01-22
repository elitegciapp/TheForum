import { useState } from 'react';
import { Alert, Text, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { createMyProfile } from '../../lib/profiles';
import { getSession } from '../../lib/session';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!agree) {
      Alert.alert('Required', 'You must agree to the Code of Conduct.');
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      if (!session?.userId) throw new Error('Not authenticated');

      await createMyProfile(session.userId, username.trim());
      router.replace('/(onboarding)/welcome');
    } catch (e: any) {
      Alert.alert('Could not continue', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.h1}>Complete Profile</Text>
      <Text style={styles.sub}>Choose a professional display name.</Text>
      <Input
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="Your name or handle"
        autoCapitalize="none"
      />

      <Pressable onPress={() => setAgree((v: boolean) => !v)} style={styles.checkRow}>
        <View style={[styles.checkbox, agree && styles.checkboxOn]} />
        <Text style={styles.checkText}>I agree to The Forum Code of Conduct</Text>
      </Pressable>

      <Button
        title="Continue"
        onPress={submit}
        loading={loading}
        disabled={!username}
      />
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 8, color: '#6B6257' },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D8D1C7',
    backgroundColor: '#FFF',
  },
  checkboxOn: { backgroundColor: '#1E1A14' },
  checkText: { marginLeft: 10, color: '#3A332A', fontWeight: '600' },
});
