import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getMyEnforcement } from '../../lib/enforcement';
import { getMyProfile } from '../../lib/profiles';
import { canRequestRoom } from '../../lib/rooms';
import { submitRoomRequest } from '../../lib/roomsStore';
import { getSession } from '../../lib/session';

const MIN_ACCOUNT_AGE_DAYS = 7;

function daysSince(iso: string | null | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return Number.POSITIVE_INFINITY;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export default function RequestRoom() {
  const [proposedName, setProposedName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [differs, setDiffers] = useState('');
  const [exampleTopics, setExampleTopics] = useState('');
  const [suggestedModerators, setSuggestedModerators] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return !!proposedName.trim() && !!purpose.trim() && !!differs.trim() && !!exampleTopics.trim();
  }, [proposedName, purpose, differs, exampleTopics]);

  async function submit() {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const localSession = await getSession();
      const isAdmin = localSession?.role === 'admin';

      const enforcement = await getMyEnforcement();
      const profile = await getMyProfile();

      const accountAgeDays = daysSince((profile as any)?.created_at);
      const ok = isAdmin
        ? true
        : canRequestRoom({
            trustScore: enforcement.trustScore,
            shadowLevel: enforcement.shadowLevel,
            accountAgeDays,
            minAccountAgeDays: MIN_ACCOUNT_AGE_DAYS,
          });

      if (!ok) {
        // Do not disclose thresholds or enforcement details.
        Alert.alert('Not permitted', 'You are not eligible to request a room at this time.');
        return;
      }

      await submitRoomRequest({
        requestedBy: userId,
        proposedName,
        purpose,
        differs,
        exampleTopics,
        suggestedModerators: suggestedModerators.trim() || undefined,
      });

      Alert.alert('Submitted', 'Your request has been received.');
      router.replace('/(app)/rooms');
    } catch (e: any) {
      Alert.alert('Could not submit', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Request a Room</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>Propose a focused topic for admin review.</Text>

      <Input label="Proposed room name" value={proposedName} onChangeText={setProposedName} placeholder="e.g., Strategy" />
      <Input label="One-sentence purpose" value={purpose} onChangeText={setPurpose} placeholder="What is this room for?" />
      <Input
        label="How it differs" 
        value={differs}
        onChangeText={setDiffers}
        placeholder="How is this distinct from existing rooms?"
      />
      <Input
        label="Example topics" 
        value={exampleTopics}
        onChangeText={setExampleTopics}
        placeholder="3–5 example discussion topics"
      />
      <Input
        label="Suggested moderators (optional)"
        value={suggestedModerators}
        onChangeText={setSuggestedModerators}
        placeholder="Names or usernames"
      />

      <View style={{ marginTop: 12 }}>
        <Button title="Submit Request" onPress={submit} loading={loading} disabled={!canSubmit} />
      </View>

      <Text style={styles.foot}>Requests are reviewed by admin. Creation is not automatic.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginTop: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: 22, fontWeight: '800', color: '#1E1A14' },
  link: { color: '#6B4E00', fontWeight: '800' },
  note: { color: '#6B6257', lineHeight: 18 },
  foot: { marginTop: 16, color: '#6B6257', lineHeight: 18 },
});
