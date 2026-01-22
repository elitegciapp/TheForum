import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { getMyProfile, updateMyProfile } from '../../lib/profiles';

const INTENTS = ['Learning', 'Networking', 'Sharing expertise', 'Deal flow', 'Professional discussion'] as const;

type Intent = (typeof INTENTS)[number];

export default function IntentScreen() {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Intent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        const arr = Array.isArray((p as any)?.join_intent) ? ((p as any).join_intent as string[]) : [];
        const next = arr.filter((x) => (INTENTS as readonly string[]).includes(x)) as Intent[];
        if (!cancelled) setSelected(next);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function next() {
    if (selected.length === 0) {
      Alert.alert('Required', 'Select at least one option.');
      return;
    }

    setLoading(true);
    try {
      await updateMyProfile({ join_intent: selected } as any);
      router.push('/(onboarding)/confirm');
    } catch (e: any) {
      Alert.alert('Could not continue', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Why are you here?</Text>
      <Text style={styles.sub}>This helps us recommend rooms and discussions.</Text>

      <View style={{ marginTop: 14 }}>
        {INTENTS.map((opt) => {
          const on = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              onPress={() => setSelected((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))}
              style={[styles.option, on && styles.optionOn]}
            >
              <Text style={[styles.optionText, on && styles.optionTextOn]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button title="Review Profile" onPress={next} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 20, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 10, color: '#3A332A', lineHeight: 20 },
  option: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  optionOn: { backgroundColor: '#1E1A14', borderColor: '#1E1A14' },
  optionText: { color: '#1E1A14', fontWeight: '800' },
  optionTextOn: { color: '#FFFFFF', fontWeight: '900' },
});
