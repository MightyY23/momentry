-- ==========================================
-- MOMENTS: location + is_favorite
-- ==========================================

alter table public.moments
    add column if not exists location text;

alter table public.moments
    add column if not exists is_favorite
        boolean not null default false;

-- ==========================================
-- INDEXES
-- ==========================================

create index if not exists moments_story_id_idx
    on public.moments (story_id);

create index if not exists moments_memory_date_idx
    on public.moments (memory_date);
