-- Fix schema consistency: rename tables and columns to match database.types.ts
-- Run this if you previously ran an older version of 001_initial_schema.sql

-- Rename study_schedules to schedules if it exists and schedules doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_schedules')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules')
  THEN
    ALTER TABLE public.study_schedules RENAME TO schedules;
  END IF;
END $$;

-- Rename columns in tasks table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'title') THEN
    ALTER TABLE public.tasks RENAME COLUMN title TO nama_tugas;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
    ALTER TABLE public.tasks RENAME COLUMN due_date TO deadline;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'task_type') THEN
    ALTER TABLE public.tasks RENAME COLUMN task_type TO jenis_tugas;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'estimated_hours') THEN
    ALTER TABLE public.tasks RENAME COLUMN estimated_hours TO estimasi_waktu;
  END IF;
END $$;

-- Drop columns not present in database.types.ts
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS priority;

-- Ensure schedules RLS is enabled
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Recreate policies for schedules (drop old ones first if they reference study_schedules)
DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;

CREATE POLICY "Users can view own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON public.schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON public.schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Ensure trigger for new user profiles exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
