import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { PostCard } from '../../../components/PostCard';
import { fetchPostById } from '../../../lib/posts';
import { createComment, listComments, type Comment } from '../../../lib/comments';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { getSession } from '../../../lib/session';
import { removePost, setPostLocked } from '../../../lib/moderation';

export default function ThreadScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const postId = (params.id ?? '').toString();

  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const mentionQuery = useMemo(() => {
    const t = body ?? '';
    // Minimal mention detection: only when the user is typing at the end.
    // Matches: "@" or "@sam" or " hello @sam".
    const m = t.match(/(^|\s)@([A-Za-z0-9_]{0,24})$/);
    if (!m) return null;
    return (m[2] ?? '').toLowerCase();
  }, [body]);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery == null) return [] as string[];

    const names: string[] = [];
    const push = (u?: string) => {
      const v = (u ?? '').trim();
      if (!v) return;
      if (!names.some((x) => x.toLowerCase() === v.toLowerCase())) names.push(v);
    };

    push(post?.author_username);
    for (const c of comments) push(c.author_username);

    const q = mentionQuery;
    const filtered = q ? names.filter((n) => n.toLowerCase().startsWith(q)) : names;
    return filtered.slice(0, 8);
  }, [mentionQuery, post?.author_username, comments]);

  const commentById = useMemo(() => {
    const map = new Map<string, Comment>();
    for (const c of comments) map.set(c.id, c);
    return map;
  }, [comments]);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const p = await fetchPostById(postId);
      setPost(p);
      const c = await listComments(postId);
      setComments(c);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession();
        if (!cancelled) setIsAdmin(s?.role === 'admin');
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    if (!postId) return;
    if (!body.trim()) return;
    setSending(true);
    try {
      await createComment({ postId, body: body.trim(), parentId: replyTo?.id ?? null });
      setBody('');
      setReplyTo(null);
      await load();
    } catch (e: any) {
      Alert.alert('Could not reply', e?.message ?? 'Unknown error');
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.h1}>Thread</Text>
        <View style={{ width: 40 }} />
      </View>

      {post && <PostCard post={post} onReport={() => {}} disableNavigate />}

      {post && isAdmin && post.status === 'active' && (
        <View style={styles.adminRow}>
          <Pressable
            onPress={async () => {
              try {
                const s = await getSession();
                if (!s?.userId) throw new Error('Action not permitted');
                await setPostLocked({
                  actorId: s.userId,
                  postId: post.id,
                  roomId: post.room_id ?? 'general',
                  locked: !post.locked,
                });
                await load();
              } catch (e: any) {
                Alert.alert('Could not update', e?.message ?? 'Unknown error');
              }
            }}
          >
            <Text style={styles.adminAction}>{post.locked ? 'Unlock' : 'Lock'}</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              try {
                const s = await getSession();
                if (!s?.userId) throw new Error('Action not permitted');
                await removePost({
                  actorId: s.userId,
                  postId: post.id,
                  roomId: post.room_id ?? 'general',
                  targetUserId: post.author_id,
                });
                router.back();
              } catch (e: any) {
                Alert.alert('Could not remove', e?.message ?? 'Unknown error');
              }
            }}
          >
            <Text style={styles.adminDanger}>Remove</Text>
          </Pressable>
        </View>
      )}

      {post && post.status === 'active' && (!post.locked || isAdmin) && (
        <View style={styles.replyCard}>
          {!!replyTo && (
            <View style={styles.replyingRow}>
              <Text style={styles.replyingText}>
                Replying to {replyTo.author_username ? `@${replyTo.author_username}` : 'member'}
              </Text>
              <Pressable
                onPress={() => {
                  setReplyTo(null);
                }}
              >
                <Text style={styles.replyCancel}>Cancel</Text>
              </Pressable>
            </View>
          )}
          <Input
            label={replyTo ? 'Reply' : 'Reply'}
            value={body}
            onChangeText={setBody}
            placeholder="Write a thoughtful reply…"
            autoCapitalize="sentences"
          />

          {mentionSuggestions.length > 0 && (
            <View style={styles.mentionsBox}>
              {mentionSuggestions.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    setBody((prev) => {
                      const t = prev ?? '';
                      return t.replace(/(^|\s)@([A-Za-z0-9_]{0,24})$/, `$1@${u} `);
                    });
                  }}
                  style={styles.mentionRow}
                >
                  <Text style={styles.mentionText}>@{u}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Button title="Post Reply" onPress={submit} loading={sending} disabled={!body.trim()} />
        </View>
      )}

      {post && post.status === 'active' && post.locked && !isAdmin && (
        <Text style={styles.lockedNote}>Replies are currently unavailable.</Text>
      )}

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Pressable onPress={() => router.push(`/(app)/profile/${item.author_id}`)}>
              <Text style={styles.commentAuthor}>
                {(item.author_username ?? 'Member').toString()}
              </Text>
            </Pressable>
            {item.parent_id ? (
              <Text style={styles.replyMeta}>
                Reply to {commentById.get(item.parent_id)?.author_username ? `@${commentById.get(item.parent_id)!.author_username}` : 'comment'}
              </Text>
            ) : null}
            <Text style={styles.commentBody}>{item.body}</Text>
            <Text style={styles.commentMeta}>{new Date(item.created_at).toLocaleString()}</Text>

            <View style={styles.commentActions}>
              <Pressable
                onPress={() => {
                  setReplyTo(item);
                  const username = item.author_username ? `@${item.author_username}` : null;
                  if (username) {
                    setBody((prev) => (prev.trim() ? prev : `${username} `));
                  }
                }}
              >
                <Text style={styles.commentReply}>Reply</Text>
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  h1: { fontSize: 18, fontWeight: '900', color: '#1E1A14' },
  link: { color: '#6B4E00', fontWeight: '800' },
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginBottom: 10,
  },
  adminAction: { color: '#6B4E00', fontWeight: '800' },
  adminDanger: { color: '#8B1A1A', fontWeight: '900' },
  replyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
    marginBottom: 12,
  },
  replyingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  replyingText: { color: '#6B6257', fontWeight: '800' },
  replyCancel: { color: '#6B4E00', fontWeight: '900' },
  lockedNote: { marginTop: 2, marginBottom: 12, color: '#6B6257', fontWeight: '700' },
  comment: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
    marginBottom: 12,
  },
  commentAuthor: { color: '#3A332A', fontWeight: '900', marginBottom: 6 },
  replyMeta: { color: '#6B6257', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  commentBody: { color: '#1E1A14', lineHeight: 20 },
  commentMeta: { marginTop: 8, color: '#6B6257', fontSize: 12 },
  commentActions: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  commentReply: { color: '#6B4E00', fontWeight: '900' },

  mentionsBox: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5DED3',
    overflow: 'hidden',
  },
  mentionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EADF',
  },
  mentionText: { color: '#1E1A14', fontWeight: '800' },
});
