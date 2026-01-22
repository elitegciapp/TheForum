import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { Post } from '../lib/posts';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { deriveRankFromTrustScore } from '../lib/rank';
import { router } from 'expo-router';
import { isPostSavedByMe, toggleSavePost } from '../lib/posts';

export function PostCard(props: { post: Post; onReport: (postId: string) => void; disableNavigate?: boolean }) {
  const { post, onReport } = props;
  const imgs = (post.post_images ?? []).sort((a, b) => a.sort_order - b.sort_order);

  const [rank, setRank] = useState<string>('Member');
  const [saved, setSaved] = useState(false);

  const displayName = useMemo(() => {
    if (post.author_username) return post.author_username;
    const id = post.author_id ?? '';
    if (!id) return 'Member';
    return id.length > 10 ? `${id.slice(0, 6)}…` : id;
  }, [post.author_id, post.author_username]);

  useEffect(() => {
    let cancelled = false;

    async function loadRank() {
      try {
        // Step 4 currently reads from Step 3 governance.
        // In mock mode we have local trust; in Supabase mode rank can be added later.
        if (!isSupabaseConfigured) {
          const session = (await supabase.auth.getSession()).data.session;
          const viewerId = session?.user?.id ?? 'mock_user';
          const { getGovernanceState } = await import('../lib/governanceStore');

          const g = await getGovernanceState(post.author_id || viewerId);
          const r = deriveRankFromTrustScore(g.trustScore);
          if (!cancelled) setRank(r);
          return;
        }

        if (!cancelled) setRank('Member');
      } catch {
        if (!cancelled) setRank('Member');
      }
    }

    loadRank();
    return () => {
      cancelled = true;
    };
  }, [post.author_id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isSupabaseConfigured) {
          if (!cancelled) setSaved(false);
          return;
        }
        const s = await isPostSavedByMe(post.id);
        if (!cancelled) setSaved(s);
      } catch {
        if (!cancelled) setSaved(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function onToggleSave() {
    try {
      const res = await toggleSavePost(post.id);
      setSaved(res.saved);
    } catch {
      // Keep quiet.
    }
  }

  const canNavigate = !props.disableNavigate;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.push(`/(app)/profile/${post.author_id}`)}>
          <Text style={styles.authorLine}>
            {displayName} <Text style={styles.rank}>· {rank}</Text>
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={onToggleSave}>
            <Text style={styles.save}>{saved ? 'Saved' : 'Save'}</Text>
          </Pressable>
          <Pressable onPress={() => onReport(post.id)}>
            <Text style={styles.report}>Report</Text>
          </Pressable>
        </View>
      </View>

      <Pressable disabled={!canNavigate} onPress={() => router.push(`/(app)/post/${post.id}`)}>
        <Text style={styles.date}>{new Date(post.created_at).toLocaleString()}</Text>

        <Text style={styles.postTitle}>{(post.title ?? '').trim() || 'Discussion'}</Text>
        <Text style={styles.body}>{post.body}</Text>
      </Pressable>

      {imgs.length > 0 && (
        <Pressable disabled={!canNavigate} onPress={() => router.push(`/(app)/post/${post.id}`)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {imgs.map((img) => (
              <Image key={img.image_url} source={{ uri: img.image_url }} style={styles.image} />
            ))}
          </ScrollView>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
    marginBottom: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorLine: { color: '#3A332A', fontSize: 13, fontWeight: '700' },
  rank: { color: '#6B6257', fontSize: 13, fontWeight: '700' },
  date: { color: '#6B6257', fontSize: 12 },
  report: { color: '#6B4E00', fontWeight: '700' },
  save: { color: '#6B6257', fontWeight: '700' },
  postTitle: { marginTop: 10, fontSize: 16, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_600SemiBold' },
  body: { marginTop: 10, fontSize: 15, color: '#1E1A14', lineHeight: 20 },
  image: { width: 200, height: 200, borderRadius: 14, marginRight: 10, backgroundColor: '#EEE' },
});
