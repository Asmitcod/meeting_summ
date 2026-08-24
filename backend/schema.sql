-- ============================================================
-- Meeting Summarizer — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation (usually already enabled on Supabase)
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Table: meetings
-- ------------------------------------------------------------
create table if not exists public.meetings (
    id              uuid primary key default gen_random_uuid(),
    title           text not null,
    audio_path      text,                          -- path inside the 'audio' storage bucket
    transcript      text,
    summary         text,
    key_decisions   jsonb default '[]'::jsonb,      -- ["Decision 1", "Decision 2"]
    action_items    jsonb default '[]'::jsonb,      -- [{"task":"","owner":"","deadline":""}]
    status          text not null default 'pending' -- pending | processing | done | error
                        check (status in ('pending','processing','done','error')),
    error_message   text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- Keep updated_at fresh on every row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_meetings_updated_at on public.meetings;
create trigger trg_meetings_updated_at
    before update on public.meetings
    for each row
    execute function public.set_updated_at();

-- Helpful indexes
create index if not exists idx_meetings_status     on public.meetings (status);
create index if not exists idx_meetings_created_at on public.meetings (created_at desc);

-- ------------------------------------------------------------
-- Row Level Security
-- Backend talks to Supabase using the SERVICE ROLE key, which
-- bypasses RLS entirely — so RLS here just protects the table
-- from the public anon key (e.g. if it's ever exposed client-side).
-- ------------------------------------------------------------
alter table public.meetings enable row level security;

-- No policies added on purpose: with RLS on and zero policies,
-- the anon/public key gets ZERO access. Only the service_role
-- key (used exclusively by the FastAPI backend) can read/write.

-- ------------------------------------------------------------
-- Storage bucket: audio
-- Note: Supabase Storage buckets are usually created via the
-- Dashboard UI or JS/py client, but this also works via SQL.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

-- No storage policies added either — same reasoning as above.
-- The backend uses the service_role key, which bypasses Storage
-- RLS too, so the private bucket stays fully locked to the backend.

-- ============================================================
-- Done. Verify with:
--   select * from public.meetings limit 1;
--   select * from storage.buckets where id = 'audio';
-- ============================================================
