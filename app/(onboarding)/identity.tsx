import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { getMyProfile, type ProfessionOption, updateMyProfile } from '../../lib/profiles';

const PROFESSION_OPTIONS: ProfessionOption[] = [
  'Business Owner',
  'Entrepreneur',
  'Investor',
  'Real Estate Professional',
  'Attorney',
  'Finance / Banking',
  'Technology',
  'Healthcare',
  'Consulting',
  'Marketing / Media',
  'Other',
];

export default function Identity() {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  // Screen 1 only collects identity fields.

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p || cancelled) return;
        setFirstName((p.first_name ?? '').toString());
        setLastName((p.last_name ?? '').toString());
        setDisplayName((p.display_name ?? '').toString());
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Default display name to First + Last if the user hasn't started typing it.
    const fn = firstName.trim();
    const ln = lastName.trim();
    const derived = [fn, ln].filter(Boolean).join(' ').trim();
    if (!displayName.trim() && derived) setDisplayName(derived);
  }, [firstName, lastName]);

  async function next() {
    const fn = firstName.trim();
    const ln = lastName.trim();
    const dn = displayName.trim();
    if (!fn || !ln || !dn) {
      Alert.alert('Required', 'Please enter your first name, last name, and display name.');
      return;
    }

    setLoading(true);
    try {
      await updateMyProfile({
        first_name: fn,
        last_name: ln,
        display_name: dn,
      });
      router.push('/(onboarding)/profession');
    } catch (e: any) {
      Alert.alert('Could not continue', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.h1}>Welcome to The Forum</Text>
      <Text style={styles.sub}>
        Help us understand who you are. This keeps the community professional and high-quality.
      </Text>

      <Input label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" autoCapitalize="words" />
      <Input label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" autoCapitalize="words" />
      <Input label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Shown to other members" autoCapitalize="words" />

      <Button title="Continue" onPress={next} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 10, color: '#3A332A', lineHeight: 20 },
});
