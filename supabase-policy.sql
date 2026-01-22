-- STEP 2: POLICY / TRUST / SHADOW / SUSPENSION SCHEMA
-- Run in Supabase SQL editor

-- Extend profiles with enforcement fields
alter table public.profiles
  add column if not exists trust_score int not null default 100,
  add column if not exists shadow_level text null check (shadow_level in ('soft','medium','hard')),
  add column if not exists suspended_until timestamptz null,
  add column if not exists deleted_at timestamptz null,
  add column if not exists standards_version int not null default 0,
  add column if not exists standards_accepted_at timestamptz null;

-- App-wide configuration (singleton)
create table if not exists public.app_config (
  id boolean primary key default true,
  standards_version int not null default 1,
  updated_at timestamptz not null default now(),
  constraint app_config_singleton check (id = true)
);

insert into public.app_config (id, standards_version)
values (true, 1)
on conflict (id) do nothing;

alter table public.app_config enable row level security;

-- Allow anyone to read config (safe: contains no secrets)
create policy if not exists "app_config read"
on public.app_config for select
to anon, authenticated
using (true);

-- Post moderation metadata (for removals)
alter table public.posts
  add column if not exists removed_at timestamptz null,
  add column if not exists removed_reason text null,
  add column if not exists removed_by uuid null references auth.users(id) on delete set null;

-- Deterministic soft-shadow sampling (replaces random())
-- Returns true ~30% of the time, but deterministically per (viewer, author, post)
create or replace function public.soft_shadow_visible(viewer uuid, author uuid, post_id uuid)
returns boolean
language sql
immutable
as $$
  select (
    (
      abs(
        (
          ('x' || substr(md5(viewer::text || author::text || post_id::text), 1, 8))::bit(32)::int
        )::bigint
      ) % 10
    ) < 3
  );
$$;

-- Audit log of policy-relevant events
create table if not exists public.policy_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('SCREENSHOT','REPORT','WARNING','MOD_REMOVE')),
  delta int not null,
  created_at timestamptz not null default now(),
  meta jsonb null
);

alter table public.policy_events enable row level security;

-- Users can read their own policy history (optional; keep server authoritative)
create policy if not exists "policy_events read own"
on public.policy_events for select
to authenticated
using (user_id = auth.uid());

-- Violations tracker (screenshot, etc)
create table if not exists public.policy_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('SCREENSHOT')),
  count int not null default 0,
  last_violation timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

alter table public.policy_violations enable row level security;

-- Users can read their own violations (optional)
create policy if not exists "policy_violations read own"
on public.policy_violations for select
to authenticated
using (user_id = auth.uid());

-- Harden existing post policies with suspension/deletion + trust gating + shadow feed logic
-- NOTE: this is best-effort; tune thresholds as needed.

-- Drop and recreate policies to incorporate additional constraints (safe in dev; in prod, review carefully)

do $$
begin
  -- POSTS select policy
  if exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts read (onboarding required)') then
    drop policy "posts read (onboarding required)" on public.posts;
  end if;

  -- POSTS insert policy
  if exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts insert own (onboarding required)') then
    drop policy "posts insert own (onboarding required)" on public.posts;
  end if;
end $$;

create policy "posts read (enforced)"
on public.posts for select
to authenticated
using (
  -- viewer must be onboarded and not suspended/deleted
  exists (
    select 1
    from public.profiles me
    where me.user_id = auth.uid()
      and me.onboarding_completed = true
      and me.standards_accepted_at is not null
      and me.standards_version = (select c.standards_version from public.app_config c where c.id = true)
      and (me.deleted_at is null)
      and (me.suspended_until is null or me.suspended_until < now())
  )
  and (public.posts.status = 'active')
  and (public.posts.removed_at is null)
  and (
    -- author always sees own posts
    author_id = auth.uid()
    or (
      -- feed-level shadow logic
      exists (
        select 1
        from public.profiles au
        where au.user_id = public.posts.author_id
          and au.deleted_at is null
          and (au.suspended_until is null or au.suspended_until < now())
          and (
            au.shadow_level is null
            or (au.shadow_level = 'soft' and public.soft_shadow_visible(auth.uid(), au.user_id, public.posts.id))
          )
      )
    )
  )
);

create policy "posts insert own (enforced)"
on public.posts for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.profiles me
    where me.user_id = auth.uid()
      and me.onboarding_completed = true
      and me.standards_accepted_at is not null
      and me.standards_version = (select c.standards_version from public.app_config c where c.id = true)
      and me.deleted_at is null
      and (me.suspended_until is null or me.suspended_until < now())
      and me.trust_score >= 40
  )
);

-- Post images: same shadow constraints as posts, and require not suspended/deleted

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='post_images' and policyname='post_images read (onboarding required)') then
    drop policy "post_images read (onboarding required)" on public.post_images;
  end if;
end $$;

create policy "post_images read (enforced)"
on public.post_images for select
to authenticated
using (
  exists (
    select 1
    from public.profiles me
    where me.user_id = auth.uid()
      and me.onboarding_completed = true
      and me.standards_accepted_at is not null
      and me.standards_version = (select c.standards_version from public.app_config c where c.id = true)
      and me.deleted_at is null
      and (me.suspended_until is null or me.suspended_until < now())
  )
  and exists (
    select 1
    from public.posts po
    join public.profiles au on au.user_id = po.author_id
    where po.id = post_id
      and po.status = 'active'
      and po.removed_at is null
      and (
        po.author_id = auth.uid()
        or (
          au.deleted_at is null
          and (au.suspended_until is null or au.suspended_until < now())
          and (
            au.shadow_level is null
            or (au.shadow_level = 'soft' and public.soft_shadow_visible(auth.uid(), au.user_id, po.id))
          )
        )
      )
  )
);
