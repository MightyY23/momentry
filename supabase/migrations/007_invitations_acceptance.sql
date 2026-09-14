-- ==========================================
-- INVITATIONS: acceptance tracking
-- ==========================================

alter table public.invitations
    add column if not exists accepted_at timestamptz;

alter table public.invitations
    add column if not exists accepted_by uuid
        references auth.users(id) on delete set null;

-- ==========================================
-- STATUS CONSTRAINT
-- Values used by the app: pending | accepted | declined
-- ==========================================

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'invitations_status_check'
    ) then
        alter table public.invitations
            add constraint invitations_status_check
            check (status in ('pending', 'accepted', 'declined'));
    end if;
end
$$;

-- ==========================================
-- INDEXES
-- ==========================================

create index if not exists invitations_email_idx
    on public.invitations (lower(email));

create index if not exists invitations_story_id_idx
    on public.invitations (story_id);
