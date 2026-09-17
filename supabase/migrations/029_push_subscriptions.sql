-- ==========================================
-- PUSH SUBSCRIPTIONS (029)
--
-- One row per browser/device that opted
-- into web push. The Edge Function reads
-- these rows to fan out notifications.
-- ==========================================

create table if not exists public.push_subscriptions (

  id         uuid primary key default gen_random_uuid(),

  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,

  endpoint   text not null unique,

  keys       jsonb not null,

  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Users manage only their own devices
create policy push_subscriptions_all_own
  on public.push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
