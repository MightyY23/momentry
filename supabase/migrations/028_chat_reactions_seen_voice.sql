-- ==========================================
-- INSTAGRAM-STYLE CHAT UPGRADES (028)
--
-- 1. reactions jsonb: { userId: emoji }
--    for ❤️ 😂 😮 😢 😡 on any message.
-- 2. seen_at timestamptz: read receipts.
-- 3. kind text: 'text' | 'voice' | 'image'
--    + duration_ms for voice notes.
-- ==========================================

alter table public.chat_messages
  add column if not exists reactions
    jsonb not null default '{}'::jsonb;

alter table public.chat_messages
  add column if not exists seen_at timestamptz;

alter table public.chat_messages
  add column if not exists kind
    text not null default 'text';

alter table public.chat_messages
  add column if not exists duration_ms integer;

-- RLS note: the existing update policy
-- (chat_messages_update_own) limits UPDATEs
-- to the sender. Reactions and seen
-- receipts must also be settable by the
-- OTHER member, so widen UPDATE to story
-- members; body/urls immutability for the
-- partner is enforced in the app layer and
-- only reactions/seen_at change.

drop policy if exists chat_messages_update_own
  on public.chat_messages;

create policy chat_messages_update
  on public.chat_messages
  for update
  to authenticated
  using (public.is_story_member(story_id))
  with check (public.is_story_member(story_id));
