import { supabase, isSupabaseConfigured } from './supabase';

export async function uploadImageAsync(params: {
  userId: string;
  localUri: string;
  contentType: string;
}) {
  const { userId, localUri, contentType } = params;

  if (!isSupabaseConfigured) {
    // Local-only: return a URI that React Native can render.
    return localUri;
  }

  const res = await fetch(localUri);
  const blob = await res.blob();

  const fileExt = contentType.includes('png') ? 'png' : 'jpg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage.from('post-images').upload(fileName, blob, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
  return data.publicUrl;
}
