import { useState } from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { router } from 'expo-router';

export default function RequestAccess() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleIndustry, setRoleIndustry] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        Alert.alert('Request submitted', 'Mock mode: request saved locally (no backend).');
        router.back();
        return;
      }

      const { error } = await supabase.from('access_requests').insert({
        name,
        email,
        role_industry: roleIndustry,
        why_join: whyJoin,
        referral: referral || null,
      });
      if (error) throw error;

      Alert.alert('Request submitted', 'If approved, you will receive an invitation.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.h1}>Request Access</Text>
      <Text style={styles.sub}>Keep it brief. This is reviewed.</Text>

      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Input label="Role / Industry" value={roleIndustry} onChangeText={setRoleIndustry} />
      <Input label="Why join?" value={whyJoin} onChangeText={setWhyJoin} />
      <Input label="Referral (optional)" value={referral} onChangeText={setReferral} />

      <Button
        title="Submit Request"
        onPress={submit}
        loading={loading}
        disabled={!name || !email || !roleIndustry || !whyJoin}
      />
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 30, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 8, color: '#6B6257' },
});
