STEP 2 — Backend API Routes (Supabase Edge Functions)

These implement the required "routes" as Edge Functions (invoked via supabase.functions.invoke):

User routes (auth required)
- POST policy-event            (maps to POST /policy/event)
- POST policy-screenshot       (maps to POST /policy/screenshot)
- GET  user-enforcement        (maps to GET  /user/enforcement)

Admin routes (auth + role=host required)
- POST admin-user-shadow       (maps to POST /admin/user/shadow)
- POST admin-user-trust        (maps to POST /admin/user/trust)
- POST admin-user-delete       (maps to POST /admin/user/delete)
- GET  admin-user-policy-history (maps to GET /admin/user/policy-history)

Shared centralized logic (DO NOT DUPLICATE)
- supabase/functions/_shared/enforcement.ts
  - updateTrustScore(user, delta)
  - requireTrust(user, min)
  - computePrivileges(profile)

Database changes
- Run supabase-policy.sql in Supabase SQL editor.

Deploy
- supabase functions deploy policy-event
- supabase functions deploy policy-screenshot
- supabase functions deploy user-enforcement
- supabase functions deploy admin-user-shadow
- supabase functions deploy admin-user-trust
- supabase functions deploy admin-user-delete
- supabase functions deploy admin-user-policy-history

Env vars / secrets
- These functions expect SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
- Optional:
  - DELETE_AUTH_ON_PERMA_DELETE=true  (policy-screenshot: 3rd screenshot triggers auth user deletion)
  - ADMIN_DELETE_HARD=true            (admin-user-delete hard deletes auth user)

Notes
- Suspensions/deletions override trust logic.
- No user-facing explanations are returned beyond generic errors.
- Feed enforcement is implemented server-side via RLS in supabase-policy.sql (shadow logic for reads).
