-- Sync schema: adds missing columns & tables to match codebase

-- 1. Add columns to tasks
alter table public.tasks
  add column if not exists completed_at timestamptz,
  add column if not exists actual_hours integer,
  add column if not exists mata_kuliah text,
  add column if not exists ai_score integer,
  add column if not exists risk_percentage integer;

-- 2. Add praktikum to jenis_tugas check constraint
alter table public.tasks drop constraint if exists tasks_jenis_tugas_check;
alter table public.tasks add constraint tasks_jenis_tugas_check
  check (jenis_tugas in ('tugas','ujian','proyek','presentasi','praktikum'));

-- 3. Create users table (replaces old profiles table)
create table if not exists public.users (
  id uuid references auth.users(id) primary key,
  email text,
  full_name text,
  is_premium boolean default false,
  premium_until timestamptz,
  onboarding_completed boolean default false,
  referral_code text unique,
  created_at timestamptz default now()
);

-- 4. Create supporting tables
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users(id),
  referred_id uuid references auth.users(id),
  referral_code text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.b2b_leads (
  id uuid default gen_random_uuid() primary key,
  institution_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists public.user_streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date,
  created_at timestamptz default now()
);

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- 5. Enable RLS
alter table public.users enable row level security;
alter table public.referrals enable row level security;
alter table public.user_streaks enable row level security;
alter table public.push_subscriptions enable row level security;

-- 6. Drop existing policies first
drop policy if exists "Users can only access their own profile" on public.users;
drop policy if exists "Users can only access their own referrals" on public.referrals;
drop policy if exists "Users can only access their own streaks" on public.user_streaks;
drop policy if exists "Users can only access their own push subscriptions" on public.push_subscriptions;

-- 7. Create policies
create policy "Users can only access their own profile"
  on public.users for all using (auth.uid() = id);

create policy "Users can only access their own referrals"
  on public.referrals for all using (auth.uid() = referrer_id);

create policy "Users can only access their own streaks"
  on public.user_streaks for all using (auth.uid() = user_id);

create policy "Users can only access their own push subscriptions"
  on public.push_subscriptions for all using (auth.uid() = user_id);

-- 8. Replace handle_new_user trigger function (was writing to profiles, now writes to users)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, referral_code)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    substring(md5(random()::text), 1, 8)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9. Create activity logs table (for AI productive hour tracking)
create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_activity_logs_user_id_idx on public.user_activity_logs (user_id);
create index if not exists user_activity_logs_active_at_idx on public.user_activity_logs (active_at);

alter table public.user_activity_logs enable row level security;

drop policy if exists "Users can view own activity logs" on public.user_activity_logs;
drop policy if exists "Users can insert own activity logs" on public.user_activity_logs;

create policy "Users can view own activity logs"
  on public.user_activity_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity logs"
  on public.user_activity_logs for insert
  with check (auth.uid() = user_id);
