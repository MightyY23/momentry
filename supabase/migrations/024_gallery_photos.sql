-- ==========================================
-- GALLERY PHOTOS (photos without memories)
--
-- A place for all the other photos — the
-- ones that don't need a date, a title or
-- a story: screenshots, random shots, the
-- hundred near-duplicates. They live in the
-- Gallery next to memory photos but stay
-- separate from moments.
-- ==========================================

create table if not exists public.gallery_photos (
  id         uuid primary key default gen_random_uuid(),
  story_id   uuid not null references public.stories(id) on delete cascade,
  added_by   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  image_url  text not null,
  created_at timestamptz not null default now()
);

create index if not exists gallery_photos_story_created_idx
  on public.gallery_photos (story_id, created_at desc);

alter table public.gallery_photos enable row level security;

-- Story members see the shared photo wall
create policy gallery_photos_select_members
  on public.gallery_photos
  for select
  using (public.is_story_member(story_id));

-- Any member can add photos of their own
create policy gallery_photos_insert_members
  on public.gallery_photos
  for insert
  with check (
    public.is_story_member(story_id)
    and auth.uid() = added_by
  );

-- Your own photos, or the story owner tidying up
create policy gallery_photos_delete_own_or_owner
  on public.gallery_photos
  for delete
  using (
    auth.uid() = added_by
    or public.is_story_owner(story_id)
  );

-- Realtime: new photos pop in for the partner
alter publication supabase_realtime add table public.gallery_photos;
