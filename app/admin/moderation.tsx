import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import AdminCard from '../../components/AdminCard';
import { listModeratorEvents, type ModeratorEvent } from '../../lib/moderation';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function ModerationLog() {
  const [events, setEvents] = useState<ModeratorEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const e = await listModeratorEvents();
      setEvents(e);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

      <AdminCard
        title="Moderation Log"
        subtitle="Internal caretaker actions (admin-only). Not visible to members."
      />

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <AdminCard
            title={`${item.action}`}
            subtitle={`Room: ${item.roomId}${item.targetPostId ? ` · Post: ${item.targetPostId}` : ''}`}
            value={new Date(item.createdAt).toLocaleString()}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No moderation events yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { marginTop: 12, color: '#6B6257' },
});
