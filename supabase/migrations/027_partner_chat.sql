-- ==========================================
-- PARTNER CHAT (027)
--
-- A private, realtime message thread for
-- the two people sharing a story.
--
-- 1. chat_messages table: id, story_id,
--    sender_id, body, image_url (optional
--    photo attachment), created_at.
-- 2. RLS: story members read the thread;
--    a user inserts/updates/deletes only
--    their OWN messages.
-- 3. The table joins supabase_realtime so
--    both partners receive messages with
--    no reloads.
-- ==========================================

create table if not exists public.chat_messages (

  id         uuid primary key default gen_random_uuid(),

  story_id   uuid not null references public.stories(id) on delete cascade,

  sender_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,

  body       text not null default '',

  image_url  text,

  created_at timestamptz not null default now()
);

create index if not exists chat_messages_story_created_idx
  on public.chat_messages (story_id, created_at asc);

alter table public.chat_messages enable row level security;

-- Both story members read the thread
create policy chat_messages_select_members
  on public.chat_messages
  for select
  to authenticated
  using (public.is_story_member(story_id));

-- A member may send — but only as themselves
create policy chat_messages_insert_own
  on public.chat_messages
  for insert
  to authenticated
  with check (
    public.is_story_member(story_id)
    and auth.uid() = sender_id
  );

-- Edit/delete your own messages only
create policy chat_messages_update_own
  on public.chat_messages
  for update
  to authenticated
  using (
    auth.uid() = sender_id
    and public.is_story_member(story_id)
  )
  with check (
    auth.uid() = sender_id
  );

create policy chat_messages_delete_own
  on public.chat_messages
  for delete
  to authenticated
  using (
    auth.uid() = sender_id
    and public.is_story_member(story_id)
  );

-- Realtime: deliver new rows to connected
-- partners instantly.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'chat_messages'
  ) then
    alter publication supabase_realtime
      add table public.chat_messages;
  end if;
end $$;

-- Storage: allow the bigger videos the
-- Photo Wall now accepts (100 MB).
update storage.buckets
  set file_size_limit = 104857600
  where id = 'moment-images';
