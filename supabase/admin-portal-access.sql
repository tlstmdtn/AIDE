-- Run AFTER adding the dedicated account in Supabase Authentication → Users.
-- Replace the placeholder with the UUID of the account YOU just created.
-- Set its password there, not in this file. Existing accounts are untouched.
-- Safe to rerun. Missing/unconfirmed accounts do not grant access to anyone.
begin;
do $$
declare
  created_user_id constant uuid := 'PASTE_CREATED_USER_UUID_HERE';
  portal_id uuid;
begin
  select id into portal_id
  from auth.users
  where lower(email) = 'admin@studyaide.vercel.app'
    and id = created_user_id
    and email_confirmed_at is not null
    and deleted_at is null;

  if portal_id is null then
    raise exception 'First create and auto-confirm admin@studyaide.vercel.app in Authentication > Users.';
  end if;

  insert into public.application_admins (user_id)
  values (portal_id)
  on conflict (user_id) do nothing;
end;
$$;
commit;
