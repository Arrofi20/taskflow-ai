-- AI Enhancements migration for MVP v2

-- 1. Add mata_kuliah to tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS mata_kuliah text;

-- 2. Add AI score and risk fields
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS ai_score integer,
  ADD COLUMN IF NOT EXISTS risk_percentage integer;

-- 3. Expand task type to include praktikum (drop and recreate check constraint if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_jenis_tugas_check'
  ) THEN
    ALTER TABLE public.tasks DROP CONSTRAINT tasks_jenis_tugas_check;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_jenis_tugas_check
      CHECK (jenis_tugas IN ('tugas','ujian','proyek','presentasi','praktikum'));
  END IF;
END $$;

-- 4. Create user_activity_logs for productive hour tracking
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS user_activity_logs_user_id_idx ON public.user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS user_activity_logs_active_at_idx ON public.user_activity_logs (active_at);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON public.user_activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
