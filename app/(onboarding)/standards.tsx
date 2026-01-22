import { useState } from 'react';
import { Alert, Text, StyleSheet, Pressable, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { acceptStandards } from '../../lib/profiles';

export default function Standards() {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enter() {
    if (!ok) {
      Alert.alert('Required', 'Confirm you understand the participation standards.');
      return;
    }
    setLoading(true);
    try {
      await acceptStandards();
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.h1}>Participation Standards</Text>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.b}>• Not a dating platform: no romantic solicitation, flirtation, innuendo, or “DM me”.</Text>
        <Text style={styles.b}>• No politics: no parties, candidates, policy advocacy, or culture-war framing.</Text>
        <Text style={styles.b}>• Professional identity only: one account per person; no burner accounts.</Text>
        <Text style={styles.b}>• No audience farming: no link dumping or empty self-promotion.</Text>
        <Text style={styles.b}>• Respect time density: write with clarity; low-density posts are removed.</Text>
        <Text style={styles.b}>• No screenshot circumvention: no leaks, paraphrases, or transcripts of private threads.</Text>
        <Text style={styles.b}>• Moderation is final: no public disputes or meta threads about rules.</Text>
        <Text style={styles.b}>• No recruiting without consent: no pitching, cold DMs, or unsolicited hiring posts.</Text>
        <Text style={styles.b}>• You are the standard: repeated low-quality contributions can lead to removal.</Text>
      </View>

      <Pressable onPress={() => setOk((v: boolean) => !v)} style={styles.checkRow}>
        <View style={[styles.checkbox, ok && styles.checkboxOn]} />
        <Text style={styles.checkText}>I commit to these standards</Text>
      </Pressable>

      <Button title="Enter The Forum" onPress={enter} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  b: { marginTop: 10, color: '#3A332A', fontWeight: '600' },
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
