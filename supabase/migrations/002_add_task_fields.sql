-- Add task type and estimated hours to tasks table

alter table public.tasks
  add column if not exists task_type text not null default 'tugas'
    check (task_type in ('tugas', 'ujian', 'proyek', 'presentasi'));

alter table public.tasks
  add column if not exists estimated_hours numeric(5, 1);

create index if not exists tasks_task_type_idx on public.tasks (task_type);
