-- TaskFlow AI initial schema
-- Run this in Supabase SQL Editor or via supabase db push

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  due_date timestamptz,
  priority smallint not null default 1 check (priority between 1 and 3),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  scheduled_date date not null,
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists study_schedules_user_date_idx on public.study_schedules (user_id, scheduled_date);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.study_schedules enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create policy "Users can view own schedules"
  on public.study_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own schedules"
  on public.study_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedules"
  on public.study_schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete own schedules"
  on public.study_schedules for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
