ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS bg_url text,
  ADD COLUMN IF NOT EXISTS bg_blur integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bg_dim integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS bg_text_theme text NOT NULL DEFAULT 'auto';

ALTER TABLE public.couples REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'couples'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.couples';
  END IF;
END $$;