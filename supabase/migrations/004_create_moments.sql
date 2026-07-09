create table moments (

    id uuid primary key default gen_random_uuid(),

    story_id uuid not null
        references stories(id)
        on delete cascade,

    title text not null,

    description text,

    memory_date date not null,

    created_by uuid not null
        references profiles(id)
        on delete cascade,

    created_at timestamptz default now()

);