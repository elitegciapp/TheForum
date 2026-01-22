import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';

export type Post = {
  id: string;
  author_id: string;
  author_username?: string;
  room_id?: string;
  title?: string;
  body: string;
  has_images: boolean;
  status: 'active' | 'removed';
  created_at: string;
  locked?: boolean;
  // Private quality signal (viewer-specific); used for internal ranking only.
  saves?: string[];

  // Step 7/8 moderation and slow mode.
  thread_slow_mode_seconds?: number | null;
  removed_at?: string | null;
  removed_by?: string | null;

  post_images?: { image_url: string; sort_order: number }[];
};

const MOCK_POSTS_KEY = 'mock_posts_v1';

async function getMockPosts(): Promise<Post[]> {
  const raw = await AsyncStorage.getItem(MOCK_POSTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function setMockPosts(posts: Post[]) {
  await AsyncStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
}

function randomId() {
  return `post_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const MIN_POST_BODY_CHARS = 80;

function normalizeTitle(title: unknown, fallbackBody: string) {
  const t = typeof title === 'string' ? title.trim() : '';
  if (t) return t;
  const b = (fallbackBody ?? '').trim();
  if (!b) return 'Discussion';
  return b.length > 60 ? `${b.slice(0, 60).trim()}…` : b;
}

function timeDecay(ageHours: number) {
  // Logarithmic decay: older posts gently decline.
  const h = Math.max(0, ageHours);
  return Math.log10(h + 2);
}

async function computeQualitySaves(params: { saverIds: string[]; authorId: string }) {
  const { getGovernanceState } = await import('./governanceStore');
  const saverIds = Array.from(new Set(params.saverIds)).slice(0, 50);
  let score = 0;
  for (const id of saverIds) {
    try {
      if (id === params.authorId) continue;
      const g = await getGovernanceState(id);
      const t = g.trustScore ?? 0;
      if (t >= 90) score += 2;
      else if (t >= 75) score += 1;
    } catch {
      // ignore
    }
  }
  return score;
}

async function feedScore(params: { post: Post }) {
  const { getGovernanceState } = await import('./governanceStore');
  const authorGov = await getGovernanceState(params.post.author_id);
  const authorTrust = authorGov.trustScore ?? 0;

  const qualitySaves = await computeQualitySaves({
    saverIds: params.post.saves ?? [],
    authorId: params.post.author_id,
  });

  const ageHours = (Date.now() - new Date(params.post.created_at).getTime()) / 3_600_000;
  const td = timeDecay(ageHours);

  return authorTrust * 0.4 + qualitySaves * 0.35 - td * 0.25;
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  if (!isSupabaseConfigured) {
    const posts = await getMockPosts();
    const p = posts.find((x) => x.id === postId) ?? null;
    if (!p) return null;
    return {
      ...p,
      title: normalizeTitle((p as any).title, p.body),
      locked: !!(p as any).locked,
      saves: Array.isArray((p as any).saves) ? (p as any).saves : [],
      thread_slow_mode_seconds:
        typeof (p as any).thread_slow_mode_seconds === 'number' || (p as any).thread_slow_mode_seconds == null
          ? (p as any).thread_slow_mode_seconds
          : null,
    } as Post;
  }

  // Supabase mode can be implemented later.
  return null;
}

export async function updatePost(postId: string, patch: Partial<Post>) {
  if (!isSupabaseConfigured) {
    const posts = await getMockPosts();
    const next = posts.map((p) => (p.id === postId ? { ...p, ...patch } : p));
    await setMockPosts(next);
    return;
  }

  throw new Error('Not implemented');
}

export async function fetchPosts(roomId?: string): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const viewerId = session?.user?.id ?? 'mock_user';

    const { getGovernanceState } = await import('./governanceStore');
    const { evaluateShadow, shouldShowAuthorContent } = await import('./governance');
    const { getRoomShadowLevel } = await import('./moderation');
    const viewerGov = await getGovernanceState(viewerId);

    const posts = await getMockPosts();

    const desiredRoom = roomId ?? 'general';

    const active = posts
      .filter((p) => p.status === 'active')
      .filter((p) => (p.room_id ?? 'general') === desiredRoom)
      .slice(0, 50);

    const visibleWithScore: { post: Post; score: number }[] = [];
    for (const raw of active) {
      const p: Post = {
        ...raw,
        title: normalizeTitle((raw as any).title, raw.body),
        locked: !!(raw as any).locked,
        saves: Array.isArray((raw as any).saves) ? (raw as any).saves : [],
        thread_slow_mode_seconds:
          typeof (raw as any).thread_slow_mode_seconds === 'number' || (raw as any).thread_slow_mode_seconds == null
            ? (raw as any).thread_slow_mode_seconds
            : null,
      };

      let authorShadowLevel: any = null;
      try {
        const authorGov = await getGovernanceState(p.author_id);
        const roomShadow = await getRoomShadowLevel(desiredRoom, p.author_id);
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
        authorId: p.author_id,
        authorShadowLevel,
        postId: p.id,
      });

      if (!ok) continue;

      const score = await feedScore({ post: p });
      visibleWithScore.push({ post: p, score });
    }

    return visibleWithScore
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime();
      })
      .slice(0, 50)
      .map((x) => x.post);
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*, post_images(image_url, sort_order)')
    .eq('status', 'active')
    // Room support will be added when backend is enabled.
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as any;
}

export async function createPost(params: {
  title: string;
  body: string;
  imageUrls: string[];
  roomId?: string;
}) {
  const { title, body, imageUrls, roomId } = params;

  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const authorId = session?.user?.id ?? 'mock_user';

    const { getGovernanceState } = await import('./governanceStore');
    const { computeCapabilities, isLinkLike } = await import('./governance');
    const { getMyProfile } = await import('./profiles');
    const { getRoom } = await import('./roomsStore');
    const { canPostInRoom, canPostLinksInRoom } = await import('./rooms');
    const { getSession } = await import('./session');
    const { enforceSlowMode, recordSlowModeAction } = await import('./slowModeStore');
    const g = await getGovernanceState(authorId);
    const caps = computeCapabilities(g.trustScore);

    const localSession = await getSession();
    const isAdmin = localSession?.role === 'admin';

    const targetRoomId = roomId ?? 'general';
    const room = (await getRoom(targetRoomId)) ?? (await getRoom('general'))!;

    const t = (title ?? '').trim();
    const b = (body ?? '').trim();
    if (!t) throw new Error('Action not permitted');
    if (!isAdmin && b.length < MIN_POST_BODY_CHARS) throw new Error('Action not permitted');

    if (!isAdmin && g.deletedAt) {
      throw new Error('Action not permitted');
    }
    if (!isAdmin && (!caps.canPost || !canPostInRoom(g.trustScore, room))) {
      throw new Error('Action not permitted');
    }
    if (!isAdmin && (!caps.canPostLinks || !canPostLinksInRoom(g.trustScore, room)) && isLinkLike(b)) {
      throw new Error('Action not permitted');
    }

    if (!isAdmin) {
      await enforceSlowMode({ scopeKey: `post_room:${authorId}:${room.id}`, seconds: room.slowModeSeconds ?? null });
    }

    const post: Post = {
      id: randomId(),
      author_id: authorId,
      author_username: (await getMyProfile())?.display_name ?? (await getMyProfile())?.username ?? undefined,
      room_id: targetRoomId,
      title: t,
      body: b,
      has_images: imageUrls.length > 0,
      status: 'active',
      created_at: new Date().toISOString(),
      locked: false,
      saves: [],
      thread_slow_mode_seconds: null,
      post_images: imageUrls.map((url, idx) => ({ image_url: url, sort_order: idx })),
    };

    const prev = await getMockPosts();
    await setMockPosts([post, ...prev]);

    if (!isAdmin) {
      await recordSlowModeAction(`post_room:${authorId}:${room.id}`, post.created_at);
    }
    return post as any;
  }

  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      body,
      has_images: imageUrls.length > 0,
    })
    .select('*')
    .single();

  if (postErr) throw postErr;

  if (imageUrls.length > 0) {
    const rows = imageUrls.map((url, idx) => ({
      post_id: post.id,
      image_url: url,
      sort_order: idx,
    }));

    const { error: imgErr } = await supabase.from('post_images').insert(rows);
    if (imgErr) throw imgErr;
  }

  return post as any;
}

export async function reportTarget(params: {
  reporterId: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  details?: string;
}) {
  if (!isSupabaseConfigured) {
    return;
  }

  const { reporterId, targetType, targetId, reason, details } = params;
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details ?? null,
  });
  if (error) throw error;
}

export async function isPostSavedByMe(postId: string) {
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const viewerId = session?.user?.id ?? 'mock_user';
    const p = await fetchPostById(postId);
    if (!p) return false;
    return (p.saves ?? []).includes(viewerId);
  }

  return false;
}

export async function toggleSavePost(postId: string) {
  if (!isSupabaseConfigured) {
    const session = (await supabase.auth.getSession()).data.session;
    const saverId = session?.user?.id ?? 'mock_user';

    const posts = await getMockPosts();
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx < 0) throw new Error('Action not permitted');

    const current = posts[idx] as any;
    const existing: string[] = Array.isArray(current.saves) ? current.saves : [];
    const has = existing.includes(saverId);
    const nextSaves = has ? existing.filter((x) => x !== saverId) : [...existing, saverId];

    posts[idx] = { ...current, saves: nextSaves };
    await setMockPosts(posts);

    // Trust integration: a save from a high-trust user is a low-noise signal.
    if (!has && current.author_id && current.author_id !== saverId) {
      try {
        const { getGovernanceState, recordQualitySaveReceived } = await import('./governanceStore');
        const saverGov = await getGovernanceState(saverId);
        await recordQualitySaveReceived({
          authorId: current.author_id,
          saverId,
          saverTrust: saverGov.trustScore,
          postId,
        });
      } catch {
        // ignore
      }
    }

    return { saved: !has };
  }

  throw new Error('Not implemented');
}
