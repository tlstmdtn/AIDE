begin;

create table public.application_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.applications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name_age text not null check (length(btrim(name_age)) between 1 and 100),
  university_major text not null check (length(btrim(university_major)) between 1 and 200),
  ai_tools text[] not null check (
    cardinality(ai_tools) between 1 and 4
    and ai_tools <@ array['ChatGPT / Codex', 'Gemini', 'Claude', '기타']::text[]
    and array_position(ai_tools, null) is null
  ),
  ai_other text not null default '' check (length(ai_other) <= 200),
  motivation text not null check (length(btrim(motivation)) between 1 and 5000),
  residence text not null check (length(btrim(residence)) between 1 and 200),
  contact text not null check (
    length(contact) <= 30
    and contact !~ '[^0-9+()[:space:]-]'
    and regexp_replace(contact, '[^0-9]', '', 'g') ~ '^[0-9]{9,15}$'
  ),
  consent_at timestamptz not null default now(),
  check (not ('기타' = any(ai_tools)) or length(btrim(ai_other)) > 0)
);

create index applications_created_at_id_idx on public.applications (created_at desc, id desc);

alter table public.application_admins enable row level security;
alter table public.applications enable row level security;

revoke all on public.applications from anon, authenticated;
revoke all on public.application_admins from anon, authenticated;
grant select on public.applications, public.application_admins to authenticated;

create policy "Users can check only their own administrator membership"
  on public.application_admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Only registered administrators can read applications"
  on public.applications for select to authenticated
  using (exists (
    select 1 from public.application_admins
    where user_id = (select auth.uid())
  ));

-- Anonymous users can execute this validated insert-only function, but cannot
-- select, update or delete application records or assign administrator access.
create function public.submit_application(
  p_request_id uuid,
  p_name_age text,
  p_university_major text,
  p_ai_tools text[],
  p_ai_other text,
  p_motivation text,
  p_residence text,
  p_contact text,
  p_consent boolean
) returns table (application_id uuid, submitted_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.applications%rowtype;
  other_text text;
begin
  if p_consent is distinct from true or p_request_id is null then
    raise exception 'Valid request and consent are required' using errcode = '22023';
  end if;
  if p_ai_tools is null or cardinality(p_ai_tools) not between 1 and 4
    or array_position(p_ai_tools, null) is not null
    or (select count(distinct item) from unnest(p_ai_tools) item) <> cardinality(p_ai_tools) then
    raise exception 'Choose distinct AI tools' using errcode = '22023';
  end if;
  other_text := case when '기타' = any(p_ai_tools) then btrim(coalesce(p_ai_other, '')) else '' end;

  insert into public.applications (
    id, name_age, university_major, ai_tools, ai_other,
    motivation, residence, contact
  ) values (
    p_request_id, btrim(p_name_age), btrim(p_university_major), p_ai_tools,
    other_text, btrim(p_motivation), btrim(p_residence), btrim(p_contact)
  ) on conflict (id) do nothing
  returning * into saved;

  if not found then
    select * into strict saved from public.applications where id = p_request_id;
    if (saved.name_age, saved.university_major, saved.ai_tools, saved.ai_other,
        saved.motivation, saved.residence, saved.contact) is distinct from
       (btrim(p_name_age), btrim(p_university_major), p_ai_tools, other_text,
        btrim(p_motivation), btrim(p_residence), btrim(p_contact)) then
      raise exception 'Request ID belongs to a different submission' using errcode = '22023';
    end if;
  end if;

  return query select saved.id, saved.created_at;
end;
$$;

revoke all on function public.submit_application(uuid, text, text, text[], text, text, text, text, boolean) from public;
grant execute on function public.submit_application(uuid, text, text, text[], text, text, text, text, boolean) to anon, authenticated;

commit;
