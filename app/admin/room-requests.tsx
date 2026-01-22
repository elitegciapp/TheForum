import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { listRoomRequests, approveRoomRequest, setRoomRequestStatus, listRooms } from '../../lib/roomsStore';
import type { RoomRequest, Room } from '../../lib/rooms';
import { deriveRankFromTrustScore } from '../../lib/rank';

function words(s: string) {
  return new Set(
    (s ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4)
  );
}

function overlapScore(a: string, b: string) {
  const A = words(a);
  const B = words(b);
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n;
}

export default function RoomRequests() {
  const [reqs, setReqs] = useState<RoomRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => reqs.find((r) => r.id === selectedId) ?? null, [reqs, selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, rm] = await Promise.all([listRoomRequests(), listRooms()]);
      setReqs(r);
      setRooms(rm);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setEditName(selected.proposedName);
    setEditDesc(selected.purpose);
    setAdminNotes(selected.adminNotes ?? '');
  }, [selected?.id]);

  async function approve(withEdits: boolean) {
    if (!selected) return;
    setLoading(true);
    try {
      const name = (withEdits ? editName : selected.proposedName).trim();
      const description = (withEdits ? editDesc : selected.purpose).trim();
      if (!name || !description) throw new Error('Missing room name or description');

      await approveRoomRequest({ requestId: selected.id, name, description, adminNotes: adminNotes.trim() || undefined });
      await load();
      setSelectedId(null);
    } catch (e: any) {
      Alert.alert('Could not approve', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(status: 'revision' | 'denied' | 'archived') {
    if (!selected) return;
    setLoading(true);
    try {
      await setRoomRequestStatus({
        requestId: selected.id,
        status,
        adminNotes: adminNotes.trim() || undefined,
      });
      await load();
      setSelectedId(null);
    } catch (e: any) {
      Alert.alert('Could not update', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const overlap = useMemo(() => {
    if (!selected) return [] as { room: Room; score: number }[];
    const needle = `${selected.proposedName} ${selected.purpose} ${selected.exampleTopics}`;
    return rooms
      .map((room) => ({ room, score: overlapScore(needle, `${room.name} ${room.description}`) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [selected?.id, rooms]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selected) return;
      try {
        // Local-only admin review helpers. In backend mode this should come from server.
        const { getGovernanceState } = await import('../../lib/governanceStore');
        const g = await getGovernanceState(selected.requestedBy);
        const rank = deriveRankFromTrustScore(g.trustScore);
        if (cancelled) return;
        // Store in adminNotes prefix? Keep simple: no extra state; render directly via closure.
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

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

      <Text style={styles.h1}>Room Requests</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.section}>Queue</Text>
        {reqs.length === 0 && <Text style={styles.muted}>No requests yet.</Text>}
        {reqs.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setSelectedId((prev) => (prev === r.id ? null : r.id))}
            style={[styles.card, selectedId === r.id && styles.cardOn]}
          >
            <Text style={styles.title}>{r.proposedName}</Text>
            <Text style={styles.muted}>Status: {r.status}</Text>
            <Text style={styles.muted}>Requested: {new Date(r.createdAt).toLocaleString()}</Text>

            {selectedId === r.id && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Purpose</Text>
                <Text style={styles.body}>{r.purpose}</Text>

                <Text style={styles.label}>How it differs</Text>
                <Text style={styles.body}>{r.differs}</Text>

                <Text style={styles.label}>Example topics</Text>
                <Text style={styles.body}>{r.exampleTopics}</Text>

                {!!r.suggestedModerators && (
                  <>
                    <Text style={styles.label}>Suggested moderators</Text>
                    <Text style={styles.body}>{r.suggestedModerators}</Text>
                  </>
                )}

                <Text style={styles.label}>Requester</Text>
                <RequesterBlock userId={r.requestedBy} />

                <Text style={styles.label}>Potential overlap</Text>
                {overlap.length === 0 ? (
                  <Text style={styles.muted}>No obvious overlaps.</Text>
                ) : (
                  overlap.map((o) => (
                    <Text key={o.room.id} style={styles.muted}>
                      {o.room.name}
                    </Text>
                  ))
                )}

                <Input label="Approve name" value={editName} onChangeText={setEditName} />
                <Input label="Approve description" value={editDesc} onChangeText={setEditDesc} />
                <Input label="Admin notes (optional)" value={adminNotes} onChangeText={setAdminNotes} />

                <View style={{ marginTop: 10 }}>
                  <Button title="Approve" onPress={() => approve(false)} loading={loading} />
                  <Button title="Approve with edits" variant="secondary" onPress={() => approve(true)} loading={loading} />
                  <Button title="Request revision" variant="secondary" onPress={() => setStatus('revision')} loading={loading} />
                  <Button title="Deny" variant="secondary" onPress={() => setStatus('denied')} loading={loading} />
                  <Button title="Archive" variant="secondary" onPress={() => setStatus('archived')} loading={loading} />
                </View>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

function RequesterBlock(props: { userId: string }) {
  const { userId } = props;
  const [info, setInfo] = useState<{ trust: number; rank: string; posts30d: number; lastPostAt: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getGovernanceState } = await import('../../lib/governanceStore');
        const { deriveRankFromTrustScore } = await import('../../lib/rank');
        const { fetchPosts } = await import('../../lib/posts');

        const g = await getGovernanceState(userId);
        const rank = deriveRankFromTrustScore(g.trustScore);

        // Posting history summary (local/mock only): count in last 30 days.
        const all = await fetchPosts('general');
        const now = Date.now();
        const mine = (all ?? []).filter((p: any) => p.author_id === userId);
        const recent = mine.filter((p: any) => now - new Date(p.created_at).getTime() < 30 * 24 * 60 * 60 * 1000);
        const last = mine[0]?.created_at ?? null;

        if (!cancelled) setInfo({ trust: g.trustScore, rank, posts30d: recent.length, lastPostAt: last });
      } catch {
        if (!cancelled) setInfo(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!info) {
    return <Text style={stylesInline.muted}>User: {userId}</Text>;
  }

  return (
    <View>
      <Text style={stylesInline.body}>User: {userId}</Text>
      <Text style={stylesInline.muted}>Trust {info.trust} · Rank {info.rank}</Text>
      <Text style={stylesInline.muted}>Posts (30d): {info.posts30d} · Last post: {info.lastPostAt ? new Date(info.lastPostAt).toLocaleDateString() : 'n/a'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 14, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  section: { marginTop: 6, marginBottom: 10, color: '#6B6257', fontWeight: '800' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5DED3',
    padding: 14,
    marginBottom: 12,
  },
  cardOn: { borderColor: '#D8D1C7' },
  title: { fontSize: 16, fontWeight: '800', color: '#1E1A14' },
  label: { marginTop: 10, color: '#3A332A', fontWeight: '700' },
  body: { marginTop: 4, color: '#1E1A14', lineHeight: 18 },
  muted: { marginTop: 4, color: '#6B6257' },
});

const stylesInline = StyleSheet.create({
  body: { color: '#1E1A14', lineHeight: 18 },
  muted: { color: '#6B6257', marginTop: 2 },
});
