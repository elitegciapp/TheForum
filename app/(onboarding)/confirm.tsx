import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { completeOnboarding, getMyProfile } from '../../lib/profiles';

export default function Confirm() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    setLoading(true);
    try {
      await completeOnboarding();
      router.replace('/(onboarding)/screenshot');
    } catch (e: any) {
      Alert.alert('Could not continue', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Confirm Your Profile</Text>
      <Text style={styles.sub}>
        This information is visible to other members and helps maintain accountability.
      </Text>

      <View style={styles.card}>
        <Row label="Display Name" value={(profile?.display_name ?? profile?.username ?? '').toString()} />
        <Row label="Profession" value={(profile?.profession ?? '').toString()} />
        <Row label="Industry" value={(profile?.industry ?? '')?.toString() || '—'} />
        <Row label="Primary Role" value={(profile?.primary_role ?? '')?.toString() || '—'} />
        <Row label="Years of Experience" value={(typeof profile?.years_experience === 'number' ? `${profile.years_experience}+` : '—') as any} />
        <Row label="Join intent" value={Array.isArray(profile?.join_intent) ? profile.join_intent.join(', ') : '—'} />
      </View>

      <Button title="Confirm and Enter The Forum" onPress={confirm} loading={loading} />
      <Button title="Edit" variant="secondary" onPress={() => router.replace('/(onboarding)/identity')} />
    </Screen>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{props.label}</Text>
      <Text style={styles.v}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 20, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 10, color: '#3A332A', lineHeight: 20 },
  card: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
  },
  row: { marginBottom: 10 },
  k: { color: '#6B6257', fontSize: 12, fontWeight: '800' },
  v: { marginTop: 4, color: '#1E1A14', fontWeight: '800' },
});
