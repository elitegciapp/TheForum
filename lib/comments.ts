import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  author_username?: string;
  body: string;
  created_at: string;
  parent_id?: string | null;
  status: 'active' | 'removed';
};

const COMMENTS_KEY = 'mock_comments_v1';

function randomId() {
  return `cmt_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

async function readAll(): Promise<Comment[]> {
  const raw = await AsyncStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Comment[];
  } catch {
    return [];
  }
}

async function writeAll(comments: Comment[]) {
  await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

const MIN_COMMENT_CHARS = 20;

export async function listComments(postId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const viewerId = session?.user?.id ?? 'mock_user';

    const { getGovernanceState } = await import('./governanceStore');
    const { evaluateShadow, shouldShowAuthorContent } = await import('./governance');
    const { getRoomShadowLevel } = await import('./moderation');
    const { fetchPostById } = await import('./posts');

    const viewerGov = await getGovernanceState(viewerId);

    const post = await fetchPostById(postId);
    if (!post) return [];

    const all = await readAll();
    const active = all
      .filter((c) => c.status === 'active')
      .filter((c) => c.post_id === postId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 300);

    const visible: Comment[] = [];
    for (const c of active) {
      let authorShadowLevel: any = null;
      try {
        const authorGov = await getGovernanceState(c.author_id);
        const roomShadow = await getRoomShadowLevel(post.room_id ?? 'general', c.author_id);
        if (authorGov.deletedAt) {
          authorShadowLevel = 'hard';
        } else {
          const globalLevel = evaluateShadow({ shadowLevel: authorGov.shadowLevel, shadowUntil: authorGov.shadowUntil });
          // Worst-of: room shadow can only further reduce visibility.
          authorShadowLevel = roomShadow ?? globalLevel;
          if (globalLevel === 'hard' || roomShadow === 'hard') authorShadowLevel = 'hard';
          else if (globalLevel === 'medium' || roomShadow === 'medium') authorShadowLevel = 'medium';
          else if (globalLevel === 'soft' || roomShadow === 'soft') authorShadowLevel = 'soft';
        }
      } catch {
        authorShadowLevel = null;
      }

      const ok = shouldShowAuthorContent({
        viewerId,
        viewerTrust: viewerGov.trustScore,
        viewerIsModerator: false,
        authorId: c.author_id,
        authorShadowLevel,
        postId: c.id,
      });

      if (ok) visible.push(c);
    }

    return visible;
  }

  // Supabase mode can be implemented later.
  return [];
}

export async function createComment(params: { postId: string; body: string; parentId?: string | null }) {
  const body = (params.body ?? '').trim();
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const authorId = session?.user?.id ?? 'mock_user';

    const { getSession } = await import('./session');
    const { getMyProfile } = await import('./profiles');
    const { getGovernanceState } = await import('./governanceStore');
    const { computeCapabilities } = await import('./governance');
    const { fetchPostById } = await import('./posts');
    const { getRoom } = await import('./roomsStore');
    const { canCommentInRoom } = await import('./rooms');
    const { enforceSlowMode, recordSlowModeAction } = await import('./slowModeStore');

    const localSession = await getSession();
    const isAdmin = localSession?.role === 'admin';

    if (!isAdmin && body.length < MIN_COMMENT_CHARS) {
      throw new Error('Action not permitted');
    }

    const post = await fetchPostById(params.postId);
    if (!post || post.status !== 'active') throw new Error('Action not permitted');
    if (post.locked && !isAdmin) throw new Error('Action not permitted');

    const roomId = post.room_id ?? 'general';
    const room = (await getRoom(roomId)) ?? (await getRoom('general'))!;

    const g = await getGovernanceState(authorId);
    const caps = computeCapabilities(g.trustScore);

    if (!isAdmin && g.deletedAt) throw new Error('Action not permitted');
    if (!isAdmin && (!caps.canComment || !canCommentInRoom(g.trustScore, room))) {
      throw new Error('Action not permitted');
    }

    const roomSlow = room.slowModeSeconds ?? null;
    const threadSlow = post.thread_slow_mode_seconds ?? null;

    if (!isAdmin) {
      await enforceSlowMode({ scopeKey: `comment_room:${authorId}:${roomId}`, seconds: roomSlow });
      await enforceSlowMode({ scopeKey: `comment_thread:${authorId}:${post.id}`, seconds: threadSlow });
    }

    const nowIso = new Date().toISOString();
    const c: Comment = {
      id: randomId(),
      post_id: post.id,
      author_id: authorId,
      author_username: (await getMyProfile())?.display_name ?? (await getMyProfile())?.username ?? undefined,
      body,
      created_at: nowIso,
      parent_id: params.parentId ?? null,
      status: 'active',
    };

    const prev = await readAll();
    await writeAll([c, ...prev].slice(0, 2000));

    if (!isAdmin) {
      await recordSlowModeAction(`comment_room:${authorId}:${roomId}`, nowIso);
      await recordSlowModeAction(`comment_thread:${authorId}:${post.id}`, nowIso);
    }

    return c;
  }

  // Supabase mode can be implemented later.
  throw new Error('Not implemented');
}

export async function clearComments() {
  await AsyncStorage.removeItem(COMMENTS_KEY);
}
