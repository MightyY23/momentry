-- ==========================================
-- OCCASION GIFTS (022)
--
-- A sealed digital gift the partner wraps for
-- a birthday/anniversary:
--   * sender writes message + photo + box style
--     addressed to one occasion
--   * it appears SEALED on the recipient's
--     dashboard with a live countdown
--   * the MESSAGE/PHOTO stay server-side sealed
--     until open_date (RLS on the secrets table
--     checks the date — not just UI hiding)
--   * unwrap-once; revealed content stays visible
--
-- Two tables: metadata (realtime-friendly) and
-- secrets (content with date-locked SELECT).
-- ==========================================

create table if not exists public.occasion_gifts (
    id              uuid primary key default gen_random_uuid(),
    story_id        uuid not null references public.stories(id) on delete cascade,
    sender_id       uuid not null references auth.users(id) on delete cascade,
    recipient_id    uuid not null references auth.users(id) on delete cascade,
    occasion_kind   text not null check (occasion_kind in ('birthday','anniversary')),
    open_date       date not null,
    box_style       text not null default 'rose'
                    check (box_style in ('rose','gold','midnight','bloom')),
    sealed_at       timestamptz not null default now(),
    opened_at       timestamptz,
    created_at      timestamptz not null default now()
);

-- The sealed content lives apart so its RLS can
-- lock it until the occasion day.
create table if not exists public.occasion_gift_secrets (
    gift_id     uuid primary key references public.occasion_gifts(id) on delete cascade,
    message     text not null default '',
    photo_url   text
);

alter table public.occasion_gifts enable row level security;
alter table public.occasion_gift_secrets enable row level security;

-- ------------------------------------------
-- Helper: is `p_user_id` a member of the story?
-- (security definer so policies can check the
-- recipient's membership, not just my own)
-- ------------------------------------------
create or replace function public.is_story_member_user(
    p_story_id uuid,
    p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.story_members m
        where m.story_id = p_story_id
          and m.user_id = p_user_id
    );
$$;

revoke all on function public.is_story_member_user(uuid, uuid) from public, anon;
grant execute on function public.is_story_member_user(uuid, uuid) to authenticated;

-- ------------------------------------------
-- GIFT METADATA — both parties see the sealed
-- box (style + countdown). One gift per
-- sender/recipient/occasion/day.
-- ------------------------------------------

create unique index if not exists occasion_gifts_unique_slot
    on public.occasion_gifts (sender_id, recipient_id, occasion_kind, open_date);

create index if not exists occasion_gifts_recipient_idx
    on public.occasion_gifts (recipient_id, open_date);

create index if not exists occasion_gifts_story_idx
    on public.occasion_gifts (story_id);

-- Both gift parties (same story) see the box.
drop policy if exists "gift parties view box" on public.occasion_gifts;
create policy "gift parties view box"
    on public.occasion_gifts
    for select
    using (
        public.is_story_member(story_id)
        and (sender_id = auth.uid() or recipient_id = auth.uid())
    );

-- Wrap: I am the sender, the recipient is a
-- co-member of my story, not myself, and the
-- box opens today or in the future.
drop policy if exists "members can wrap gifts" on public.occasion_gifts;
create policy "members can wrap gifts"
    on public.occasion_gifts
    for insert
    with check (
        sender_id = auth.uid()
        and recipient_id <> auth.uid()
        and open_date >= current_date
        and public.is_story_member(story_id)
        and public.is_story_member_user(story_id, recipient_id)
    );

-- Unwrap: only the recipient, only when the
-- day has arrived (or already opened).
drop policy if exists "recipient can unwrap" on public.occasion_gifts;
create policy "recipient can unwrap"
    on public.occasion_gifts
    for update
    using (
        recipient_id = auth.uid()
        and (open_date <= current_date or opened_at is not null)
    )
    with check (
        recipient_id = auth.uid()
        and (open_date <= current_date or opened_at is not null)
    );

-- Sender may delete only an unopened gift.
drop policy if exists "sender deletes unopened" on public.occasion_gifts;
create policy "sender deletes unopened"
    on public.occasion_gifts
    for delete
    using (
        sender_id = auth.uid()
        and opened_at is null
    );

-- ------------------------------------------
-- SECRETS — the surprise. SELECT is refused
-- for the recipient until the day arrives;
-- the sender always sees their own words.
-- ------------------------------------------

drop policy if exists "sender writes secret" on public.occasion_gift_secrets;
create policy "sender writes secret"
    on public.occasion_gift_secrets
    for insert
    with check (
        exists (
            select 1 from public.occasion_gifts g
            where g.id = gift_id
              and g.sender_id = auth.uid()
        )
    );

drop policy if exists "party reads secret when open" on public.occasion_gift_secrets;
create policy "party reads secret when open"
    on public.occasion_gift_secrets
    for select
    using (
        exists (
            select 1 from public.occasion_gifts g
            where g.id = gift_id
              and (
                    g.sender_id = auth.uid()
                    or (
                        g.recipient_id = auth.uid()
                        and (g.open_date <= current_date or g.opened_at is not null)
                    )
                  )
        )
    );

drop policy if exists "sender deletes secret" on public.occasion_gift_secrets;
create policy "sender deletes secret"
    on public.occasion_gift_secrets
    for delete
    using (
        exists (
            select 1 from public.occasion_gifts g
            where g.id = gift_id
              and g.sender_id = auth.uid()
              and g.opened_at is null
        )
    );

-- ------------------------------------------
-- Realtime: the sealed box pops up on the
-- partner's dashboard instantly.
-- ------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'occasion_gifts'
  ) then
    alter publication supabase_realtime
        add table public.occasion_gifts;
  end if;
end $$;
