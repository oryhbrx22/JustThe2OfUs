create or replace function public.join_couple_by_code(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _couple_id uuid;
  _uid uuid := auth.uid();
  _count int;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select id into _couple_id from public.couples where invite_code = upper(trim(_code));
  if _couple_id is null then
    raise exception 'Invite not found';
  end if;

  if exists (select 1 from public.couple_members where user_id = _uid) then
    raise exception 'You are already in a space';
  end if;

  select count(*) into _count from public.couple_members where couple_id = _couple_id;
  if _count >= 2 then
    raise exception 'This space is already full';
  end if;

  insert into public.couple_members (couple_id, user_id) values (_couple_id, _uid);
  return _couple_id;
end;
$$;

grant execute on function public.join_couple_by_code(text) to authenticated;