import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { updateMyProfile } from '../../lib/profiles';

export default function ScreenshotPolicy() {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function accept() {
    if (!ok) {
      Alert.alert('Required', 'Please acknowledge the screenshot policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await updateMyProfile({ screenshot_notice_accepted_at: new Date().toISOString() } as any);
      router.replace('/(onboarding)/standards');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Screenshot Policy</Text>
      <Text style={styles.p}>
        Content inside The Forum is intended for members only.
      </Text>
      <Text style={styles.p}>
        Screenshots, recordings, or redistribution without permission are prohibited.
      </Text>

      <Pressable onPress={() => setOk((v) => !v)} style={styles.checkRow}>
        <View style={[styles.checkbox, ok && styles.checkboxOn]} />
        <Text style={styles.checkText}>I understand and agree</Text>
      </Pressable>

      <Button title="Continue" onPress={accept} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 20, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  p: { marginTop: 12, color: '#3A332A', lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D8D1C7',
    backgroundColor: '#FFF',
  },
  checkboxOn: { backgroundColor: '#1E1A14' },
  checkText: { marginLeft: 10, color: '#3A332A', fontWeight: '700' },
});
