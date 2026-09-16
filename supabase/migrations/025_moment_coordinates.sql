-- ==========================================
-- MOMENT COORDINATES
--
-- The location picker and capture-now flow
-- resolve real coordinates. Storing them
-- lets the Memory Map plot moments without
-- re-geocoding text labels.
-- ==========================================

alter table public.moments
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
