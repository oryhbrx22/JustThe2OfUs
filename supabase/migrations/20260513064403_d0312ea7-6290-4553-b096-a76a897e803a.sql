
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  nickname text,
  avatar_url text,
  mood text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- COUPLES
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  started_at date,
  theme text default 'beige',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.couples enable row level security;

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
alter table public.couple_members enable row level security;

-- helper to check membership without recursion
create or replace function public.is_couple_member(_couple_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.couple_members where couple_id = _couple_id and user_id = _user_id)
$$;

create or replace function public.my_couple_id(_user_id uuid)
returns uuid language sql stable security definer set search_path=public as $$
  select couple_id from public.couple_members where user_id = _user_id limit 1
$$;

-- enforce max 2 members per couple
create or replace function public.enforce_couple_max_two()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'Couple is already full (max 2 members)';
  end if;
  return new;
end $$;
create trigger trg_couple_max_two before insert on public.couple_members
for each row execute function public.enforce_couple_max_two();

-- couples policies
create policy "members read couple" on public.couples for select to authenticated
  using (public.is_couple_member(id, auth.uid()) or created_by = auth.uid());
create policy "user creates couple" on public.couples for insert to authenticated
  with check (created_by = auth.uid());
create policy "members update couple" on public.couples for update to authenticated
  using (public.is_couple_member(id, auth.uid()));

-- couple_members policies
create policy "members read membership" on public.couple_members for select to authenticated
  using (user_id = auth.uid() or public.is_couple_member(couple_id, auth.uid()));
create policy "user joins couple" on public.couple_members for insert to authenticated
  with check (user_id = auth.uid());
create policy "user leaves couple" on public.couple_members for delete to authenticated
  using (user_id = auth.uid());

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text,
  kind text not null default 'text', -- text | image | audio
  media_url text,
  reaction text,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "members read messages" on public.messages for select to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members send messages" on public.messages for insert to authenticated
  with check (public.is_couple_member(couple_id, auth.uid()) and sender_id = auth.uid());
create policy "members update messages" on public.messages for update to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

alter publication supabase_realtime add table public.messages;
alter table public.messages replica identity full;

-- NOTES
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  mood text,
  is_private boolean not null default false,
  handwritten boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "members read shared notes" on public.notes for select to authenticated
  using (public.is_couple_member(couple_id, auth.uid()) and (is_private = false or author_id = auth.uid()));
create policy "members write notes" on public.notes for insert to authenticated
  with check (public.is_couple_member(couple_id, auth.uid()) and author_id = auth.uid());
create policy "author updates notes" on public.notes for update to authenticated
  using (author_id = auth.uid());
create policy "author deletes notes" on public.notes for delete to authenticated
  using (author_id = auth.uid());

-- GALLERY
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  caption text,
  album text default 'memories',
  is_favorite boolean not null default false,
  taken_at date,
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;
create policy "members read gallery" on public.gallery_items for select to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members upload gallery" on public.gallery_items for insert to authenticated
  with check (public.is_couple_member(couple_id, auth.uid()) and uploader_id = auth.uid());
create policy "members update gallery" on public.gallery_items for update to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members delete gallery" on public.gallery_items for delete to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

-- AUDIO
create table public.audio_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.audio_items enable row level security;
create policy "members read audio" on public.audio_items for select to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members add audio" on public.audio_items for insert to authenticated
  with check (public.is_couple_member(couple_id, auth.uid()) and uploader_id = auth.uid());
create policy "members update audio" on public.audio_items for update to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members delete audio" on public.audio_items for delete to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

-- BUCKET LIST
create table public.bucket_list (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.bucket_list enable row level security;
create policy "members read bucket" on public.bucket_list for select to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members write bucket" on public.bucket_list for insert to authenticated
  with check (public.is_couple_member(couple_id, auth.uid()));
create policy "members update bucket" on public.bucket_list for update to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));
create policy "members delete bucket" on public.bucket_list for delete to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

-- AUTO PROFILE on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values
  ('gallery','gallery', true),
  ('audio','audio', true),
  ('avatars','avatars', true),
  ('messages','messages', true)
on conflict do nothing;

-- storage policies (authenticated upload to own folder; public read)
create policy "public read gallery" on storage.objects for select using (bucket_id = 'gallery');
create policy "auth upload gallery" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "public read audio" on storage.objects for select using (bucket_id = 'audio');
create policy "auth upload audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "auth upload avatars" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "public read messages bucket" on storage.objects for select using (bucket_id = 'messages');
create policy "auth upload messages bucket" on storage.objects for insert to authenticated
  with check (bucket_id = 'messages' and (storage.foldername(name))[1] = auth.uid()::text);
