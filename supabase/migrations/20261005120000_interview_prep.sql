-- Interview Practice Coach tables.
-- Run in the app's own Supabase project (interview-prep). Tables are prefixed ip_ and
-- readable/writable only by the row's owner.

CREATE TABLE public.ip_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '',
  job_description text NOT NULL DEFAULT '',
  resume text NOT NULL DEFAULT '',
  sample boolean NOT NULL DEFAULT false,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  state jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ip_sessions_user_created_idx ON public.ip_sessions (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ip_sessions TO authenticated;
GRANT ALL ON public.ip_sessions TO service_role;
ALTER TABLE public.ip_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ip_sessions" ON public.ip_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ip_stories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'behavioral' CHECK (category IN ('behavioral', 'technical')),
  question text NOT NULL,
  themes text[] NOT NULL DEFAULT '{}',
  answer text NOT NULL,
  score real NOT NULL,
  rewrite jsonb,
  sample boolean NOT NULL DEFAULT false,
  edited boolean NOT NULL DEFAULT false,
  saved_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ip_stories_user_idx ON public.ip_stories (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ip_stories TO authenticated;
GRANT ALL ON public.ip_stories TO service_role;
ALTER TABLE public.ip_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ip_stories" ON public.ip_stories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
