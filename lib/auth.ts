import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function deleteAccount() {
  if (!isSupabaseConfigured) {
    // Local-only delete: clear mock session and local content.
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove(['mock_profile_v1', 'mock_profiles_v1', 'mock_posts_v1']);
    const { clearGovernanceForAllUsers } = await import('./governanceStore');
    await clearGovernanceForAllUsers();
    return;
  }

  // Deletes the authenticated user via a Supabase Edge Function (service role).
  // You must deploy the function "delete-account" first.
  const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;

  if (data?.cleanupErrors?.length) {
    throw new Error(`Deleted account, but cleanup had warnings: ${data.cleanupErrors.join(' | ')}`);
  }
}
