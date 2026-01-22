import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminCard from '../../components/AdminCard';
import { generateAccessCode, listAccessCodes, revokeAccessCode, type AccessCodeRole } from '../../lib/accessCodes';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function Invites() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAccessCodes();
      setCodes(list);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(role: AccessCodeRole) {
    setLoading(true);
    try {
      const uses = role === 'admin' ? 1 : 10;
      await generateAccessCode({ role, uses });
      await load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function revoke(code: string) {
    Alert.alert('Revoke Code', 'Revoke this access code? It will no longer work for new sessions.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await revokeAccessCode(code);
            await load();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Unknown error');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <Button
        title="Back"
        variant="secondary"
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/admin');
        }}
      />
      <AdminCard title="Access Codes" subtitle="Create, revoke, and manage private access" />

      <View style={{ marginTop: 10 }}>
        <Pressable onPress={() => create('user')} style={styles.action} disabled={loading}>
          <Text style={styles.actionText}>Generate User Access Code</Text>
        </Pressable>
        <Pressable onPress={() => create('admin')} style={styles.action} disabled={loading}>
          <Text style={styles.actionText}>Generate Admin Access Code</Text>
        </Pressable>
      </View>

      <ScrollView style={{ marginTop: 14 }} contentContainerStyle={{ paddingBottom: 18 }}>
        {codes.map((c) => (
          <Pressable key={c.code} onPress={() => revoke(c.code)} disabled={loading}>
            <AdminCard
              title={c.code}
              subtitle={`Role: ${c.role} · Uses remaining: ${c.usesRemaining}${c.revoked ? ' · Revoked' : ''}`}
              value="Revoke"
            />
          </Pressable>
        ))}
        {codes.length === 0 && <Text style={styles.empty}>No codes.</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5DED3',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  actionText: { color: '#1E1A14', fontWeight: '800' },
  empty: { marginTop: 10, color: '#6B6257' },
});
