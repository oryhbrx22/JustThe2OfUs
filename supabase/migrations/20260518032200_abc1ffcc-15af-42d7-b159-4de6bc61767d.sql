CREATE TABLE public.gallery_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  name text NOT NULL,
  album_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read albums" ON public.gallery_albums
  FOR SELECT TO authenticated USING (is_couple_member(couple_id, auth.uid()));
CREATE POLICY "members insert albums" ON public.gallery_albums
  FOR INSERT TO authenticated WITH CHECK (is_couple_member(couple_id, auth.uid()));
CREATE POLICY "members update albums" ON public.gallery_albums
  FOR UPDATE TO authenticated USING (is_couple_member(couple_id, auth.uid()));
CREATE POLICY "members delete albums" ON public.gallery_albums
  FOR DELETE TO authenticated USING (is_couple_member(couple_id, auth.uid()));

ALTER TABLE public.gallery_items ADD COLUMN album_id uuid REFERENCES public.gallery_albums(id) ON DELETE SET NULL;
CREATE INDEX idx_gallery_items_album ON public.gallery_items(couple_id, album_id, created_at desc);
CREATE INDEX idx_gallery_albums_couple ON public.gallery_albums(couple_id, created_at desc);