-- Gamification: XP and skill progress, session kind/track/rank, and size limits on stored data.

CREATE TABLE public.ip_progress (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  answers integer NOT NULL DEFAULT 0 CHECK (answers >= 0),
  skills jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(skills) <= 4000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ip_progress TO authenticated;
GRANT ALL ON public.ip_progress TO service_role;
ALTER TABLE public.ip_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ip_progress" ON public.ip_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.ip_sessions
  ADD COLUMN kind text NOT NULL DEFAULT 'interview' CHECK (kind IN ('interview', 'drill')),
  ADD COLUMN track text NOT NULL DEFAULT '' CHECK (char_length(track) <= 40),
  ADD COLUMN tier smallint NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 5),
  ADD COLUMN completed boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT ip_sessions_size CHECK (
    char_length(role) <= 300
    AND char_length(job_description) <= 60000
    AND char_length(resume) <= 60000
    AND pg_column_size(questions) <= 300000
    AND pg_column_size(state) <= 600000
  );

ALTER TABLE public.ip_stories
  ADD CONSTRAINT ip_stories_size CHECK (
    char_length(role) <= 300
    AND char_length(question) <= 4000
    AND char_length(answer) <= 20000
    AND cardinality(themes) <= 20
    AND pg_column_size(rewrite) <= 20000
  );
