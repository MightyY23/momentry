-- ==========================================
-- Enable UUID extension
-- ==========================================

create extension if not exists "pgcrypto";

-- ==========================================
-- PROFILES
-- ==========================================

create table profiles (

    id uuid primary key references auth.users(id) on delete cascade,

    full_name text,

    avatar_url text,

    created_at timestamptz default now()

);

-- ==========================================
-- STORIES
-- ==========================================

create table stories (

    id uuid primary key default gen_random_uuid(),

    owner_id uuid not null references profiles(id) on delete cascade,

    title text not null,

    cover_photo text,

    created_at timestamptz default now()

);

-- ==========================================
-- STORY MEMBERS
-- ==========================================

create table story_members (

    id uuid primary key default gen_random_uuid(),

    story_id uuid not null references stories(id) on delete cascade,

    user_id uuid not null references profiles(id) on delete cascade,

    role text not null,

    created_at timestamptz default now(),

    unique (story_id, user_id)

);