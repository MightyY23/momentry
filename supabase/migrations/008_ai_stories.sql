-- ==========================================
-- AI STORIES
-- AI-generated narrative for a StoryBook.
-- One story can have several generations;
-- the newest completed one is displayed.
-- ==========================================

create table if not exists public.ai_stories (
    id uuid primary key default gen_random_uuid(),

    story_id uuid not null
        references public.stories(id)
        on delete cascade,

    title text,
    summary text,

    content jsonb,

    ai_model text,
    status text not null default 'pending',

    error_message text,

    started_at timestamptz,
    completed_at timestamptz,

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==========================================
-- STATUS CONSTRAINT
-- Values per PRD: pending | generating | completed | failed
-- ==========================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'ai_stories_status_check'
    ) then
        alter table public.ai_stories
            add constraint ai_stories_status_check
            check (status in ('pending', 'generating', 'completed', 'failed'));
    end if;
end
$$;

-- ==========================================
-- updated_at trigger
-- ==========================================

create or replace function public.set_ai_stories_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Only create our trigger when the table does
-- not already manage updated_at (some projects
-- have their own trigger + function). Prevents
-- duplicate triggers when applied to a live DB.
do $$
declare
    trigger_count int;
begin
    select count(*) into trigger_count
    from pg_trigger
    where tgrelid = 'public.ai_stories'::regclass
      and not tgisinternal
      and tgname ilike '%updated_at%';

    if trigger_count = 0 then
        create trigger on_ai_stories_updated
        before update on public.ai_stories
        for each row
        execute function public.set_ai_stories_updated_at();
    end if;
end
$$;

-- ==========================================
-- INDEXES
-- (story_id is usually covered by a unique
-- constraint index; only add if missing)
-- ==========================================

do $$
declare
    index_count int;
begin
    select count(*) into index_count
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'ai_stories'
      and indexdef ilike '%(story_id)%';

    if index_count = 0 then
        create index ai_stories_story_id_idx
            on public.ai_stories (story_id);
    end if;
end
$$;

create index if not exists ai_stories_created_at_idx
    on public.ai_stories (created_at desc);
