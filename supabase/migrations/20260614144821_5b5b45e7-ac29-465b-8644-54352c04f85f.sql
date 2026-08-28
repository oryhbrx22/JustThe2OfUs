
CREATE TABLE public.game_sessions (
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('rps','ttt','wyr','tod')),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (couple_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can read game sessions"
ON public.game_sessions FOR SELECT TO authenticated
USING (public.is_couple_member(couple_id, auth.uid()));

CREATE POLICY "Couple members can insert game sessions"
ON public.game_sessions FOR INSERT TO authenticated
WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

CREATE POLICY "Couple members can update game sessions"
ON public.game_sessions FOR UPDATE TO authenticated
USING (public.is_couple_member(couple_id, auth.uid()))
WITH CHECK (public.is_couple_member(couple_id, auth.uid()));

CREATE POLICY "Couple members can delete game sessions"
ON public.game_sessions FOR DELETE TO authenticated
USING (public.is_couple_member(couple_id, auth.uid()));

ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
