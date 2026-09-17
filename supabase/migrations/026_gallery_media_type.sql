-- ==========================================
-- GALLERY MEDIA TYPE
--
-- The Photo Wall now accepts videos as
-- well as photos. media_type distinguishes
-- them ('image' | 'video'); existing rows
-- default to 'image'.
-- ==========================================

alter table public.gallery_photos
  add column if not exists media_type text
  not null default 'image';
