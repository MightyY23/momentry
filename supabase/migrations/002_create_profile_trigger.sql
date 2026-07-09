-- ==========================================
-- Function: Create profile after signup
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin

  insert into public.profiles (
    id,
    full_name,
    avatar_url
  )
  values (
    new.id,
    '',
    ''
  );

  return new;

end;
$$;

-- ==========================================
-- Trigger
-- ==========================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();