-- Link seeded role profiles to a newly created Supabase Auth account.
-- This prevents the users.email unique constraint from breaking signup.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  profile_email text := coalesce(new.email, concat(new.id, '@resqnova.local'));
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' in ('citizen', 'rescue', 'ambulance', 'shelter', 'hospital', 'admin')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'citizen'::public.user_role
  end;

  update public.users
  set auth_id = new.id,
      full_name = coalesce(new.raw_user_meta_data ->> 'full_name', full_name, new.email, 'ResQNova user'),
      phone = coalesce(new.phone, phone),
      role = requested_role
  where email = profile_email and auth_id is null;

  if found then
    return new;
  end if;

  insert into public.users (auth_id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'ResQNova user'),
    profile_email,
    new.phone,
    requested_role
  )
  on conflict (auth_id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role;

  return new;
end;
$$;
