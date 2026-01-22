import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { getProfileById } from '../../../lib/profiles';

export default function PublicProfile() {
  const params = useLocalSearchParams<{ id: string }>();
  const userId = (params.id ?? '').toString();

  const [p, setP] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prof = await getProfileById(userId);
        if (!cancelled) setP(prof);
      } catch (e: any) {
        if (!cancelled) {
          setP(null);
          Alert.alert('Error', e?.message ?? 'Unknown error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = (p?.display_name ?? p?.username ?? 'Member').toString();
  const profession = (p?.profession ?? '').toString();
  const industry = (p?.industry ?? '').toString();
  const createdAt = p?.created_at ? new Date(p.created_at).toLocaleDateString() : '—';

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Profile</Text>

      <View style={styles.card}>
        <Row label="Display Name" value={displayName} />
        <Row label="Profession" value={profession || '—'} />
        <Row label="Industry" value={industry || '—'} />
        <Row label="Join Date" value={createdAt} />
        <Row label="Trust Score" value="(future)" />
        <Row label="Badges" value="(future)" />
        <Row label="Rooms Moderated" value="(future)" />
      </View>
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
  h1: { marginTop: 20, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
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
