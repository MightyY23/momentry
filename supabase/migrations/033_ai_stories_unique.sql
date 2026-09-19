-- ============================================================
-- 033 — AI STORIES UNIQUE STORY INDEX
--
-- The client contract treats ai_stories.story_id
-- as one-row-per-story (upsert on conflict).
-- Enforce it in the database so concurrent
-- generations can never create duplicates.
-- ============================================================

create unique index if not exists
  ai_stories_story_id_unique
  on public.ai_stories (story_id);
