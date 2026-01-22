-- SUPABASE SQL SETUP FOR THE FORUM
-- Run this in the Supabase SQL Editor

-- PROFILES
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'member' check (role in ('member','verified','host')),
  onboarding_completed boolean not null default false,
  standards_version int not null default 0,
  standards_accepted_at timestamptz null,
  invite_quota int not null default 2,
  created_at timestamptz not null default now()
);

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

-- INVITES
create table if not exists public.invites (
  code text primary key,
  issued_by uuid null references auth.users(id) on delete set null,
  redeemed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz null,
  status text not null default 'active' check (status in ('active','expired','redeemed'))
);

-- ACCESS REQUESTS (optional)
create table if not exists public.access_requests (
  id bigserial primary key,
  name text not null,
  email text not null,
  role_industry text not null,
  why_join text not null,
  referral text null,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now()
);

-- POSTS
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  has_images boolean not null default false,
  status text not null default 'active' check (status in ('active','removed')),
  removed_at timestamptz null,
  removed_reason text null,
  removed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- POST IMAGES
create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

-- REPORTS (for App Store compliance)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','user')),
  target_id text not null,
  reason text not null,
  details text null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.app_config enable row level security;
alter table public.invites enable row level security;
alter table public.access_requests enable row level security;
alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.reports enable row level security;

-- APP CONFIG POLICIES
create policy "app_config read"
on public.app_config for select
to anon, authenticated
using (true);

-- PROFILES POLICIES
create policy "profiles read own"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy "profiles insert own"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "profiles update own"
on public.profiles for update
to authenticated
using (user_id = auth.uid());

-- INVITES POLICIES
-- allow anyone (even anon) to validate invite code (select only)
create policy "invites select for validation"
on public.invites for select
to anon, authenticated
using (true);

-- only authenticated can mark redeemed, and only once
create policy "invites update redeem"
on public.invites for update
to authenticated
using (status = 'active')
with check (true);

-- ACCESS REQUESTS POLICIES (anon can insert)
create policy "access_requests insert"
on public.access_requests for insert
to anon, authenticated
with check (true);

-- POSTS POLICIES
create policy "posts read (onboarding required)"
on public.posts for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.onboarding_completed = true
  )
);

create policy "posts insert own (onboarding required)"
on public.posts for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.onboarding_completed = true
  )
);

-- allow author to soft-remove their own posts
create policy "posts update own"
on public.posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

-- POST IMAGES POLICIES
create policy "post_images read (onboarding required)"
on public.post_images for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.onboarding_completed = true
  )
);

create policy "post_images insert (onboarding required)"
on public.post_images for insert
to authenticated
with check (
  exists (
    select 1 from public.posts po
    where po.id = post_id
      and po.author_id = auth.uid()
  )
);

-- REPORTS POLICIES
create policy "reports insert"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());
