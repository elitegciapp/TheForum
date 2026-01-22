import { isSupabaseConfigured, supabase } from './supabase';

export type AppConfig = {
  standards_version: number;
};

export async function getAppConfig(): Promise<AppConfig> {
  // Mock mode: keep UX unblocked.
  if (!isSupabaseConfigured) return { standards_version: 1 };

  const { data, error } = await supabase
    .from('app_config')
    .select('standards_version')
    .eq('id', true)
    .maybeSingle();

  if (error) throw error;
  return { standards_version: data?.standards_version ?? 1 };
}
