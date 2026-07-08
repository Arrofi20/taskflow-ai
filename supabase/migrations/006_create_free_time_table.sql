-- Add free_time table for user availability slots

create table if not exists public.free_time (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  hari text not null check (hari in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  jam_mulai time not null,
  jam_selesai time not null,
  created_at timestamptz not null default now()
);

create index if not exists free_time_user_id_idx on public.free_time (user_id);
create index if not exists free_time_hari_idx on public.free_time (hari);

alter table public.free_time enable row level security;

create policy "Users can view own free_time"
  on public.free_time for select
  using (auth.uid() = user_id);

create policy "Users can insert own free_time"
  on public.free_time for insert
  with check (auth.uid() = user_id);

create policy "Users can update own free_time"
  on public.free_time for update
  using (auth.uid() = user_id);

create policy "Users can delete own free_time"
  on public.free_time for delete
  using (auth.uid() = user_id);
