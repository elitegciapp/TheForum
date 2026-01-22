Deploying this Edge Function

1) Install Supabase CLI
2) Login: supabase login
3) Link project: supabase link --project-ref YOUR_PROJECT_REF
4) Deploy: supabase functions deploy delete-account

Then in Supabase Dashboard > Project Settings > Edge Functions, set secrets:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

The app calls it via supabase.functions.invoke('delete-account').
