import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { listRooms } from '../../lib/roomsStore';
import type { Room } from '../../lib/rooms';
import { router } from 'expo-router';

export default function Explore() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listRooms();
      setRooms(r);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.h1}>Explore</Text>
        <Text style={styles.sub}>Browse communities and jump in.</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/room/${item.id}`)} style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 10, marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 6, color: '#6B6257', lineHeight: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_600SemiBold' },
  desc: { marginTop: 6, color: '#6B6257', lineHeight: 18 },
});
