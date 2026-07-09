create table invitations (

    id uuid primary key default gen_random_uuid(),

    story_id uuid not null
        references stories(id)
        on delete cascade,

    email text not null,

    status text not null default 'pending',

    created_at timestamptz default now()

);