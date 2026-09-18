-- ============================================================
-- 032 — LOVE NOTES JAR
--
-- A love note is a chat_messages row with kind = 'note'.
-- It arrives SEALED: only the sender can read the body in
-- the UI until the partner "discovers" it.
--
-- discovered_at is set through the discover_chat_note RPC
-- because the base UPDATE policy only lets a member edit
-- their own messages — the recipient must never rewrite
-- the note, only mark it opened.
-- ============================================================

alter table public.chat_messages
  add column if not exists discovered_at timestamptz;

create index if not exists chat_messages_notes_pending_idx
  on public.chat_messages (story_id, kind, discovered_at)
  where kind = 'note';

create or replace function public.discover_chat_note(
  p_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_msg public.chat_messages;
begin
  if v_uid is null then
    raise exception 'You must be signed in.';
  end if;

  select * into v_msg
  from public.chat_messages
  where id = p_message_id;

  if v_msg.id is null then
    raise exception 'Note not found.';
  end if;

  if v_msg.kind <> 'note' then
    raise exception 'That message is not a note.';
  end if;

  if not public.is_story_member(v_msg.story_id) then
    raise exception 'Not a member of this story.';
  end if;

  -- Only the partner discovers — the sender never
  -- "opens" their own note.
  if v_msg.sender_id = v_uid then
    raise exception 'You already know what it says 💕';
  end if;

  update public.chat_messages
     set discovered_at = now()
   where id = p_message_id
     and discovered_at is null;
end;
$$;

revoke all on function public.discover_chat_note(uuid) from public, anon;
grant execute on function public.discover_chat_note(uuid) to authenticated;
