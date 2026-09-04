CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time time,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed boolean NOT NULL DEFAULT false,
  gcal_event_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Columna para guardar si el usuario quiere sync con Google Calendar
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcal_sync boolean NOT NULL DEFAULT false;
