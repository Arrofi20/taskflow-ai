-- ============================================================
-- FULL SCHEMA SYNC — Supabase SQL Editor
-- Paste semua ini ke SQL Editor lalu klik "Run"
-- Aman dijalankan berulang kali (semua pakai IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- 1. COLUMNS: tasks — tambah kolom yang belum ada
-- ============================================================
alter table public.tasks
  add column if not exists completed_at timestamptz,
  add column if not exists actual_hours integer,
  add column if not exists mata_kuliah text,
  add column if not exists ai_score integer,
  add column if not exists risk_percentage integer;

-- ============================================================
-- 2. CONSTRAINT: jenis_tugas — tambahkan 'praktikum'
-- ============================================================
alter table public.tasks drop constraint if exists tasks_jenis_tugas_check;
alter table public.tasks add constraint tasks_jenis_tugas_check
  check (jenis_tugas in ('tugas','ujian','proyek','presentasi','praktikum'));

-- ============================================================
-- 3. TABLE: users (menggantikan profiles lama)
-- ============================================================
create table if not exists public.users (
  id uuid references auth.users(id) primary key,
  email text,
  full_name text,
  is_premium boolean default false,
  premium_until timestamptz,
  onboarding_completed boolean default false,
  referral_code text unique,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- ============================================================
-- 4. TABLE: referrals
-- ============================================================
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users(id),
  referred_id uuid references auth.users(id),
  referral_code text not null,
  status text default 'pending',
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. TABLE: b2b_leads
-- ============================================================
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

-- ============================================================
-- 6b. TABLE: google_tokens
-- ============================================================
create table if not exists public.google_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) unique not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  calendar_id text default 'primary',
  sync_enabled boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 6c. TABLE: push_subscriptions
-- ============================================================
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. TABLE: alerts + RLS + policies
-- ============================================================
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  message text not null,
  severity text not null default 'medium',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 8. TABLE: user_activity_logs + indexes
-- ============================================================
create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_activity_logs_user_id_idx
  on public.user_activity_logs (user_id);
create index if not exists user_activity_logs_active_at_idx
  on public.user_activity_logs (active_at);

-- ============================================================
-- 8b. TABLE: activity_history (log semua aktivitas user)
-- ============================================================
create table if not exists public.activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  category text not null default 'other',
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_history_user_id_idx
  on public.activity_history (user_id);
create index if not exists activity_history_created_at_idx
  on public.activity_history (created_at desc);
create index if not exists activity_history_category_idx
  on public.activity_history (category);

-- ============================================================
-- 9. TABLE: indexes
-- ============================================================
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_deadline_idx on public.tasks (deadline);
create index if not exists tasks_prioritas_idx on public.tasks (prioritas);
create index if not exists schedules_user_date_idx
  on public.schedules (user_id, waktu_mulai);
create index if not exists free_time_user_id_idx on public.free_time (user_id);
create index if not exists free_time_hari_idx on public.free_time (hari);
create index if not exists alerts_user_created_idx
  on public.alerts (user_id, created_at desc);

-- ============================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.referrals enable row level security;
alter table public.b2b_leads enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.google_tokens enable row level security;
alter table public.alerts enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.activity_history enable row level security;

-- ============================================================
-- 11. DROP POLICIES LAMA (agar bisa re-create tanpa error)
-- ============================================================
-- users
drop policy if exists "Users can only access their own profile" on public.users;
drop policy if exists "Users can lookup referral codes" on public.users;
-- referrals
drop policy if exists "Users can only access their own referrals" on public.referrals;
drop policy if exists "Referral process can insert and read" on public.referrals;
-- b2b_leads
drop policy if exists "Allow anonymous inserts to b2b_leads" on public.b2b_leads;
drop policy if exists "Allow authenticated inserts to b2b_leads" on public.b2b_leads;
-- push_subscriptions
drop policy if exists "Users can only access their own push subscriptions" on public.push_subscriptions;
-- google_tokens
drop policy if exists "Users can manage their own Google tokens" on public.google_tokens;
-- alerts
drop policy if exists "Users can view own alerts" on public.alerts;
drop policy if exists "Users can insert own alerts" on public.alerts;
drop policy if exists "Users can update own alerts" on public.alerts;
drop policy if exists "Users can delete own alerts" on public.alerts;
-- user_activity_logs
drop policy if exists "Users can view own activity logs" on public.user_activity_logs;
drop policy if exists "Users can insert own activity logs" on public.user_activity_logs;
-- activity_history
drop policy if exists "Users can view own activity history" on public.activity_history;
drop policy if exists "Users can insert own activity history" on public.activity_history;

-- ============================================================
-- 12. CREATE POLICIES (RLS)
-- ============================================================

-- users: owner bisa akses data sendiri
create policy "Users can only access their own profile"
  on public.users for all
  using (auth.uid() = id);

-- users: allow authenticated SELECT untuk lookup referral_code
-- (diperlukan oleh referral system — user login perlu cari referrer lain)
create policy "Users can lookup referral codes"
  on public.users for select
  to authenticated
  using (true);

-- referrals: referrer_id OR referred_id boleh akses
create policy "Referral process can insert and read"
  on public.referrals for all
  using (auth.uid() = referrer_id or auth.uid() = referred_id)
  with check (auth.uid() = referrer_id or auth.uid() = referred_id);

-- b2b_leads: izinkan insert (form kontak B2B, tidak perlu auth)
create policy "Allow anonymous inserts to b2b_leads"
  on public.b2b_leads for insert
  to anon
  with check (true);

create policy "Allow authenticated inserts to b2b_leads"
  on public.b2b_leads for insert
  to authenticated
  with check (true);

-- push_subscriptions
create policy "Users can only access their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- google_tokens
create policy "Users can manage their own Google tokens"
  on public.google_tokens for all
  using (auth.uid() = user_id);

-- alerts
create policy "Users can view own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own alerts"
  on public.alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.alerts for delete
  using (auth.uid() = user_id);

-- user_activity_logs
create policy "Users can view own activity logs"
  on public.user_activity_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity logs"
  on public.user_activity_logs for insert
  with check (auth.uid() = user_id);

-- activity_history
create policy "Users can view own activity history"
  on public.activity_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity history"
  on public.activity_history for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 13. TRIGGER: handle_new_user — tulis ke public.users
-- ============================================================
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
