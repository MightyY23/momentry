-- ==========================================
-- REALTIME: ENABLE MOMENTS
--
-- The moments table was missing from the
-- supabase_realtime publication, so every
-- realtime subscription to it (MomentsContext)
-- silently received nothing: favorites, adds,
-- edits and deletes never propagated between
-- the two partners without a manual reload.
-- ==========================================

alter publication supabase_realtime add table public.moments;
