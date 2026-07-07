-- AI priority analysis fields on tasks

alter table public.tasks
  add column if not exists prioritas smallint check (prioritas > 0),
  add column if not exists tingkat_kesulitan smallint check (tingkat_kesulitan between 1 and 10);

create index if not exists tasks_prioritas_idx on public.tasks (user_id, prioritas);
