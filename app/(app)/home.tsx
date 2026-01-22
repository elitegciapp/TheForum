import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View, StyleSheet, Pressable } from 'react-native';
import { Screen } from '../../components/Screen';
import { PostComposer } from '../../components/PostComposer';
import { PostCard } from '../../components/PostCard';
import { fetchPosts } from '../../lib/posts';
import { router } from 'expo-router';
import { ReportSheet } from '../../components/ReportSheet';

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchPosts('general');
      setPosts(p);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openReport(postId: string) {
    setReportingId(postId);
    setReportOpen(true);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>General</Text>
          <Text style={styles.sub}>The Forum</Text>
        </View>
        <Pressable onPress={() => router.push('/(app)/settings')}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/(app)/rooms')} style={{ marginBottom: 8 }}>
        <Text style={styles.roomsLink}>Rooms</Text>
      </Pressable>

      <PostComposer roomId="general" onPosted={load} />

      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }: { item: any }) => <PostCard post={item} onReport={openReport} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={reportingId}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: 20, fontWeight: '900', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 2, color: '#6B6257', fontWeight: '700', fontFamily: 'PlayfairDisplay_400Regular' },
  link: { color: '#6B4E00', fontWeight: '800' },
  roomsLink: { color: '#6B4E00', fontWeight: '800' },
});
