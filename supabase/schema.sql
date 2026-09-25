-- ==============================================================================
-- Interview Coach — Supabase Database Migration (Foolproof & Idempotent)
-- Run the ENTIRE script in your Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Paste ALL -> Click RUN)
-- Make sure NO partial text is highlighted when you click RUN!
-- ==============================================================================

-- 0. Ensure required UUID extensions are enabled
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- (Optional) If you want a 100% clean reset, uncomment the 3 lines below:
-- drop table if exists public.session_patterns cascade;
-- drop table if exists public.evaluated_answers cascade;
-- drop table if exists public.interview_sessions cascade;

-- ==============================================================================
-- 1. Create interview_sessions table (Parent table)
-- ==============================================================================
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  target_level text not null,
  role_title text not null,
  company_name text not null,
  job_description text,
  stage text default 'interview' not null,
  level_readiness_score integer,
  level_readiness_label text,
  executive_summary text,
  questions jsonb default '[]'::jsonb,
  dimension_averages jsonb default '{}'::jsonb
);

-- Index for ordering sessions by recency
create index if not exists idx_interview_sessions_created_at 
  on public.interview_sessions(created_at desc);

-- ==============================================================================
-- 2. Create evaluated_answers table (Child table)
-- ==============================================================================
create table if not exists public.evaluated_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_id text not null,
  question_title text,
  category text,
  initial_answer text not null,
  follow_up_missing_element text,
  follow_up_prompt text,
  follow_up_answer text,
  combined_answer text,
  relevance_score integer,
  structure_score integer,
  product_sense_score integer,
  analytical_score integer,
  tradeoff_score integer,
  rubric_scores jsonb default '[]'::jsonb,
  rewritten_answer jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_evaluated_answers_session_id 
  on public.evaluated_answers(session_id);

-- ==============================================================================
-- 3. Create session_patterns table (Child table)
-- ==============================================================================
create table if not exists public.session_patterns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  pattern_type text not null,
  dimension text,
  title text not null,
  summary text,
  occurrences integer default 1,
  total_questions integer default 1,
  recommendation text,
  created_at timestamptz default now() not null
);

create index if not exists idx_session_patterns_session_id 
  on public.session_patterns(session_id);

-- ==============================================================================
-- 4. Enable Row Level Security (RLS)
-- ==============================================================================
alter table public.interview_sessions enable row level security;
alter table public.evaluated_answers enable row level security;
alter table public.session_patterns enable row level security;

-- ==============================================================================
-- 5. Safe Idempotent Policies (Drops old policies and recreates open policies)
-- ==============================================================================
do $$
begin
  -- Clean up any existing policies on interview_sessions
  drop policy if exists "Allow all on interview_sessions" on public.interview_sessions;
  drop policy if exists "Allow public select on interview_sessions" on public.interview_sessions;
  drop policy if exists "Allow public insert on interview_sessions" on public.interview_sessions;
  drop policy if exists "Allow public update on interview_sessions" on public.interview_sessions;
  drop policy if exists "Allow public delete on interview_sessions" on public.interview_sessions;
  
  -- Create open policy for interview_sessions
  create policy "Allow all on interview_sessions" 
    on public.interview_sessions for all 
    using (true) with check (true);

  -- Clean up any existing policies on evaluated_answers
  drop policy if exists "Allow all on evaluated_answers" on public.evaluated_answers;
  drop policy if exists "Allow public select on evaluated_answers" on public.evaluated_answers;
  drop policy if exists "Allow public insert on evaluated_answers" on public.evaluated_answers;
  drop policy if exists "Allow public update on evaluated_answers" on public.evaluated_answers;
  drop policy if exists "Allow public delete on evaluated_answers" on public.evaluated_answers;
  
  -- Create open policy for evaluated_answers
  create policy "Allow all on evaluated_answers" 
    on public.evaluated_answers for all 
    using (true) with check (true);

  -- Clean up any existing policies on session_patterns
  drop policy if exists "Allow all on session_patterns" on public.session_patterns;
  drop policy if exists "Allow public select on session_patterns" on public.session_patterns;
  drop policy if exists "Allow public insert on session_patterns" on public.session_patterns;
  drop policy if exists "Allow public delete on session_patterns" on public.session_patterns;
  
  -- Create open policy for session_patterns
  create policy "Allow all on session_patterns" 
    on public.session_patterns for all 
    using (true) with check (true);
end $$;

-- ==============================================================================
-- 6. Grant Permissions to anon & authenticated roles for Supabase PostgREST
-- ==============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.interview_sessions to anon, authenticated, service_role;
grant all on table public.evaluated_answers to anon, authenticated, service_role;
grant all on table public.session_patterns to anon, authenticated, service_role;
