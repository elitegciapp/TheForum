import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { PostCard } from '../../../components/PostCard';
import { PostComposer } from '../../../components/PostComposer';
import { fetchPosts } from '../../../lib/posts';
import { getRoom } from '../../../lib/roomsStore';
import type { Room } from '../../../lib/rooms';

export default function RoomScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = (params.id ?? 'general').toString();

  const [room, setRoom] = useState<Room | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getRoom(roomId);
      setRoom(r);

      const p = await fetchPosts(roomId);
      setPosts(p);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>{room?.name ?? 'Room'}</Text>
          <Text style={styles.sub}>{room?.description ?? ''}</Text>
        </View>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>

      <PostComposer roomId={roomId} onPosted={load} />

      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }: { item: any }) => <PostCard post={item} onReport={() => {}} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: 20, fontWeight: '900', color: '#1E1A14' },
  sub: { marginTop: 2, color: '#6B6257', fontWeight: '700', maxWidth: 260 },
  link: { color: '#6B4E00', fontWeight: '800' },
});
