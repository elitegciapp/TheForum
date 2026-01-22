import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { router } from 'expo-router';
import { listRooms } from '../../lib/roomsStore';
import type { Room } from '../../lib/rooms';

export default function Rooms() {
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
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Rooms</Text>
        <Pressable onPress={() => router.push('/(app)/request-room')}>
          <Text style={styles.link}>Request Room</Text>
        </Pressable>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(app)/room/${item.id}`)} style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </Pressable>
        )}
      />

      <Pressable onPress={() => router.back()} style={{ marginTop: 10 }}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginTop: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  link: { color: '#6B4E00', fontWeight: '800' },
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
