create index if not exists gallery_items_couple_created_at_idx
on public.gallery_items (couple_id, created_at desc);